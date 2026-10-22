import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { io as client } from 'socket.io-client';
import request, { SuperAgentTest } from 'supertest';
import { createApp } from '../src/app';
import { authenticateSocket } from '../src/sockets/auth';
import { registerMessageHandlers } from '../src/sockets/messages';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

let mongo: MongoMemoryServer;
let app: ReturnType<typeof import('../src/app').createApp>;

let httpServer: ReturnType<typeof createServer>;
let io: IOServer;
let socketUrl: string;

type AuthedUser = { id: string; email: string; token: string; agent: SuperAgentTest };

const users: Record<string, AuthedUser> = {};

async function createAuthedUser(
  email: string,
  password = 'Str0ngP@ssword!'
): Promise<AuthedUser> {
  const displayName = email.split('@')[0];
  const agent = request.agent(app);
  // Register (may be 409 if user already exists).
  await agent.post('/api/auth/register').send({ displayName, email, password });
  const res = await agent.post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  const { id: userId } = res.body.user as { id: string };
  const { token } = res.body as { token: string };
  return { id: userId, email, token, agent };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const { createApp } = await import('../src/app');
  app = createApp();
  await mongoose.connect(process.env.MONGODB_URI!);

  users.alice = await createAuthedUser('alice@example.com');
  users.bob = await createAuthedUser('bob@example.com');

  // Build a Socket.IO server on a separate http server for socket testing.
  httpServer = createServer(app);
  io = new IOServer(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });
  io.use(authenticateSocket);
  registerMessageHandlers(io);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  socketUrl = `http://localhost:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => io.close(resolve));
  await new Promise<void>((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  await mongo.stop();
});

function socketClient(token: string) {
  return client(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    forceNew: true,
  });
}

function waitFor<T>(socket: ReturnType<typeof client>, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.once(event, (data: T) => resolve(data));
    setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), 5000);
  });
}

describe('Socket.IO real-time messaging', () => {
  let aliceSocket: ReturnType<typeof client>;
  let bobSocket: ReturnType<typeof client>;

  beforeEach(async () => {
    aliceSocket = socketClient(users.alice.token);
    bobSocket = socketClient(users.bob.token);
    await Promise.all([waitFor<void>(aliceSocket, 'connect'), waitFor<void>(bobSocket, 'connect')]);
  });

  afterEach(() => {
    aliceSocket.close();
    bobSocket.close();
  });

  it('authenticates a socket connection with a valid token', async () => {
    // Both sockets connected above without error.
    expect(aliceSocket.connected).toBe(true);
    expect(bobSocket.connected).toBe(true);
  });

  it('rejects a socket connection without a token', async () => {
    const bad = client(socketUrl, { auth: {}, transports: ['websocket', 'polling'], forceNew: true });
    // connect_error is emitted once.
    const errEvent = await new Promise<Error | null>((resolve) => {
      bad.once('connect_error', (e: Error) => resolve(e));
      setTimeout(() => resolve(null), 3000);
    });
    bad.close();
    expect(errEvent?.message).toContain('Authentication required');
  });

  it('broadcasts a new message to the recipient in real time', async () => {
    // Alice starts a conversation with Bob via REST.
    const convRes = await users.alice.agent
      .post('/api/conversations')
      .send({ participantId: users.bob.id });
    expect(convRes.status).toBe(201);
    const conversationId = convRes.body.conversation.id;

    // Both join the conversation room.
    aliceSocket.emit('message:join', { conversationId });
    bobSocket.emit('message:join', { conversationId });

    // Alice sends a message through the socket.
    const ack = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      aliceSocket.emit(
        'message:send',
        { conversationId, textContent: 'Hello over socket!' },
        (res: { ok: boolean; error?: string }) => resolve(res)
      );
    });
    expect(ack.ok).toBe(true);

    // Bob receives the message without refreshing.
    const received = await waitFor<{ id: string; textContent: string; senderId: string }>(
      bobSocket,
      'message:new'
    );
    expect(received.textContent).toBe('Hello over socket!');
    expect(received.senderId).toBe(users.alice.id);
  });

  it('enforces membership authorization before joining a room', async () => {
    // Carol is not a participant of Alice's conversation.
    users.carol = await createAuthedUser('carol@example.com');
    const carolSocket = socketClient(users.carol.token);
    await waitFor<void>(carolSocket, 'connect');

    const convRes = await users.alice.agent
      .post('/api/conversations')
      .send({ participantId: users.bob.id });
    const conversationId = convRes.body.conversation.id;

    // Carol tries to join; server should not add her to the room.
    carolSocket.emit('message:join', { conversationId });

    // Alice sends; Carol should not receive it.
    aliceSocket.emit('message:join', { conversationId });
    const sendAck = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      aliceSocket.emit(
        'message:send',
        { conversationId, textContent: 'private' },
        (res: { ok: boolean; error?: string }) => resolve(res)
      );
    });
    expect(sendAck.ok).toBe(true);

    const received = await new Promise<{ id: string } | null>((resolve) => {
      carolSocket.once('message:new', (data) => resolve(data));
      setTimeout(() => resolve(null), 1500);
    });
    carolSocket.close();
    expect(received).toBeNull();
  });

  it('reuses the same service as REST so a socket-sent message is persisted', async () => {
    const convRes = await users.alice.agent
      .post('/api/conversations')
      .send({ participantId: users.bob.id });
    const conversationId = convRes.body.conversation.id;

    aliceSocket.emit('message:join', { conversationId });
    bobSocket.emit('message:join', { conversationId });

    await new Promise<{ ok: boolean }>((resolve) => {
      aliceSocket.emit(
        'message:send',
        { conversationId, textContent: 'persisted via socket' },
        (res: { ok: boolean }) => resolve(res)
      );
    });

    // Fetch via REST and confirm the message is stored.
    const listRes = await users.alice.agent.get(
      `/api/conversations/${conversationId}/messages`
    );
    expect(listRes.status).toBe(200);
    expect(listRes.body.messages.some((m: { textContent: string }) => m.textContent === 'persisted via socket')).toBe(true);
  });
});
