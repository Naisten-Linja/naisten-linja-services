import {
  createReply,
  getReply,
  Reply,
  updateReply,
  updateReplyReadReceipt,
} from '../models/replies';
import { getLetterByUuid } from '../models/letters';
import {
  ApiReplyAdmin,
  ReadReceiptStatus,
  ReplyStatus,
  ResponderType,
} from '../../common/constants-common';

export type ReplyParams = {
  letterUuid: string;
  content: string;
  internalAuthorUuid: string;
  authorType: ResponderType;
  status: ReplyStatus;
};

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
}: ReplyParams): Promise<ApiReplyAdmin | null> {
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
  return replyModelToApiReplyAdmin(reply);
}

export async function getLettersReply(letterUuid: string): Promise<ApiReplyAdmin | null> {
  const reply = await getReply(letterUuid);
  if (!reply) {
    return null;
  }
  return replyModelToApiReplyAdmin(reply);
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

  return replyModelToApiReplyAdmin(reply);
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

export function replyModelToApiReplyAdmin(reply: Reply): ApiReplyAdmin {
  const {
    uuid,
    created,
    updated,
    readReceipt,
    readTimestamp,
    statusTimestamp,
    authorType,
    internalAuthorUuid,
    status,
    content,
    letterUuid,
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
