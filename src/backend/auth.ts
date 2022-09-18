import { Request } from 'express';
import { createClient } from 'redis';
import JWTR from 'jwt-redis';
// @ts-ignore
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

import { getConfig } from './config';
import { hmacSha256, encodeString, getQueryData, generateRandomString } from './utils';
import { UpsertUserParams, getUserByUuid } from './models/users';

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
    console.error('Missing Session in request');
    return '/';
  }

  const { discourseUrl, discourseSsoSecret } = getConfig();
  const ssoReturnUrl = `${req.headers.referer}api/auth/sso/verify`;
  const nonce = generateRandomString(16, 'base64');
  const query = `nonce=${nonce}&return_sso_url=${ssoReturnUrl}`;
  const payload = encodeString(query, 'utf8', 'base64');
  const sig = hmacSha256(payload, discourseSsoSecret, 'hex');

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
  // Make sure the sso string is authenticity by comparing its encrypted
  // bytes (using the private key) to the signature bytes
  const { discourseSsoSecret } = getConfig();
  const ssoHmac = hmacSha256(sso, discourseSsoSecret) as Buffer;
  const isValidSignature = Buffer.compare(ssoHmac, Buffer.from(sig, 'hex')) === 0; // 0 means no difference
  if (!isValidSignature) {
    console.log('Invalid signature for', sso);
    return false;
  }

  const ssoStr = encodeString(sso, 'base64', 'utf8');
  const ssoData = getQueryData(ssoStr) as DiscourseSsoData;
  const isValidNonce = req.session.nonce === ssoData.nonce;

  if (req.session.nonce) {
    delete req.session.nonce;
  }

  if (!isValidNonce) {
    console.log('Nonce value does not match with one in session', ssoData.nonce);
    return false;
  }

  return isValidSignature && isValidNonce;
}

export type TokenData = {
  uuid: string;
  email: string;
  fullName: string | null;
  role: string;
  jti?: string;
};

let jwtr: JWTR | null = null;

export async function getJwtr() {
  if (!jwtr) {
    const { redisUrl } = getConfig();
    const redisClient = createClient<Record<string, never>, Record<string, never>>({
      url: redisUrl,
    });
    await redisClient.connect();
    redisClient.on('error', () => {});
    jwtr = new JWTR(redisClient);
  }
  return jwtr;
}

// Create a JWT token
export async function createToken(data: TokenData): Promise<{ token: string; exp: number } | null> {
  try {
    const { jwtSecret } = getConfig();
    const jwtr = await getJwtr();
    // token will expire in 16 minutes
    const token = await jwtr.sign(data, jwtSecret, { expiresIn: '16 minutes' });
    await jwtr.verify(token, jwtSecret);
    const { exp } = await jwtr.decode<{ exp: number }>(token);
    return { token, exp };
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
  const isVolunteer = groups && groups.split(',').indexOf('volunteers') > -1;
  if (isAdmin || isVolunteer) {
    return {
      email,
      discourseUserId: external_id ? parseInt(external_id, 10) : undefined,
      fullName: name ? name.replace('+', ' ') : undefined,
    };
  }
  return null;
}

export async function logUserOutOfDiscourse(uuid: string): Promise<boolean> {
  try {
    const { discourseApiKey, discourseApiUser } = getConfig();
    const u = await getUserByUuid(uuid);
    if (!u) {
      return false;
    }
    const { discourseUrl } = getConfig();
    const response = await fetch(`${discourseUrl}/admin/users/${u.discourseUserId}/log_out.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': discourseApiKey,
        'Api-Username': discourseApiUser,
      },
    });
    const status = response.status;
    if (status !== 200) {
      console.log('unable to log user out of Discourse. Request status code: ', status);
      return false;
    }
    return true;
  } catch (error) {
    console.log('unable to log user out of Discourse: ', error);
    return false;
  }
}
