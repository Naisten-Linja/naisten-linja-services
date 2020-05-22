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
  content: string | null;
  title: string | null;
  assignedResponderUuid: string | null;
  created: string;
  status: LetterStatus;
}

export interface LetterQueryResult {
  uuid: string;
  status: LetterStatus;
  created: string;
  access_key: string;
  access_password: string;
  access_password_salt: string;
  title?: string;
  content?: string;
  assigned_responder_uuid?: string;
}

function queryResultToLetter(row: LetterQueryResult): Letter {
  return {
    uuid: row.uuid,
    status: row.status,
    created: row.created,
    accessKey: row.access_key,
    accessPassword: row.access_password,
    accessPasswordSalt: row.access_password_salt,
    title: row.title || null,
    content: row.content || null,
    assignedResponderUuid: row.assigned_responder_uuid || null,
  };
}

export async function getLetters(): Promise<Array<Letter> | null> {
  try {
    // Fetch the letter using the unique accessKeyHash
    const queryText = `
       SELECT uuid, title, content, status, created, assigned_responder_uuid, access_key, access_password, access_password_salt
       FROM letters;
    `;
    const result = await db.query<LetterQueryResult>(queryText, []);
    if (result.rows.length < 1) {
      return null;
    }
    return result.rows.map((r) => queryResultToLetter(r));
  } catch (err) {
    console.error('Failed to fetch letter by accessKey');
    console.error(err);
    return null;
  }
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

export async function getLetterByCredentials({
  accessKey,
  accessPassword,
}: {
  accessKey: string;
  accessPassword: string;
}): Promise<Letter | null> {
  try {
    if (!accessKey || !accessPassword) {
      return null;
    }
    const { letterAccessKeySalt } = getConfig();
    const { hash: accessKeyHash } = saltHash({ password: accessKey, salt: letterAccessKeySalt });

    // Fetch the letter using the unique accessKeyHash
    const queryText = `
       SELECT uuid, title, content, status, created, assigned_responder_uuid, access_key, access_password, access_password_salt
       FROM letters
       WHERE access_key=$1::text;
    `;
    const queryValues = [accessKeyHash];
    const result = await db.query<LetterQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    const letter = queryResultToLetter(result.rows[0]);

    // Make sure the accessPassword is valid
    const { hash: accessPasswordHash } = saltHash({ password: accessPassword, salt: letter.accessPasswordSalt });
    if (accessPasswordHash !== letter.accessPassword) {
      return null;
    }

    return letter;
  } catch (err) {
    console.error('Failed to fetch letter by accessKey');
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
       WHERE uuid=$1::text;
    `;
    const queryValues = [uuid];
    const result = await db.query<LetterQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToLetter(result.rows[0]);
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
         content = $2::text,
         status = $3::text
       WHERE uuid = $4::text
       RETURNING
         uuid, title, content, created, assigned_responder_uuid, access_key, access_password, access_password_salt;
    `;
    const queryValues = [title.trim(), content.trim(), LetterStatus.sent, uuid];
    const result = await db.query<LetterQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToLetter(result.rows[0]);
  } catch (err) {
    console.error(`Failed update letter content. uuid: ${uuid}`);
    console.error(err);
    return null;
  }
}
