import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authRepository from '../repositories/authRepository.ts';

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
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    return reply.status(201).send({ user, token });
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
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    // Remove password from user object
    delete user.password;

    return reply.send({ user, token });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};
