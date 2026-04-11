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
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '5d' });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 24 * 60 * 60 // 5 days in seconds
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
    if (!user.password) {
      if (user.googleId) {
        return reply.status(401).send({ error: 'This account uses Google Login. Please log in with Google.' });
      }
      return reply.status(401).send({ error: 'No password set for this account. Please use social login or reset your password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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

export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const user = await authRepository.findUserById(userId);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({ user });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const googleCallback = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const fastify = request.server as any;
    const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    
    // Fetch user info from Google
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    
    if (!userinfoRes.ok) {
      throw new Error('Failed to fetch user info from Google');
    }
    
    const googleUser = await userinfoRes.json() as any;
    const { id: googleId, email, name, picture } = googleUser;
    
    // 1. Try to find user by googleId
    let user = await authRepository.findUserByGoogleId(googleId);
    
    if (!user) {
      // 2. Try to find user by email
      user = await authRepository.findUserByEmail(email);
      
      if (user) {
        // Link existing account
        await authRepository.updateUserGoogleId(user.id, googleId, picture);
        user.googleId = googleId;
        user.avatarUrl = picture;
      } else {
        // 3. Create new user
        user = await authRepository.createUser(name || email.split('@')[0], email, undefined, googleId, picture);
      }
    } else if (picture) {
      // Update avatar if it changed or was missing
      await authRepository.updateUserAvatar(user.id, picture);
      user.avatarUrl = picture;
    }
    
    // Create JWT token
    const jwtToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '5d' });
    
    // Set cookie
    reply.setCookie('token', jwtToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use lax for OAuth redirects
      maxAge: 5 * 24 * 60 * 60 // 5 days in seconds
    });
    
    // Redirect to frontend
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
    return reply.redirect(`${CLIENT_URL}/login?auth=success`);
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
    return reply.redirect(`${CLIENT_URL}/login?error=${encodeURIComponent(error.message)}`);
  }
};
