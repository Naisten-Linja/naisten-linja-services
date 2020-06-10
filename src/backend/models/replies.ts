import db from '../db';

import { aesEncrypt, aesDecrypt } from '../utils';
import { ReplyStatus, ResponderType } from '../../common/constants-common';

export interface Reply {
  uuid: string;
  letterUuid: string;
  internalAuthorUuid: string | null;
  authorType: ResponderType;
  status: ReplyStatus;
  content: string;
  created: string;
  updated: string;
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
  };
}

async function encryptAllReplies(): Promise<void> {
  const queryText = `SELECT * from replies;`;
  const result = await db.query<ReplyQueryResult>(queryText, []);
  if (result.rows.length > 0) {
    result.rows.forEach((r) => {
      updateReply({ uuid: r.uuid, content: r.content, status: r.status });
    });
  }
}

export async function getReply(letterUuid: string): Promise<Reply | null> {
  try {
    await encryptAllReplies();
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

export async function updateReply({
  uuid,
  content,
  status,
}: {
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
         status = $3::text
       WHERE uuid = $4::text
       RETURNING *;
    `;
    const queryValues = [encryptedData, iv, status, uuid];
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
       INSERT INTO replies (letter_uuid, content, internal_author_uuid, author_type, status, content_iv)
       VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text)
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
