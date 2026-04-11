import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthCookie } from '../helpers/auth.ts';

vi.mock('../../repositories/authRepository.ts', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock('../../repositories/activityRepository.ts', () => ({
  logActivity: vi.fn(),
  getActivityLogs: vi.fn(),
  getActivityLogsCount: vi.fn(),
}));

const authRepository = await import('../../repositories/authRepository.ts');
const { buildApp } = await import('../../app.ts');

describe('auth routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp({ logger: false, serveClient: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a user and sets the auth cookie on signup', async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(undefined);
    vi.mocked(authRepository.createUser).mockResolvedValue({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/signup',
      payload: {
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret123',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      user: {
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
      },
    });
    expect(response.headers['set-cookie']).toContain('token=');
  });

  it('rejects duplicate signup attempts', async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
      id: 'user-1',
      email: 'ada@example.com',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/signup',
      payload: {
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret123',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'User already exists' });
  });

  it('rejects login when the user does not exist', async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'missing@example.com',
        password: 'secret123',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'Invalid credentials' });
  });

  it('rejects login when the password is incorrect', async () => {
    const password = await bcrypt.hash('correct-password', 4);

    vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      password,
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'ada@example.com',
        password: 'wrong-password',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'Invalid credentials' });
  });

  it('clears the auth cookie on logout', async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: {
        cookie: createAuthCookie(),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true });
    expect(response.headers['set-cookie']).toContain('token=');
  });

  it('updates the authenticated user profile', async () => {
    vi.mocked(authRepository.updateUserProfile).mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      jobTitle: 'Engineer',
      company: 'RequestLab',
      bio: 'Building API flows',
      avatarUrl: 'https://example.com/avatar.png',
    } as any);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/auth/profile',
      headers: {
        cookie: createAuthCookie(),
      },
      payload: {
        name: 'Ada Lovelace',
        jobTitle: 'Engineer',
        company: 'RequestLab',
        bio: 'Building API flows',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: {
        id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        jobTitle: 'Engineer',
        company: 'RequestLab',
        bio: 'Building API flows',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });
  });
});
