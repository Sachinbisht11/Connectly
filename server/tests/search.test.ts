import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

let mongo: MongoMemoryServer;
let app: ReturnType<typeof import('../src/app').createApp>;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const { createApp } = await import('../src/app');
  app = createApp();
  await mongoose.connect(process.env.MONGODB_URI!);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function register(
  agent: ReturnType<typeof request.agent>,
  email: string
) {
  await agent
    .post('/api/auth/register')
    .send({ displayName: 'User', email, password: 'Str0ngP@ssword!' });
}

describe('User search', () => {
  it('returns users matching query without exposing private fields', async () => {
    const agent = request.agent(app);

    await register(agent, 'alice@example.com');
    await register(agent, 'bob@example.com');
    await register(agent, 'carol@example.com');

    await agent
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Str0ngP@ssword!' });

    const res = await agent.get('/api/users/search?q=al');
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(1);

    const match = res.body.users.find(
      (u: { email?: string }) => u.email === 'alice@example.com'
    );
    expect(match).toBeUndefined(); // email not exposed

    for (const u of res.body.users) {
      expect(u.passwordHash).toBeUndefined();
      expect(u.id).toBeDefined();
      expect(u.displayName).toBeDefined();
    }
  });

  it('rejects empty search query', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Str0ngP@ssword!' });

    const res = await agent.get('/api/users/search?q=');
    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated search', async () => {
    const res = await request(app).get('/api/users/search?q=al');
    expect(res.status).toBe(401);
  });
});
