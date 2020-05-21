import db from '../db';
import { generate as generatePass } from 'generate-password';
import shortid from 'shortid';

import { saltHash, generateRandomString } from '../utils';
import { LetterAccessInfo, LetterStatus } from '../../common/constants-common';

export interface Letter {
  uuid: string;
  accessKey: string;
  accessPassword: string;
  salt: string;
  content: string;
  title: string;
  assignedResponderUuid: string;
  created: string;
  status: LetterStatus;
}

export async function generateLetterPlaceHolder(): Promise<LetterAccessInfo | null> {
  const accessKey = generateRandomString(4, 'hex').slice(0, 8).toUpperCase();
  const accessPassword = generatePass({
    length: 12,
    uppercase: true,
    numbers: true,
  });
  const { salt, hash: accessKeyHash } = saltHash({ password: accessKey });
  const { hash: accessPasswordHash } = saltHash({ password: accessPassword, salt });

  try {
    const client = await db.getClient();
    const queryText = `
       INSERT INTO letters (access_key, access_password, salt)
       VALUES ($1::text, $2::text, $3::text)
       RETURNING uuid;
    `;
    const queryValues = [accessKeyHash, accessPasswordHash, salt];
    const result = await db.query<{ uuid: string }>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return {
      accessKey,
      accessPassword,
    };
  } catch (err) {
    console.error('Faild to generate a new letter');
    console.error(err);
    return null;
  }
}
