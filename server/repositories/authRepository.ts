import { v4 as uuidv4 } from 'uuid';
import { getSingleQuery, runQuery } from '../db.ts';
import { User } from '../interfaces/user/User.ts';

export const createUser = async (name: string, email: string, passwordHash: string): Promise<User> => {
  const id = uuidv4();
  const sql = 'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email';
  const res = await runQuery(sql, [id, name, email, passwordHash]);
  return res.rows[0];
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const sql = 'SELECT * FROM users WHERE email = $1';
  return await getSingleQuery<User>(sql, [email]);
};

export const findUserById = async (id: string): Promise<User | undefined> => {
  const sql = 'SELECT id, name, email FROM users WHERE id = $1';
  return await getSingleQuery<User>(sql, [id]);
};
