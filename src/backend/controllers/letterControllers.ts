import {
  ApiLetterCredentials,
  ApiSendLetterParams,
  ApiLetterAdmin,
  ReplyStatus,
} from '../../common/constants-common';
import {
  Letter,
  createLetterCredentials,
  updateLetterContent,
  getLetterByCredentials,
  getSentLetters,
  updateLetterAssignee,
  getLetterByUuid,
  getAssignedLetters,
  deleteLetter,
} from '../models/letters';
import { saltHash } from '../utils';
import { getConfig } from '../config';
import { getReply, Reply } from '../models/replies';

export async function initiateLetter(): Promise<ApiLetterCredentials | null> {
  const credentials = await createLetterCredentials();
  if (!credentials) {
    return null;
  }
  return credentials;
}

export async function validateLetterCredentials({
  accessKey,
  accessPassword,
}: ApiLetterCredentials): Promise<
  { isValid: false; letter: null } | { isValid: true; letter: Letter }
> {
  const letter = await getLetterByCredentials({ accessKey, accessPassword });
  if (!letter) {
    return { isValid: false, letter: null };
  }

  const { letterAccessKeySalt } = getConfig();
  // Get accessKey hash
  const { hash: accessKeyHash } = saltHash(accessKey, letterAccessKeySalt);
  // Get password hash
  const { hash: accessPasswordHash } = saltHash(accessPassword, letter.accessPasswordSalt);
  // Make sure hash values match those that are stored in the database
  const isValid =
    accessKeyHash === letter.accessKey && accessPasswordHash === letter.accessPassword;

  return isValid ? { isValid, letter } : { isValid: false, letter: null };
}

export async function sendLetter({
  title,
  content,
  accessKey,
  accessPassword,
}: ApiSendLetterParams): Promise<Letter | null> {
  const { isValid, letter } = await validateLetterCredentials({
    accessKey,
    accessPassword,
  });
  if (isValid && letter) {
    const updatedLetter = await updateLetterContent({ uuid: letter.uuid, title, content });
    return updatedLetter;
  }
  return null;
}

export async function updateOriginalLetterContent({
  letterUuid,
  title,
  content,
}: {
  letterUuid: string;
  title: string;
  content: string;
}): Promise<Letter | null> {
  const updatedLetter = await updateLetterContent({ uuid: letterUuid, title, content });
  if (!updatedLetter) {
    return null;
  }
  return updatedLetter;
}

export async function readLetter({
  accessKey,
  accessPassword,
}: {
  accessKey: string;
  accessPassword: string;
}): Promise<{ letter: Letter | null; reply: Reply | null }> {
  if (!accessKey || !accessPassword) {
    return { letter: null, reply: null };
  }
  const letter = await getLetterByCredentials({ accessKey, accessPassword });
  const reply = letter ? await getReply(letter.uuid) : null;
  return { letter, reply: reply && reply.status === ReplyStatus.published ? reply : null };
}

export async function getAllAssignedLetters(userUuid: string): Promise<Array<Letter> | null> {
  return await getAssignedLetters(userUuid);
}

export async function getAllLetters(): Promise<Array<Letter> | null> {
  return await getSentLetters();
}

export async function assignLetter({
  letterUuid,
  assigneeUuid,
}: {
  letterUuid: string;
  assigneeUuid: string | null;
}): Promise<ApiLetterAdmin | null> {
  const letter = await updateLetterAssignee({ letterUuid, assigneeUuid });
  if (!letter) {
    return null;
  }
  const {
    uuid,
    created,
    title,
    content,
    assignedResponderUuid,
    assignedResponderEmail,
    assignedResponderFullName,
    status,
    replyStatus,
    replyStatusTimestamp,
  } = letter;
  return {
    uuid,
    created,
    title,
    content,
    assignedResponderUuid,
    assignedResponderEmail,
    assignedResponderFullName,
    status,
    replyStatus,
    replyStatusTimestamp,
  };
}

export async function getLetter(uuid: string): Promise<Letter | null> {
  const letter = await getLetterByUuid(uuid);
  return letter;
}

// Check if a letter is assigned a user
export async function checkResponderValidity(
  letterUuid: string,
  userUuid: string,
): Promise<boolean> {
  const letter = await getLetterByUuid(letterUuid);
  if (!letter) {
    return false;
  }
  return letter.assignedResponderUuid === userUuid;
}

export async function deleteLetterAndReply(uuid: string): Promise<boolean> {
  return await deleteLetter(uuid);
}
