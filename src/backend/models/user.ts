import db from '../db';

interface User {
  id: number;
  uuid: string;
  created: number;
  role: 'staff' | 'volunteer';

  userName: string;
  fullName?: string;
  email: string;
  discourseUserId: number;
}

type ApiUser = Pick<User, 'uuid' | 'created' | 'userName' | 'fullName' | 'email' | 'role'>;

export type UpsertUserParams = Pick<User, 'discourseUserId' | 'userName' | 'fullName' | 'email' | 'role'>;
export async function upsertUser(userParams: UpsertUserParams) {
  const client = await db.getClient();
  const { discourseUserId, userName, email, fullName, role } = userParams;
  const queryText = `
    INSERT INTO users (discourse_user_id, username, email, full_name, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT ON CONSTRAINT users_discourse_user_id_key
    DO UPDATE SET
      username = EXCLUDED.username,
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role
    RETURNING
      id, uuid, created, role, username, full_name, email, discourse_user_id;
  `;
  const queryValues = [discourseUserId, userName, email, fullName, role];
  try {
    const req = await db.query<User>(queryText, queryValues);
    console.log(req.rows[0]);
  } catch (err) {
    console.error('Failed to create or update user');
    console.error(err);
    return null;
  }
}
