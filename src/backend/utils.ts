import crypto, { HexBase64Latin1Encoding } from 'crypto';

// Encode string from a defined encoding to a different form
export function encodeString(s: string, encodingFrom: BufferEncoding, encodingTo: BufferEncoding) {
  return Buffer.from(s, encodingFrom).toString(encodingTo);
}

// Generate a random bytes string and return its specified encoded value
export function generateRandomString(length: number = 10, encoding: BufferEncoding = 'utf8') {
  return crypto.randomBytes(length).toString(encoding);
}

// Generate a HMAC SHA-256 hash using the provided Discourse SSO key
export function hmacSha256(payload: string, secret: string, encoding?: HexBase64Latin1Encoding) {
  return encoding
    ? crypto.createHmac('sha256', secret).update(payload).digest(encoding)
    : crypto.createHmac('sha256', secret).update(payload, 'utf8').digest();
}

// Return an objects with values mapping from a get query string
// param1=first&param2=second -> { param1: first, param2: second }
export function getQueryData(queryString: string) {
  const queryData = queryString.split('&').reduce((result, currentVal) => {
    const vals = currentVal.split('=');
    return {
      ...result,
      [vals[0]]: decodeURIComponent(vals[1]),
    };
  }, {});

  return queryData;
}

// Salt hash a string
// If salt is not provided, generate a random 64 character long salt string.
// Returns hash value and salt used for hashing
export function saltHash(password: string, salt?: string): { hash: string; salt: string } {
  if (!salt) {
    const randStr = generateRandomString(32, 'hex');
    salt = randStr.slice(0, 64);
  }
  const hash = crypto.createHmac('sha512', salt).update(password).digest('hex');
  return { salt, hash };
}
