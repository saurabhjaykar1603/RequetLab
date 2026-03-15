import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authRepository from '../repositories/authRepository.ts';
import { logActivity } from '../repositories/activityRepository.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const signup = async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
  try {
    const { name, email, password } = request.body as any;
    
    // Check if user exists
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      return reply.status(400).send({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await authRepository.createUser(name, email, passwordHash);

    // Create token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '2d' });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 24 * 60 * 60 // 2 days in seconds
    });

    return reply.status(201).send({ user });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const login = async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
  try {
    const { email, password } = request.body as any;

    // Find user
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '2d' });

    // Remove password from user object
    delete user.password;

    await logActivity(user.id, undefined, 'LOGIN', 'USER', user.id, user.name, `User logged in: ${user.email}`);

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 24 * 60 * 60 // 2 days in seconds
    });

    return reply.send({ user });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.id;
    if (userId) {
      const user = await authRepository.findUserById(userId);
      await logActivity(userId, undefined, 'SIGNOUT', 'USER', userId, user?.name, `User logged out: ${user?.email}`);
    }
    reply.clearCookie('token', { path: '/' });
    return reply.send({ success: true });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};
