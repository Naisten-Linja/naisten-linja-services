import crypto, { HexBase64Latin1Encoding } from 'crypto';
import { getConfig } from './config';

// Encode string from a defined encoding to a different form
export function encodeString(s: string, encodingFrom: BufferEncoding, encodingTo: BufferEncoding) {
  return Buffer.from(s, encodingFrom).toString(encodingTo);
}

// Generate a random 16 bytes string and return its base64 encoded value
export function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

// Generate a HMAC SHA-256 hash using the provided Discourse SSO key
export function hmacSha256(payload: string, encoding?: HexBase64Latin1Encoding) {
  const { discourseSsoSecret } = getConfig();

  return encoding
    ? crypto.createHmac('sha256', discourseSsoSecret).update(payload).digest(encoding)
    : crypto.createHmac('sha256', discourseSsoSecret).update(payload, 'utf8').digest();
}

// Return an objects with values mapping from a get query string
// param1=first&param2=second -> { param1: first, param2: second }
export function getQueryData(queryString: string) {
  const queryData = queryString.split('&').reduce<Record<string, string>>(
    (result, currentVal) => {
      const [key, val] = currentVal.split('=');
      return {
        ...result,
        [key]: decodeURIComponent(val),
      };
    },
    { nonce: '' },
  );

  return queryData;
}
