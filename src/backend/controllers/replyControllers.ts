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
  statusTimestamp,
}: {
  letterUuid: string;
  content: string;
  internalAuthorUuid: string;
  authorType: ResponderType;
  status: ReplyStatus;
  statusTimestamp: Date;
}): Promise<ApiReplyAdmin | null> {
  const reply = await createReply({
    letterUuid,
    content,
    internalAuthorUuid,
    authorType,
    status,
    statusTimestamp,
  });
  if (!reply) {
    return null;
  }
  const { uuid, created, updated, readReceipt, readTimestamp } = reply;
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
  replyUuid: string,
  content: string,
  status: ReplyStatus,
  statusTimestamp: Date,
): Promise<ApiReplyAdmin | null> {
  const reply = await updateReply({ uuid: replyUuid, content, status, statusTimestamp });
  if (!reply) {
    return null;
  }
  const {
    uuid,
    authorType,
    created,
    updated,
    internalAuthorUuid,
    letterUuid,
    status: updatedStatus,
    content: updatedContent,
    readReceipt,
    readTimestamp,
    statusTimestamp: updatedStatusTimeStamp,
  } = reply;
  return {
    uuid,
    authorType,
    created,
    updated,
    internalAuthorUuid,
    letterUuid,
    status: updatedStatus,
    content: updatedContent,
    readReceipt,
    readTimestamp: readTimestamp ? readTimestamp.toString() : null,
    statusTimestamp: updatedStatusTimeStamp ? updatedStatusTimeStamp.toString() : null,
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
