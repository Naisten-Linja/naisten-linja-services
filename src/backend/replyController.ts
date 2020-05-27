import { createReply, getReplies, updateReply } from './models/replies';
import { getLetterByUuid } from './models/letters';
import { ApiReplyAdmin, ReplyStatus, ResponderType } from '../common/constants-common';

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
  const { uuid, created, updated } = reply;
  return { uuid, authorType, created, updated, internalAuthorUuid, letterUuid, status, content };
}

export async function getLettersReplies(letterUuid: string): Promise<Array<ApiReplyAdmin>> {
  const replies = await getReplies(letterUuid);
  return replies.map((reply) => {
    const { uuid, authorType, created, updated, internalAuthorUuid, status, content } = reply;
    return { uuid, authorType, created, updated, internalAuthorUuid, letterUuid, status, content };
  });
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
  };
}
