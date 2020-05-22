import type { LetterAccessInfo, SendLetterParams } from '../../common/constants-common';
import { generateLetterPlaceHolder } from '../models/letter';
import { Letter, updateLetterContent, getLetterByUuid } from '../models/letter';
import { saltHash } from '../utils';

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

  const { hash: accessKeyHash } = saltHash({ password: accessKey, salt: letter.salt });
  const { hash: accessPasswordHash } = saltHash({ password: accessPassword, salt: letter.salt });
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
