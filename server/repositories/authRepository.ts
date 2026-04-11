import { v4 as uuidv4 } from 'uuid';
import { getSingleQuery, runQuery } from '../db.ts';
import { User } from '../interfaces/user/User.ts';
import { logActivity } from './activityRepository.ts';

const USER_SELECT_FIELDS = 'id, name, email, password, "googleId", "avatarUrl", "jobTitle", company, bio';
const USER_SELECT_PUBLIC_FIELDS = 'id, name, email, "googleId", "avatarUrl", "jobTitle", company, bio';

export const createUser = async (name: string, email: string, passwordHash?: string, googleId?: string, avatarUrl?: string): Promise<User> => {
  const id = uuidv4();
  const sql = `INSERT INTO users (id, name, email, password, "googleId", "avatarUrl")
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${USER_SELECT_PUBLIC_FIELDS}`;
  const res = await runQuery(sql, [id, name, email, passwordHash, googleId, avatarUrl]);
  const user = res.rows[0];
  if (user) {
    await logActivity(user.id, undefined, 'SIGNUP', 'USER', user.id, user.name, `New user registered: ${user.email}${googleId ? ' (via Google)' : ''}`);
  }
  return user;
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const sql = `SELECT ${USER_SELECT_FIELDS} FROM users WHERE email = $1`;
  return await getSingleQuery<User>(sql, [email]);
};

export const findUserByGoogleId = async (googleId: string): Promise<User | undefined> => {
  const sql = `SELECT ${USER_SELECT_PUBLIC_FIELDS} FROM users WHERE "googleId" = $1`;
  return await getSingleQuery<User>(sql, [googleId]);
};

export const updateUserGoogleId = async (id: string, googleId: string, avatarUrl?: string): Promise<void> => {
  if (avatarUrl) {
    const sql = 'UPDATE users SET "googleId" = $1, "avatarUrl" = $2 WHERE id = $3';
    await runQuery(sql, [googleId, avatarUrl, id]);
  } else {
    const sql = 'UPDATE users SET "googleId" = $1 WHERE id = $2';
    await runQuery(sql, [googleId, id]);
  }
};

export const updateUserAvatar = async (id: string, avatarUrl: string): Promise<void> => {
  const sql = 'UPDATE users SET "avatarUrl" = $1 WHERE id = $2';
  await runQuery(sql, [avatarUrl, id]);
};

export const findUserById = async (id: string): Promise<User | undefined> => {
  const sql = `SELECT ${USER_SELECT_PUBLIC_FIELDS} FROM users WHERE id = $1`;
  return await getSingleQuery<User>(sql, [id]);
};

export interface UserProfileUpdateInput {
  name: string;
  jobTitle?: string | null;
  company?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export const updateUserProfile = async (id: string, profile: UserProfileUpdateInput): Promise<User | undefined> => {
  const sql = `
    UPDATE users
    SET name = $2,
        "jobTitle" = $3,
        company = $4,
        bio = $5,
        "avatarUrl" = $6,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING ${USER_SELECT_PUBLIC_FIELDS}
  `;
  const result = await runQuery(sql, [
    id,
    profile.name,
    profile.jobTitle ?? null,
    profile.company ?? null,
    profile.bio ?? null,
    profile.avatarUrl ?? null,
  ]);
  return result.rows[0];
};
