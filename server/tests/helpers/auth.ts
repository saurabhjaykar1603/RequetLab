import jwt from 'jsonwebtoken';

export const createAuthCookie = (userId: string = 'user-1') => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'supersecret',
    { expiresIn: '2d' }
  );

  return `token=${token}`;
};
