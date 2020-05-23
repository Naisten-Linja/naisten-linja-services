import type {
  ApiLetterCredentials,
  ApiSendLetterParams,
  ApiLetterAdmin,
} from '../common/constants-common';
import {
  Letter,
  createLetterCredentials,
  updateLetterContent,
  getLetterByCredentials,
  getLetters,
  updateLetterAssignee,
  getLetterByUuid,
} from './models/letters';
import { saltHash } from './utils';
import { getConfig } from './config';

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

export async function readLetter({
  accessKey,
  accessPassword,
}: {
  accessKey: string;
  accessPassword: string;
}): Promise<Letter | null> {
  if (!accessKey || !accessPassword) {
    return null;
  }
  const letter = await getLetterByCredentials({ accessKey, accessPassword });
  return letter;
}

export async function getAllLetters(): Promise<Array<Letter> | null> {
  return await getLetters();
}

export async function assignLetter({
  letterUuid,
  assigneeUuid,
}: {
  letterUuid: string;
  assigneeUuid: string;
}): Promise<ApiLetterAdmin | null> {
  const letter = await updateLetterAssignee({ letterUuid, assigneeUuid });
  if (!letter) {
    return null;
  }
  const { uuid, created, title, content, assignedResponderUuid, status } = letter;
  return { uuid, created, title, content, assignedResponderUuid, status };
}

export async function getLetter(uuid: string): Promise<Letter | null> {
  const letter = await getLetterByUuid(uuid);
  return letter;
}
