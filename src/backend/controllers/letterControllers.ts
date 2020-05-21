import { generateLetterPlaceHolder } from '../models/letter';
import { LetterAccessInfo } from '../../common/constants-common';

export async function createLetterController(): Promise<LetterAccessInfo | null> {
  const letter = await generateLetterPlaceHolder();
  return letter;
}
