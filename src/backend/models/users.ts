import db from '../db';
import { UserRole } from '../../common/constants-common';

export interface User {
  id: number;
  uuid: string;
  created: string;
  role: UserRole;
  fullName: string | null;
  email: string;
  discourseUserId: number;
}

export interface UserQueryResult {
  id: number;
  uuid: string;
  created: string;
  role: UserRole;
  full_name?: string;
  email: string;
  discourse_user_id: number;
}

export type UpsertUserParams = {
  discourseUserId?: number;
  fullName?: string;
  email?: string;
};

function queryResultToUser(row: UserQueryResult): User {
  return {
    id: row.id,
    uuid: row.uuid,
    created: row.created,
    role: row.role,
    fullName: row.full_name || null,
    email: row.email,
    discourseUserId: row.discourse_user_id,
  };
}

export async function upsertUser(userParams: UpsertUserParams): Promise<User | null> {
  try {
    const { discourseUserId, email, fullName } = userParams;
    const queryText = `
      INSERT INTO users (discourse_user_id, email, full_name)
      VALUES ($1::int, $2::text, $3::text)
      ON CONFLICT ON CONSTRAINT users_discourse_user_id_key
      DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name
      RETURNING *;
    `;
    const queryValues = [discourseUserId, email, fullName];
    const result = await db.query<UserQueryResult>(queryText, queryValues);
    return queryResultToUser(result.rows[0]);
  } catch (err) {
    console.error('Failed to create or update user');
    console.error(err);
    return null;
  }
}

export async function getUsers(): Promise<Array<User> | null> {
  try {
    const queryText = `
      SELECT *
      FROM users;
    `;
    const result = await db.query<UserQueryResult>(queryText, []);
    return result.rows.map((r) => queryResultToUser(r));
  } catch (err) {
    console.error('Failed to fetch all users');
    console.error(err);
    return null;
  }
}

export async function getUserByUuid(uuid: User['uuid']): Promise<User | null> {
  try {
    const queryText = `
      SELECT *
      FROM users
      WHERE uuid = $1::text;
    `;
    const queryValues = [uuid];
    const result = await db.query<UserQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToUser(result.rows[0]);
  } catch (err) {
    console.error(`User ${uuid} not found`);
    console.error(err);
    return null;
  }
}

export async function updateUserRole({
  role,
  uuid,
}: {
  role: UserRole;
  uuid: User['uuid'];
}): Promise<User | null> {
  try {
    const queryText = `
      UPDATE users
      SET role = $1::text
      WHERE uuid = $2::text
      RETURNING *;
    `;
    const queryValues = [role, uuid];
    const result = await db.query<UserQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToUser(result.rows[0]);
  } catch (err) {
    console.error(`User ${uuid} not found`);
    console.error(err);
    return null;
  }
}
