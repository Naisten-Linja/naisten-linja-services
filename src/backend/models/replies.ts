import db from '../db';

import { aesEncrypt, aesDecrypt } from '../utils';
import { ReadReceiptStatus, ReplyStatus, ResponderType } from '../../common/constants-common';

export interface Reply {
  uuid: string;
  letterUuid: string;
  internalAuthorUuid: string | null;
  authorType: ResponderType;
  status: ReplyStatus;
  content: string;
  created: string;
  updated: string;
  readReceipt: ReadReceiptStatus;
  readTimestamp: Date | null;
  statusTimestamp: Date | null;
}

export interface ReplyQueryResult {
  uuid: string;
  letter_uuid: string;
  status: ReplyStatus;
  created: string;
  updated: string;
  author_type: ResponderType;
  internal_author_uuid?: string;
  content: string;
  content_iv: string;
  read_receipt: ReadReceiptStatus;
  read_timestamp: Date | null;
  status_timestamp: Date | null;
}

function queryResultToReply(row: ReplyQueryResult): Reply {
  const content = row.content_iv ? aesDecrypt(row.content, row.content_iv) : row.content;
  return {
    uuid: row.uuid,
    letterUuid: row.letter_uuid,
    status: row.status,
    created: row.created,
    updated: row.updated,
    content,
    authorType: row.author_type,
    internalAuthorUuid: row.internal_author_uuid || null,
    readReceipt: row.read_receipt,
    readTimestamp: row.read_timestamp,
    statusTimestamp: row.status_timestamp,
  };
}

export async function getReply(letterUuid: string): Promise<Reply | null> {
  try {
    const queryText = `
      SELECT * from replies
      WHERE letter_uuid = $1::text;
    `;
    const queryValues = [letterUuid];
    const result = await db.query<ReplyQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToReply(result.rows[0]);
  } catch (err) {
    console.error(`Failed fetch reply to letter ${letterUuid}`);
    console.error(err);
    return null;
  }
}

/**
 * Update the reply with own `uuid` which is connected to letter with `letterUuid`.
 * This ensures that the reply belongs to the letter that the user has access to.
 *
 * `letterUuid` or `uuid` are not updated.
 */
export async function updateReply({
  letterUuid,
  uuid,
  content,
  status,
}: {
  letterUuid: string;
  uuid: string;
  content: string;
  status: ReplyStatus;
}): Promise<Reply | null> {
  try {
    const { encryptedData, iv } = aesEncrypt(content);
    const queryText = `
       UPDATE replies
       SET
         content = $1::text,
         content_iv=$2::text,
         status = $3::text,
         status_timestamp = now()
       WHERE uuid = $4::text AND letter_uuid = $5::text
       RETURNING *;
    `;
    const queryValues = [encryptedData, iv, status, uuid, letterUuid];
    const result = await db.query<ReplyQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToReply(result.rows[0]);
  } catch (err) {
    console.error(`Failed update reply ${uuid}`);
    console.error(err);
    return null;
  }
}

export async function updateReplyReadReceipt({
  uuid,
  readReceipt,
  readTimestamp,
}: {
  uuid: string;
  readReceipt: ReadReceiptStatus;
  readTimestamp: Date | null;
}): Promise<Reply | null> {
  try {
    const queryText = `
       UPDATE replies
       SET read_receipt = $1::text, read_timestamp = $2::timestamp
       WHERE uuid = $3::text
       RETURNING *;
    `;
    const queryValues = [readReceipt, readTimestamp, uuid];
    const result = await db.query<ReplyQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToReply(result.rows[0]);
  } catch (err) {
    console.error(`Failed update read receipt for reply ${uuid}`);
    console.error(err);
    return null;
  }
}

export async function createReply({
  letterUuid,
  content,
  internalAuthorUuid,
  authorType,
  status,
}: {
  letterUuid: string;
  content: string;
  internalAuthorUuid: string | null;
  authorType: ResponderType;
  status: ReplyStatus;
}): Promise<Reply | null> {
  try {
    const { encryptedData, iv } = aesEncrypt(content);
    const queryText = `
       INSERT INTO replies (letter_uuid, content, internal_author_uuid, author_type, status, status_timestamp, content_iv)
       VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, now(), $6::text)
       RETURNING *;
    `;
    const queryValues = [letterUuid, encryptedData, internalAuthorUuid, authorType, status, iv];
    const result = await db.query<ReplyQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToReply(result.rows[0]);
  } catch (err) {
    console.error(`Failed to create a reply to letter ${letterUuid}`);
    console.error(err);
    return null;
  }
}
