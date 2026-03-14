import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, getSingleQuery } from '../db.ts';
import { Environment } from '../interfaces/environment/Environment.ts';

export const getAllEnvironments = async (): Promise<Environment[]> => {
  return await getQuery<Environment>('SELECT * FROM environments ORDER BY "createdAt" DESC');
};

export const createEnvironment = async (name: string, variables: any): Promise<Environment | undefined> => {
  const id = uuidv4();
  await runQuery(
    'INSERT INTO environments (id, name, variables) VALUES ($1, $2, $3)',
    [id, name, variables ? (typeof variables === 'string' ? variables : JSON.stringify(variables)) : JSON.stringify({})]
  );
  return await getSingleQuery<Environment>('SELECT * FROM environments WHERE id = $1', [id]);
};
