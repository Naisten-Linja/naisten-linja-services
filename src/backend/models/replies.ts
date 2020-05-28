import db from '../db';

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
}

function queryResultToReply(row: ReplyQueryResult): Reply {
  return {
    uuid: row.uuid,
    letterUuid: row.letter_uuid,
    status: row.status,
    created: row.created,
    updated: row.updated,
    content: row.content,
    authorType: row.author_type,
    internalAuthorUuid: row.internal_author_uuid || null,
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
    const queryText = `
       UPDATE replies
       SET
         content = $1::text,
         status = $2::text
       WHERE uuid = $3::text
       RETURNING *;
    `;
    const queryValues = [content, status, uuid];
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
    const queryText = `
       INSERT INTO replies (letter_uuid, content, internal_author_uuid, author_type, status)
       VALUES ($1::text, $2::text, $3::text, $4::text, $5::text)
       RETURNING *;
    `;
    const queryValues = [letterUuid, content, internalAuthorUuid, authorType, status];
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
