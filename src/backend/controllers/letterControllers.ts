import type { ApiLetterAccessInfo, ApiSendLetterParams, ApiLetterAdmin } from '../../common/constants-common';
import { createLetterCredentials } from '../models/letter';
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

export async function initiateLetter(): Promise<ApiLetterAccessInfo | null> {
  const letter = await createLetterCredentials();
  if (!letter) {
    return null;
  }
  return {
    accessKey: letter.accessKey,
    accessPassword: letter.accessPassword,
  };
}

export async function validateLetterCredentials({ accessKey, accessPassword }: ApiLetterAccessInfo): Promise<boolean> {
  const letter = await getLetterByCredentials({ accessKey, accessPassword });
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
}: ApiSendLetterParams): Promise<Letter | null> {
  const isValid = await validateLetterCredentials({ accessKey, accessPassword });
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
}): Promise<ApiLetterAdmin | null> {
  const letter = await updateLetterAssignee({ letterUuid, assigneeUuid });
  if (!letter) {
    return null;
  }
  const { uuid, created, title, content, assignedResponderUuid, status } = letter;
  return { uuid, created, title, content, assignedResponderUuid, status };
}
