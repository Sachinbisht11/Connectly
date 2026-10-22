import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request, { SuperAgentTest } from 'supertest';
import fs from 'node:fs/promises';

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

  users.alice = await createAuthedUser('alice@example.com');
  users.bob = await createAuthedUser('bob@example.com');
  users.mallory = await createAuthedUser('mallory@example.com');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

function auth(email: string): SuperAgentTest {
  return users[email.split('@')[0]]!.agent;
}

describe('Media attachments', () => {
  let conversationId: string;

  beforeAll(async () => {
    const res = await auth('alice@example.com')
      .post('/api/conversations')
      .send({ participantId: users.bob.id });
    expect(res.status).toBe(201);
    conversationId = res.body.conversation.id;
  });

  it('uploads an image attachment as a participant', async () => {
    const res = await auth('alice@example.com')
      .post(`/api/conversations/${conversationId}/media`)
      .attach('file', Buffer.from('fake-image-bytes'), 'photo.jpg');
    expect(res.status).toBe(201);
    expect(res.body.message.media).toMatchObject({
      originalName: 'photo.jpg',
      mimeType: 'image/jpeg',
    });
    expect(res.body.message.media.url).toMatch(/^\/api\/conversations\/media\//);
    expect(res.body.message.media.size).toBeGreaterThan(0);
    expect(res.body.message.type).toBe('image');
  });

  it('uploads a text file attachment as a participant', async () => {
    const res = await auth('bob@example.com')
      .post(`/api/conversations/${conversationId}/media`)
      .attach('file', Buffer.from('hello world'), 'notes.txt');
    expect(res.status).toBe(201);
    expect(res.body.message.media.originalName).toBe('notes.txt');
    expect(res.body.message.media.mimeType).toBe('text/plain');
  });

  it('rejects uploading media to a conversation the user is not in', async () => {
    const res = await auth('mallory@example.com')
      .post(`/api/conversations/${conversationId}/media`)
      .attach('file', Buffer.from('intruder'), 'x.txt');
    expect(res.status).toBe(403);
  });

  it('rejects uploading media unauthenticated', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/media`)
      .attach('file', Buffer.from('no-auth'), 'x.txt');
    expect(res.status).toBe(401);
  });

  it('serves an uploaded media file to a participant', async () => {
    const uploadRes = await auth('alice@example.com')
      .post(`/api/conversations/${conversationId}/media`)
      .attach('file', Buffer.from('image-bytes'), 'serve-me.png');
    expect(uploadRes.status).toBe(201);
    const mediaId = uploadRes.body.message.media.id;

    const res = await auth('alice@example.com').get(`/api/conversations/media/${mediaId}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.body).toEqual(Buffer.from('image-bytes'));
  });

  it('rejects serving media to a non-participant', async () => {
    const uploadRes = await auth('alice@example.com')
      .post(`/api/conversations/${conversationId}/media`)
      .attach('file', Buffer.from('private'), 'private.txt');
    expect(uploadRes.status).toBe(201);
    const mediaId = uploadRes.body.message.media.id;

    const res = await auth('mallory@example.com').get(`/api/conversations/media/${mediaId}`);
    expect(res.status).toBe(403);
  });

  it('rejects serving media unauthenticated', async () => {
    const uploadRes = await auth('alice@example.com')
      .post(`/api/conversations/${conversationId}/media`)
      .attach('file', Buffer.from('private2'), 'private2.txt');
    expect(uploadRes.status).toBe(201);
    const mediaId = uploadRes.body.message.media.id;

    const res = await request(app).get(`/api/conversations/media/${mediaId}`);
    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent media id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await auth('alice@example.com').get(`/api/conversations/media/${fakeId}`);
    expect(res.status).toBe(404);
  });
});
