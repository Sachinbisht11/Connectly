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

const baseUser = {
  displayName: 'Alex Rivera',
  email: 'alice@example.com',
  password: 'Str0ngP@ssword!',
};

describe('Auth and user profiles', () => {
  it('registers a new user and returns no password hash', async () => {
    const res = await request(app).post('/api/auth/register').send(baseUser);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      displayName: 'Alex Rivera',
      email: 'alice@example.com',
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.id).toBeDefined();
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register').send(baseUser);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  it('rejects invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ displayName: 'A', email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Str0ngP@ssword!' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects unknown user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@example.com', password: 'Str0ngP@ssword!' });
    expect(res.status).toBe(401);
  });

  it('returns current user with a valid cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Str0ngP@ssword!',
    });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects unauthenticated access to /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('logs out and clears the cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Str0ngP@ssword!',
    });

    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(200);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });

  it('updates the current user profile without exposing private fields', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Str0ngP@ssword!',
    });

    await request(app).post('/api/auth/register').send({
      displayName: 'Bob',
      email: 'bob@example.com',
      password: 'Str0ngP@ssword!',
    });

    const res = await agent.patch('/api/users/me').send({
      displayName: 'Alex Updated',
      about: 'Hello world',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe('Alex Updated');
    expect(res.body.user.about).toBe('Hello world');
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});
