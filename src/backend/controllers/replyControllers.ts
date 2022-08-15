import { createReply, getReply, updateReply, updateReplyRecipientStatus } from '../models/replies';
import { getLetterByUuid } from '../models/letters';
import {
  ApiReplyAdmin,
  RecipientStatus,
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
  const reply = await createReply({ letterUuid, content, internalAuthorUuid, authorType, status });
  if (!reply) {
    return null;
  }
  const { uuid, created, updated, recipientStatus, readTimestamp } = reply;
  return {
    uuid,
    authorType,
    created,
    updated,
    internalAuthorUuid,
    letterUuid,
    status,
    content,
    recipientStatus,
    readTimestamp: readTimestamp ? readTimestamp.toString() : null
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
    recipientStatus,
    readTimestamp
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
    recipientStatus,
    readTimestamp: readTimestamp ? readTimestamp.toString() : null
  };
}

export async function updateLettersReply(
  replyUuid: string,
  content: string,
  status: ReplyStatus,
): Promise<ApiReplyAdmin | null> {
  const reply = await updateReply({ uuid: replyUuid, content, status });
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
    recipientStatus,
    readTimestamp
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
    recipientStatus,
    readTimestamp: readTimestamp ? readTimestamp.toString() : null
  };
}

export async function updateLettersReplyRecipientStatus(
  replyUuid: string,
  recipientStatus: RecipientStatus,
  readTimestamp: Date | null = null,
): Promise<boolean | null> {
  const reply = await updateReplyRecipientStatus({ uuid: replyUuid, recipientStatus, readTimestamp  });
  if (!reply) {
    return null;
  }
  return true;
}
