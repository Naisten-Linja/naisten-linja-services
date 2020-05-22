import { Request } from 'express';
import jwt from 'jsonwebtoken';

import { getConfig } from './config';
import { hmacSha256, encodeString, getQueryData, generateRandomString } from './utils';
import { UpsertUserParams } from './models/users';

export interface DiscourseSsoData {
  admin?: string;
  email?: string;
  external_id?: string;
  groups?: string;
  moderator?: string;
  name?: string;
  nonce?: string;
  return_sso_url?: string;
  username?: string;
}

// Generate login redirect link and 'nonce' value using steps defined at
// https://meta.discourse.org/t/using-discourse-as-a-sso-provider/32974
//
// - Generate a random 'nonce'. Save it temporarily to compare with returned 'nonce'
//   when user is redirected back from discourse
// - Create a new query string with nonce and return url (where the Discourse will
//   redirect user after verification).
//   It should look like "nonce=NONCE&return_sso_url=RETURN_URL"
// - Base64 encode the above query string. Let’s call this 'payload'
// - Generate a HMAC-SHA256 signature from 'payload' using your sso provider secret
//   as the key, then create a lower case hex string from this. Let’s call this
//   signature as HEX_SIGNATURE
// - URL encode the above 'payload'. Let’s call this payload as URL_ENCODED_PAYLOAD
// - Redirect user to the discourse url
//   DISCOURSE_ROOT_URL/session/sso_provider?sso=URL_ENCODED_PAYLOAD&sig=HEX_SIGNATURE
export function createSso(req: Request) {
  if (!req.session) {
    return '/';
  }

  const { backendUrl, discourseUrl } = getConfig();
  const ssoReturnUrl = `${backendUrl}/auth/sso/verify`;
  const nonce = generateRandomString(16, 'base64');
  const query = `nonce=${nonce}&return_sso_url=${ssoReturnUrl}`;
  const payload = encodeString(query, 'utf8', 'base64');
  const sig = hmacSha256(payload, 'hex');

  // keep 'nonce' value in cookie to compare with the return request
  // from discourse in 'validateSsoRequest'
  req.session.nonce = nonce;

  return `${discourseUrl}/session/sso_provider?sso=${encodeURIComponent(payload)}&sig=${sig}`;
}

// Validate the sso request after redirected back from Discourse
//
// Criterias:
// - 'sig' and 'sso' exist as get parameters, and are strings
// - HMAC SHA-256 hash from 'sso' in bytes should equals 'sig' in byfes
// - 'nonce' value in the decoded 'sso' equals 'session.nonce'
//   ('session.nonce' was set before redirecting user to discourse in '/auth/sso')
export function validateSsoRequest(req: Request) {
  const { sig, sso } = req.query;

  if (!req.session || !req.session.nonce) {
    console.log('Session information not found');
    return false;
  }

  if (!sig || !sso || typeof sig !== 'string' || typeof sso !== 'string') {
    console.log('Missing or invalid "sso" or "sig" query parameter');
    return false;
  }

  // THIS STEP IS VERY IMPORTANT
  // Make sure the sso string is authenticity by comparing its decoded
  // bytes (using the private key) to the signature bytes
  const ssoHmac = hmacSha256(sso) as Buffer;
  const isValidSignature = Buffer.compare(ssoHmac, Buffer.from(sig, 'hex')) === 0; // 0 means no difference
  if (!isValidSignature) {
    console.log('Invalid signature for', sso);
    return false;
  }

  const ssoStr = encodeString(sso, 'base64', 'utf8');
  const ssoData = getQueryData(ssoStr) as DiscourseSsoData;
  const isValidNonce = req.session.nonce === ssoData.nonce;

  // Clear nonce value now that it is not needed anymore
  delete req.session!.nonce;

  if (!isValidNonce) {
    console.log('Nonce value does not match with one in session', ssoData.nonce);
    return false;
  }

  return isValidSignature && isValidNonce;
}

type TokenData = {
  uuid: string;
  email: string;
  fullName: string | null;
  role: string;
};
// Create a JWT token
export async function createToken(data: TokenData): Promise<string | null> {
  try {
    const { jwtPrivateKey } = getConfig();
    const token = await jwt.sign(data, jwtPrivateKey, { expiresIn: '7d' }); // token will expire in 7 days
    return token;
  } catch (err) {
    console.error('Failed to create token');
    console.error(err);
    return null;
  }
}

// Construct user data from the decoded return sso
// This will be used to create / update user information in the database
export function generateUserDataFromSsoRequest(req: Request): UpsertUserParams | null {
  const ssoStr = encodeString(`${req.query.sso}`, 'base64', 'utf8');
  const ssoData = getQueryData(ssoStr) as DiscourseSsoData;
  const { external_id, email, name, admin, groups } = ssoData;
  const isAdmin = admin === 'true';
  const isVolunteer = groups && groups.split(',').indexOf('Volunteers') > -1;
  if (isAdmin || isVolunteer) {
    return {
      email,
      discourseUserId: external_id ? parseInt(external_id, 10) : undefined,
      fullName: name ? name.replace('+', ' ') : undefined,
    };
  }
  return null;
}
