import db from '../db';
import { generate as generatePass } from 'generate-password';

import { saltHash, generateRandomString, aesDecrypt, aesEncrypt } from '../utils';
import { LetterStatus, ApiLetterCredentials, ReplyStatus, ReadReceiptStatus } from '../../common/constants-common';
import { getConfig } from '../config';

export interface Letter {
  uuid: string;
  accessKey: string;
  accessPassword: string;
  accessPasswordSalt: string;
  content: string | null;
  title: string | null;
  assignedResponderUuid: string | null;
  assignedResponderEmail: string | null;
  assignedResponderFullName: string | null;
  created: string;
  status: LetterStatus;
  replyStatus: ReplyStatus | null;
  replyReadReceipt: ReadReceiptStatus | null;
  replyReadTimestamp: string | null;
  replyStatusTimestamp: string | null;
}

export interface LetterQueryResult {
  id: number;
  uuid: string;
  status: LetterStatus;
  reply_status?: ReplyStatus;
  created: string;
  access_key: string;
  access_password: string;
  access_password_salt: string;
  title?: string;
  content?: string;
  assigned_responder_uuid?: string;
  assigned_responder_email?: string;
  assigned_responder_full_name?: string;
  title_iv: string;
  content_iv: string;
  reply_read_receipt?: ReadReceiptStatus;
  reply_read_timestamp?: string;
  reply_status_timestamp?: string;
}

function queryResultToLetter(row: LetterQueryResult): Letter {
  const title = row.title ? aesDecrypt(row.title, row.title_iv) : null;
  const content = row.content ? aesDecrypt(row.content, row.content_iv) : null;

  return {
    uuid: row.uuid,
    status: row.status,
    created: row.created,
    accessKey: row.access_key,
    accessPassword: row.access_password,
    accessPasswordSalt: row.access_password_salt,
    title,
    content,
    assignedResponderUuid: row.assigned_responder_uuid || null,
    assignedResponderEmail: row.assigned_responder_email || null,
    assignedResponderFullName: row.assigned_responder_full_name || null,
    replyStatus: row.reply_status || null,
    replyReadReceipt: row.reply_read_receipt || null,
    replyReadTimestamp: row.reply_read_timestamp || null, 
    replyStatusTimestamp: row.reply_status_timestamp || null, 
  };
}

export async function getAssignedLetters(userUuid: string): Promise<Array<Letter> | null> {
  try {
    // Fetch the letter using the unique accessKeyHash
    const queryText = `
       SELECT
         letters.*,
         users.email as assigned_responder_email,
         users.full_name as assigned_responder_full_name,
         replies.status as reply_status,
         replies.read_receipt as reply_read_receipt,
         replies.read_timestamp as reply_read_timestamp,
         replies.status_timestamp as reply_status_timestamp
       FROM letters
       LEFT OUTER JOIN users ON letters.assigned_responder_uuid = users.uuid
       LEFT OUTER JOIN replies ON letters.uuid = replies.letter_uuid
       WHERE
         letters.status = 'sent' AND letters.assigned_responder_uuid = $1::text
       ORDER BY letters.id DESC;
    `;
    const queryValues = [userUuid];
    const result = await db.query<LetterQueryResult>(queryText, queryValues);
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

export async function getSentLetters(): Promise<Array<Letter> | null> {
  try {
    // Fetch the letter using the unique accessKeyHash
    const queryText = `
       SELECT
         letters.*,
         users.email as assigned_responder_email,
         users.full_name as assigned_responder_full_name,
         replies.status as reply_status,
         replies.read_receipt as reply_read_receipt,
         replies.read_timestamp as reply_read_timestamp,
         replies.status_timestamp as reply_status_timestamp
       FROM letters
       LEFT OUTER JOIN users ON letters.assigned_responder_uuid = users.uuid
       LEFT OUTER JOIN replies ON letters.uuid = replies.letter_uuid
       WHERE letters.status = 'sent'
       ORDER BY letters.id DESC;
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
       SELECT
         letters.*,
         users.email as assigned_responder_email,
         users.full_name as assigned_responder_full_name
       FROM letters
       LEFT OUTER JOIN users ON letters.assigned_responder_uuid = users.uuid
       WHERE letters.access_key=$1::text;
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
       SELECT
         letters.*,
         users.email as assigned_responder_email,
         users.full_name as assigned_responder_full_name
       FROM letters
       LEFT OUTER JOIN users ON letters.assigned_responder_uuid = users.uuid
       WHERE letters.uuid=$1::text;
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
    const { encryptedData: encryptedTitle, iv: titleIv } = aesEncrypt(title.trim());
    const { encryptedData: encryptedContent, iv: contentIv } = aesEncrypt(content.trim());
    const queryText = `
       UPDATE letters
       SET
         title = $1::text,
         title_iv = $2::text,
         content = $3::text,
         content_iv = $4::text,
         status = $5::text
       WHERE uuid = $6::text
       RETURNING *;
    `;
    const queryValues = [
      encryptedTitle,
      titleIv,
      encryptedContent,
      contentIv,
      LetterStatus.sent,
      uuid,
    ];
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
  assigneeUuid: string | null;
}): Promise<Letter | null> {
  try {
    const queryText = `
       UPDATE letters
       SET assigned_responder_uuid = $1
       WHERE letters.uuid = $2::text
       RETURNING *;
    `;
    const queryValues = [assigneeUuid, letterUuid];
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
