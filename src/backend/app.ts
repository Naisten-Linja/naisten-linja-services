import express, { Request } from 'express';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';

import { getConfig } from './config';
import { getQueryData, encodeString, generateNonce } from './utils';
import { createSso, validateSsoRequest, createToken, generateUserDataFromSsoRequest } from './auth';
import { upsertUser, UpsertUserParams } from './models/user';

export function createApp(port: number) {
  const { cookieSecret, hostName, environment, frontendUrl } = getConfig();

  const app = express();

  // TODO: add rateLimitter middleware
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Express-Middleware

  // Required for session cookie to work behind a proxy
  app.set('trust proxy', 1);

  app.use(
    bodyParser({
      type: 'application/json',
    }),
  );
  // Add CORS headers
  app.use(
    cors({
      credentials: true,
      origin: frontendUrl,
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    }),
  );
  // Add session support - this is needed for SSO
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
    const { frontendUrl } = getConfig();
    if (!req.session) {
      console.log('Missing Session in request');
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(JSON.stringify({ error: 'unable to login' }))}`);
      return;
    }
    const redirectUrl = createSso(req);
    res.redirect(redirectUrl);
  });

  app.get('/auth/sso/verify', async (req, res) => {
    const { frontendUrl } = getConfig();
    if (!req.session) {
      console.log('Missing Session in request');
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(JSON.stringify({ error: 'unable to login' }))}`);
    }
    if (!validateSsoRequest(req)) {
      console.log('Invalid sso return request', req.query);
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(JSON.stringify({ error: 'unable to login' }))}`);
      return;
    }

    const userData = generateUserDataFromSsoRequest(req);
    // Create/Update user information in the database
    const user = await upsertUser(userData);
    if (!user) {
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(JSON.stringify({ error: 'unable to login' }))}`);
      return;
    }

    const token = await createToken({
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      uuid: user.uuid,
    });
    const tokenNonce = generateNonce();
    req.session!.tokenData = {
      token,
      nonce: tokenNonce,
    };
    res.redirect(`${frontendUrl}/login/${encodeURIComponent(tokenNonce)}`);
  });

  app.get('/auth/token/:nonce', (req, res) => {
    const nonce = req.param('nonce');
    if (!req.session || !req.session.tokenData || !nonce) {
      res.status(403).json({ error: 'unauthorized' });
      return;
    }

    if (nonce !== req.session.tokenData.nonce) {
      res.status(403).json({ error: 'unauthorized' });
      console.log('Nonce value for token request does not match');
      return;
    }

    const token = req.session.tokenData.token;
    // Now the Single Sign On process from Discourse is done, delete the session token
    delete req.session.tokenData;

    res.json({
      data: {
        token,
      },
    });
  });

  return app;
}

const { port } = getConfig();
const app = createApp(port);
app.listen(port, () => console.log(`app listening at http://localhost:${port}`));
