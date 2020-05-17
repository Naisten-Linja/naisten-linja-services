import crypto, { HexBase64Latin1Encoding } from 'crypto';
import jwt from 'jsonwebtoken';
import express, { Request } from 'express';
import session from 'express-session';
import url from 'url';

function checkVariables() {
  [
    'ENVIRONMENT',
    'DISCOURSE_URL',
    'BACKEND_URL',
    'FRONTEND_URL',
    'DISCOURSE_SSO_SECRET',
    'COOKIE_SECRET',
    'JWT_PUBLIC_KEY',
    'JWT_PRIVATE_KEY',
  ].forEach((key) => {
    if (!(key in process.env)) {
      throw `Missing variable ${key} from your environment`;
    }
  });
}

function getConfig() {
  checkVariables();

  const backendUrl = process.env.BACKEND_URL!;
  const { hostname } = url.parse(backendUrl);

  if (hostname === null) {
    throw `BACKEND_URL has hostname = null!`;
  }
  return {
    discourseUrl: process.env.DISCOURSE_URL!,
    discourseSsoSecret: process.env.DISCOURSE_SSO_SECRET!,
    backendUrl: process.env.BACKEND_URL!,
    cookieSecret: process.env.COOKIE_SECRET!,
    environment: process.env.ENVIRONMENT!,
    hostName: hostname,
    jwtPublicKey: process.env.JWT_PUBLIC_KEY!,
    jwtPrivateKey: process.env.JWT_PRIVATE_KEY!,
  };
}

// Encode string from a defined encoding to a different form
const encodeString = (s: string, encodingFrom: BufferEncoding, encodingTo: BufferEncoding) =>
  Buffer.from(s, encodingFrom).toString(encodingTo);

// Generate a random 16 bytes string and return its base64 encoded value
const generateNonce = () => crypto.randomBytes(16).toString('base64');

// Generate a HMAC SHA-256 hash using the provided Discourse SSO key
function hmacSha256(payload: string, encoding?: HexBase64Latin1Encoding) {
  const { discourseSsoSecret } = getConfig();

  return encoding
    ? crypto.createHmac('sha256', discourseSsoSecret).update(payload).digest(encoding)
    : crypto.createHmac('sha256', discourseSsoSecret).update(payload, 'utf8').digest();
}

// Generate login redirect link and 'nonce' value using steps defined at
// https://meta.discourse.org/t/using-discourse-as-a-sso-provider/32974
//
// - Generate a random 'nonce'. Save it temporarily to compare with returned 'nonce' when user is redirected back from discourse
// - Create a new query string with nonce and return url (where the Discourse will redirect user after verification). It should look like "nonce=NONCE&return_sso_url=RETURN_URL"
// - Base64 encode the above query string. Let’s call this 'payload'
// - Generate a HMAC-SHA256 signature from 'payload' using your sso provider secret as the key, then create a lower case hex string from this. Let’s call this signature as HEX_SIGNATURE
// - URL encode the above 'payload'. Let’s call this payload as URL_ENCODED_PAYLOAD
// - Redirect user to the discourse url DISCOURSE_ROOT_URL/session/sso_provider?sso=URL_ENCODED_PAYLOAD&sig=HEX_SIGNATURE
function createSso(req: Request) {
  if (!req.session) {
    return '/';
  }

  const { backendUrl, discourseUrl } = getConfig();
  const ssoReturnUrl = `${backendUrl}/auth/sso/verify`;
  const nonce = generateNonce();
  const query = `nonce=${nonce}&return_sso_url=${ssoReturnUrl}`;
  const payload = encodeString(query, 'utf8', 'base64');
  const sig = hmacSha256(payload, 'hex');

  // keep 'nonce' value in cookie to compare with the return request from discourse in 'validateSsoRequest'
  req.session.nonce = nonce;

  return `${discourseUrl}/session/sso_provider?sso=${encodeURIComponent(payload)}&sig=${sig}`;
}

function getQueryData(queryString: string) {
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

// Validate the sso request after redirected back from Discourse
//
// Criterias:
// - 'sig' and 'sso' exist as get parameters, and are strings
// - HMAC SHA-256 hash from 'sso' in bytes === 'sig' in byfes
// - 'nonce' value in the decoded 'sso' equals 'session.nonce'
//   ('session.nonce' was set before redirecting user to discourse in '/auth/sso')
function validateSsoRequest(req: Request) {
  const { sig, sso } = req.query;

  if (!req.session || !req.session.nonce) {
    console.log('Session information not found');
    return false;
  }

  if (!sig || !sso || typeof sig !== 'string' || typeof sso !== 'string') {
    console.log('Missing or invalid "sso" or "sig" query parameter');
    return false;
  }

  const ssoHmac = hmacSha256(sso) as Buffer;
  const isValidSignature = Buffer.compare(ssoHmac, Buffer.from(sig, 'hex')) === 0; // 0 means no difference
  const ssoStr = encodeString(sso, 'base64', 'utf8');
  const ssoData = getQueryData(ssoStr);
  const isValidNonce = req.session.nonce === ssoData.nonce;

  return isValidSignature && isValidNonce;
}

// Create a JWT token
async function createToken(data: Record<string, string>) {
  try {
    const { jwtPrivateKey } = getConfig();
    const token = await jwt.sign(data, jwtPrivateKey, { expiresIn: '7d' }); // token will expire in 7 days
    return token;
  } catch (err) {
    console.error('Failed to create token');
    console.error(err);
  }
}

function createApp(port: number) {
  const { cookieSecret, hostName, environment } = getConfig();

  const app = express();

  // TODO: add rateLimitter middleware

  // Required for session cookie to work behind a proxy
  app.set('trust proxy', 1);
  app.use(
    session({
      secret: cookieSecret,
      name: 'session',
      cookie: {
        secure: environment === 'production',
        httpOnly: true,
        domain: hostName,
        path: '/auth',
        expires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    }),
  );

  app.get('/auth/sso', (req, res) => {
    if (!req.session) {
      console.log('Missing Session in request');
      res.status(400).json({ error: 'session is not supported' });
      return;
    }
    const redirectUrl = createSso(req);
    res.redirect(redirectUrl);
  });

  app.get('/auth/sso/verify', async (req, res) => {
    if (!validateSsoRequest(req)) {
      console.log('Invalid sso return request');
      res.status(403).json({ error: 'unauthorized' });
      return;
    }
    if (req.session) {
      // clear nonce value now that it is not needed anymore
      delete req.session.nonce;
    }
    const ssoStr = encodeString(`${req.query.sso}`, 'base64', 'utf8');
    const ssoData = getQueryData(ssoStr);
    const { external_id, email, name, username } = ssoData;

    if (!external_id || !email || !name || !username) {
      res.status(400).json({ error: 'missing user data from sso return request' });
      return;
    }

    const token = await createToken({
      userName: username,
      userId: external_id,
      userEmail: email,
      userFullName: name,
    });

    console.log('TOKEN', token);

    res.json(ssoData);
  });

  app.get('/auth/token', (req, res) => {});

  return app;
}

const port = 3000;
const app = createApp(port);
app.listen(port, () => console.log(`app listening at http://localhost:${port}`));
