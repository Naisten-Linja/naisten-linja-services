import { createReply, getReply, updateReply, updateReplyReadReceipt } from '../models/replies';
import { getLetterByUuid } from '../models/letters';
import {
  ApiReplyAdmin,
  ReadReceiptStatus,
  ReplyStatus,
  ResponderType,
} from '../../common/constants-common';

// Check if a letter is assigned a user
export async function isUserAssignedToLetter(
  letterUuid: string,
  userUuid: string,
): Promise<boolean> {
  const letter = await getLetterByUuid(letterUuid);
  if (!letter) {
    return false;
  }
  return letter.assignedResponderUuid === userUuid;
}

export async function replyToLetter({
  letterUuid,
  content,
  internalAuthorUuid,
  authorType,
  status,
}: {
  letterUuid: string;
  content: string;
  internalAuthorUuid: string;
  authorType: ResponderType;
  status: ReplyStatus;
}): Promise<ApiReplyAdmin | null> {
  const reply = await createReply({
    letterUuid,
    content,
    internalAuthorUuid,
    authorType,
    status,
  });
  if (!reply) {
    return null;
  }
  const { uuid, created, updated, readReceipt, readTimestamp, statusTimestamp } = reply;
  return {
    uuid,
    authorType,
    created,
    updated,
    internalAuthorUuid,
    letterUuid,
    status,
    content,
    readReceipt,
    readTimestamp: readTimestamp ? readTimestamp.toString() : null,
    statusTimestamp: statusTimestamp ? statusTimestamp.toString() : null,
  };
}

export async function getLettersReply(letterUuid: string): Promise<ApiReplyAdmin | null> {
  const reply = await getReply(letterUuid);
  if (!reply) {
    return null;
  }
  const {
    uuid,
    authorType,
    created,
    updated,
    internalAuthorUuid,
    status,
    content,
    readReceipt,
    readTimestamp,
    statusTimestamp,
  } = reply;
  return {
    uuid,
    authorType,
    created,
    updated,
    internalAuthorUuid,
    letterUuid,
    status,
    content,
    readReceipt,
    readTimestamp: readTimestamp ? readTimestamp.toString() : null,
    statusTimestamp: statusTimestamp ? statusTimestamp.toString() : null,
  };
}

export async function updateLettersReply(
  letterUuid: string,
  replyUuid: string,
  content: string,
  status: ReplyStatus,
): Promise<ApiReplyAdmin | null> {
  const reply = await updateReply({
    letterUuid,
    uuid: replyUuid,
    content,
    status,
  });
  if (!reply) {
    return null;
  }
  const { readTimestamp, statusTimestamp } = reply;
  return {
    uuid: reply.uuid,
    authorType: reply.authorType,
    created: reply.created,
    updated: reply.updated,
    internalAuthorUuid: reply.internalAuthorUuid,
    letterUuid: reply.letterUuid,
    status: reply.status,
    content: reply.content,
    readReceipt: reply.readReceipt,
    readTimestamp: readTimestamp ? readTimestamp.toString() : null,
    statusTimestamp: statusTimestamp ? statusTimestamp.toString() : null,
  };
}

export async function updateLettersReplyReadReceipt(
  replyUuid: string,
  readReceipt: ReadReceiptStatus,
  readTimestamp: Date | null = null,
): Promise<boolean | null> {
  const reply = await updateReplyReadReceipt({ uuid: replyUuid, readReceipt, readTimestamp });
  if (!reply) {
    return null;
  }
  return true;
}
