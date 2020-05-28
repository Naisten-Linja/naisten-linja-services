import db from '../db';
import { generate as generatePass } from 'generate-password';

import { saltHash, generateRandomString } from '../utils';
import { LetterStatus, ApiLetterCredentials } from '../../common/constants-common';
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
  id: number;
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

export async function getSentLetters(): Promise<Array<Letter> | null> {
  try {
    // Fetch the letter using the unique accessKeyHash
    const queryText = `
       SELECT *
       FROM letters
       WHERE status = 'sent'
       ORDER BY id DESC;
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

export async function getLetters(): Promise<Array<Letter> | null> {
  try {
    // Fetch the letter using the unique accessKeyHash
    const queryText = `
       SELECT *
       FROM letters
       ORDER BY id DESC;
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

// Generate a new letter with random accessKey and accessPassword
// Returning the original form of both keys
export async function createLetterCredentials(): Promise<ApiLetterCredentials | null> {
  const { letterAccessKeySalt } = getConfig();
  // Generate a random 8 character long accessKey
  const accessKey = generateRandomString(4, 'hex').slice(0, 8).toUpperCase();
  const accessPassword = generatePass({
    length: 12,
    uppercase: true,
    numbers: true,
  });
  const { hash: accessKeyHash } = saltHash(accessKey, letterAccessKeySalt);
  const { hash: accessPasswordHash, salt: accessPasswordSalt } = saltHash(accessPassword);

  try {
    const queryText = `
       INSERT INTO letters (access_key, access_password, access_password_salt)
       VALUES ($1::text, $2::text, $3::text)
       RETURNING uuid;
    `;
    const queryValues = [accessKeyHash, accessPasswordHash, accessPasswordSalt];
    const result = await db.query<LetterQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return { accessKey, accessPassword };
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
    const { hash: accessKeyHash } = saltHash(accessKey, letterAccessKeySalt);

    // Fetch the letter using the unique accessKeyHash
    const queryText = `
       SELECT *
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
    const { hash: accessPasswordHash } = saltHash(accessPassword, letter.accessPasswordSalt);
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
    const queryText = `
       SELECT *
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
    const queryText = `
       UPDATE letters
       SET
         title = $1::text,
         content = $2::text,
         status = $3::text
       WHERE uuid = $4::text
       RETURNING *;
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

export async function updateLetterAssignee({
  letterUuid,
  assigneeUuid,
}: {
  letterUuid: string;
  assigneeUuid: string;
}): Promise<Letter | null> {
  try {
    const queryText = `
       UPDATE letters
       SET assigned_responder_uuid = $2::text
       WHERE uuid = $1::text
       RETURNING *;
    `;
    const queryValues = [letterUuid, assigneeUuid];
    const result = await db.query<LetterQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToLetter(result.rows[0]);
  } catch (err) {
    console.error(`Failed assign letter ${letterUuid} to user ${assigneeUuid}`);
    console.error(err);
    return null;
  }
}
