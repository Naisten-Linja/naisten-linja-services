import db from '../db';
import { UserRole } from '../../common/constants-common';

export interface User {
  id: number;
  uuid: string;
  created: number;
  role: 'staff' | 'volunteer';

  fullName: string | null;
  email: string;
  discourseUserId: number;
}

export type UpsertUserParams = {
  discourseUserId?: number;
  fullName?: string;
  email?: string;
  role?: UserRole;
};

export async function upsertUser(userParams: UpsertUserParams): Promise<User | null> {
  try {
    const client = await db.getClient();
    const { discourseUserId, email, fullName, role } = userParams;
    const queryText = `
      INSERT INTO users (discourse_user_id, email, full_name, role)
      VALUES ($1::int, $2::text, $3::text, $4::text)
      ON CONFLICT ON CONSTRAINT users_discourse_user_id_key
      DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role
      RETURNING
        id, uuid, created, role, full_name, email, discourse_user_id, is_active;
    `;
    const queryValues = [discourseUserId, email, fullName, role];
    const result = await db.query<User>(queryText, queryValues);
    if (!result.rows[0].fullName) {
      result.rows[0].fullName = null;
    }
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create or update user');
    console.error(err);
    return null;
  }
}
