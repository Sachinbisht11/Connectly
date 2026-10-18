import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request, { SuperAgentTest } from 'supertest';

let mongo: MongoMemoryServer;
let app: ReturnType<typeof import('../src/app').createApp>;

type AuthedUser = { id: string; agent: SuperAgentTest };

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
  return { id: res.body.user.id, agent };
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const { createApp } = await import('../src/app');
  app = createApp();
  await mongoose.connect(process.env.MONGODB_URI!);

  // Create authenticated agents once, keeping request count under the rate limiter.
  users.alice = await createAuthedUser('alice@example.com');
  users.bob = await createAuthedUser('bob@example.com');
  users.carol = await createAuthedUser('carol@example.com');
  users.dan = await createAuthedUser('dan@example.com');
  users.erin = await createAuthedUser('erin@example.com');
  users.frank = await createAuthedUser('frank@example.com');
  users.mallory = await createAuthedUser('mallory@example.com');
  users.olga = await createAuthedUser('olga@example.com');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

function auth(email: string): SuperAgentTest {
  return users[email.split('@')[0]]!.agent;
}

describe('Conversations and messages', () => {
  it('creates a direct conversation between two users', async () => {
    const agent = auth('alice@example.com');

    const res = await agent
      .post('/api/conversations')
      .send({ participantId: users.bob.id });
    expect(res.status).toBe(201);
    expect(res.body.conversation.type).toBe('direct');
    expect(res.body.conversation.participantIds).toContain(users.alice.id);
    expect(res.body.conversation.participantIds).toContain(users.bob.id);
    expect(res.body.created).toBe(true);
  });

  it('reuses an existing direct conversation instead of duplicating', async () => {
    const agent = auth('carol@example.com');

    const first = await agent.post('/api/conversations').send({ participantId: users.dan.id });
    const second = await agent.post('/api/conversations').send({ participantId: users.dan.id });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(first.body.conversation.id).toBe(second.body.conversation.id);
    expect(second.body.created).toBe(false);
  });

  it('lists conversations for the current user', async () => {
    const agent = auth('erin@example.com');

    await agent.post('/api/conversations').send({ participantId: users.frank.id });

    const res = await agent.get('/api/conversations');
    expect(res.status).toBe(200);
    expect(res.body.conversations.length).toBeGreaterThanOrEqual(1);
  });

  it('sends a message and lists conversation history', async () => {
    const agent = auth('alice@example.com');

    const convRes = await agent
      .post('/api/conversations')
      .send({ participantId: users.bob.id });
    const conversationId = convRes.body.conversation.id;

    const sendRes = await agent
      .post(`/api/conversations/${conversationId}/messages`)
      .send({ textContent: 'Hello, world!' });
    expect(sendRes.status).toBe(201);
    expect(sendRes.body.message.textContent).toBe('Hello, world!');
    expect(sendRes.body.message.senderId).toBe(users.alice.id);

    const listRes = await agent.get(
      `/api/conversations/${conversationId}/messages`
    );
    expect(listRes.status).toBe(200);
    expect(listRes.body.messages.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.messages[0].textContent).toBe('Hello, world!');
  });

  it('paginates message history with cursor', async () => {
    const agent = auth('alice@example.com');

    const convRes = await agent
      .post('/api/conversations')
      .send({ participantId: users.bob.id });
    const conversationId = convRes.body.conversation.id;

    // Send several messages.
    for (let i = 0; i < 5; i++) {
      await agent
        .post(`/api/conversations/${conversationId}/messages`)
        .send({ textContent: `Message ${i}` });
    }

    const firstPage = await agent.get(
      `/api/conversations/${conversationId}/messages?limit=2`
    );
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.messages.length).toBe(2);
    expect(firstPage.body.hasMore).toBe(true);

    // `messages` are returned oldest-first, so the oldest message on the page
    // is the cursor for loading older messages.
    const lastId = firstPage.body.messages[0].id;
    const secondPage = await agent.get(
      `/api/conversations/${conversationId}/messages?limit=2&before=${lastId}`
    );
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.messages.length).toBe(2);
    // No duplicate messages across pages.
    const ids1 = firstPage.body.messages.map((m: { id: string }) => m.id);
    const ids2 = secondPage.body.messages.map((m: { id: string }) => m.id);
    expect(ids1.some((id: string) => ids2.includes(id))).toBe(false);
  });

  it('rejects sending a message to a conversation the user is not in', async () => {
    const agent = auth('alice@example.com');

    const convRes = await agent
      .post('/api/conversations')
      .send({ participantId: users.bob.id });
    const conversationId = convRes.body.conversation.id;

    // Mallory is not a participant.
    const res = await users.mallory.agent
      .post(`/api/conversations/${conversationId}/messages`)
      .send({ textContent: 'intruder' });
    expect(res.status).toBe(403);
  });

  it('rejects reading messages from a conversation the user is not in', async () => {
    const agent = auth('carol@example.com');

    const convRes = await agent
      .post('/api/conversations')
      .send({ participantId: users.dan.id });
    const conversationId = convRes.body.conversation.id;

    // Olga is not a participant.
    const res = await users.olga.agent.get(
      `/api/conversations/${conversationId}/messages`
    );
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated access to conversation endpoints', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.status).toBe(401);

    const res2 = await request(app).post('/api/conversations').send({});
    expect(res2.status).toBe(401);
  });
});
