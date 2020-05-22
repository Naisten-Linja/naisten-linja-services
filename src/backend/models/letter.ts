import db from '../db';
import { generate as generatePass } from 'generate-password';
import shortid from 'shortid';

import { saltHash, generateRandomString } from '../utils';
import { LetterAccessInfo, LetterStatus } from '../../common/constants-common';
import { getConfig } from '../config';

export interface Letter {
  uuid: string;
  accessKey: string;
  accessPassword: string;
  accessPasswordSalt: string;
  content: string;
  title: string;
  assignedResponderUuid: string;
  created: string;
  status: LetterStatus;
}

// Initiate a new letter with just the accessKey, accessPass, and a random salt value used
// to hash both of the access credentials.
export async function generateLetterPlaceHolder(): Promise<LetterAccessInfo | null> {
  const { letterAccessKeySalt } = getConfig();
  // Generate a random 8 character long accessKey
  const accessKey = generateRandomString(4, 'hex').slice(0, 8).toUpperCase();
  const accessPassword = generatePass({
    length: 12,
    uppercase: true,
    numbers: true,
  });
  const { hash: accessKeyHash } = saltHash({ password: accessKey, salt: letterAccessKeySalt });
  const { hash: accessPasswordHash, salt: accessPasswordSalt } = saltHash({ password: accessPassword });

  try {
    const client = await db.getClient();
    const queryText = `
       INSERT INTO letters (access_key, access_password, access_password_salt)
       VALUES ($1::text, $2::text, $3::text)
       RETURNING uuid;
    `;
    const queryValues = [accessKeyHash, accessPasswordHash, accessPasswordSalt];
    const result = await db.query<{ uuid: string }>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return {
      accessKey,
      accessPassword,
      uuid: result.rows[0].uuid,
    };
  } catch (err) {
    console.error('Failed to generate a new letter');
    console.error(err);
    return null;
  }
}

export async function getLetterByUuid(uuid: string): Promise<Letter | null> {
  try {
    const client = await db.getClient();
    const queryText = `
       SELECT uuid, title, content, status, created, assigned_responder_uuid, access_key, access_password, access_password_salt
       FROM letters
       WHERE uuid = $1::text;
    `;
    const queryValues = [uuid];
    const result = await db.query(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return {
      uuid: result.rows[0].uuid,
      status: result.rows[0].status,
      created: result.rows[0].created,
      accessKey: result.rows[0].access_key,
      accessPassword: result.rows[0].access_password,
      accessPasswordSalt: result.rows[0].access_password_salt,
      title: result.rows[0].title,
      content: result.rows[0].content,
      assignedResponderUuid: result.rows[0].assigned_responder_uuid,
    };
  } catch (err) {
    console.error(`Failed to get letter. uuid: ${uuid}`);
    console.error(err);
    return null;
  }
}

export async function updateLetterContent({
  uuid,
  title,
  content,
}: {
  uuid: string;
  title: string;
  content: string;
}): Promise<Letter | null> {
  try {
    const client = await db.getClient();
    const queryText = `
       UPDATE letters
       SET
         title = $1::text,
         content = $2::text
       WHERE uuid = $3::text
       RETURNING
         uuid, title, content, created, assigned_responder_uuid, access_key, access_password, access_password_salt;
    `;
    const queryValues = [title.trim(), content.trim(), uuid];
    const result = await db.query(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return {
      uuid: result.rows[0].uuid,
      status: result.rows[0].status,
      created: result.rows[0].created,
      accessKey: result.rows[0].access_key,
      accessPassword: result.rows[0].access_password,
      accessPasswordSalt: result.rows[0].access_password_salt,
      title: result.rows[0].title,
      content: result.rows[0].content,
      assignedResponderUuid: result.rows[0].assigned_responder_uuid,
    };
  } catch (err) {
    console.error(`Failed update letter content. uuid: ${uuid}`);
    console.error(err);
    return null;
  }
}
