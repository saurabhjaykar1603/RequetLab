import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.js';

export const getAllEnvironments = async () => {
  return await getQuery('SELECT * FROM environments ORDER BY createdAt DESC');
};

export const createEnvironment = async (name, variables) => {
  const id = uuidv4();
  await runQuery(
    'INSERT INTO environments (id, name, variables) VALUES (?, ?, ?)',
    [id, name, variables ? JSON.stringify(variables) : JSON.stringify({})]
  );
  return await getSingleQuery('SELECT * FROM environments WHERE id = ?', [id]);
};
