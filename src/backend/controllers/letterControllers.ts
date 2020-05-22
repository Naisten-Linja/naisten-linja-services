import type { LetterAccessInfo, SendLetterParams, LetterAdmin } from '../../common/constants-common';
import { generateLetterPlaceHolder } from '../models/letter';
import {
  Letter,
  updateLetterContent,
  getLetterByUuid,
  getLetterByCredentials,
  getLetters,
  updateLetterAssignee,
} from '../models/letter';
import { saltHash } from '../utils';
import { getConfig } from '../config';

export async function createLetterController(): Promise<LetterAccessInfo | null> {
  const letter = await generateLetterPlaceHolder();
  return letter;
}

export async function validateLetterCredentials({
  uuid,
  accessKey,
  accessPassword,
}: LetterAccessInfo): Promise<boolean> {
  const letter = await getLetterByUuid(uuid);
  if (!letter) {
    return false;
  }

  const { letterAccessKeySalt } = getConfig();
  // Get accessKey hash
  const { hash: accessKeyHash } = saltHash({ password: accessKey, salt: letterAccessKeySalt });
  // Get password hash
  const { hash: accessPasswordHash } = saltHash({ password: accessPassword, salt: letter.accessPasswordSalt });
  // Make sure hash values match those that are stored in the database
  const isValid = accessKeyHash === letter.accessKey && accessPasswordHash === letter.accessPassword;

  return isValid;
}

export async function sendLetter({
  title,
  content,
  accessKey,
  accessPassword,
  uuid,
}: SendLetterParams): Promise<Letter | null> {
  const isValid = await validateLetterCredentials({ uuid, accessKey, accessPassword });
  if (!isValid) {
    return null;
  }
  const letter = await updateLetterContent({ uuid, title, content });
  return letter;
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
}): Promise<LetterAdmin | null> {
  const letter = await updateLetterAssignee({ letterUuid, assigneeUuid });
  if (!letter) {
    return null;
  }
  const { uuid, created, title, content, assignedResponderUuid, status } = letter;
  return { uuid, created, title, content, assignedResponderUuid, status };
}
