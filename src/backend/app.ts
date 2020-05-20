import express, { Request } from 'express';
import session from 'express-session';

import { getConfig } from './config';
import { getQueryData, encodeString, generateNonce } from './utils';
import { createSso, validateSsoRequest, createToken, generateUserDataFromSsoRequest } from './auth';
import { upsertUser, UpsertUserParams } from './models/user';

export function createApp(port: number) {
  const { cookieSecret, hostName, environment } = getConfig();

  const app = express();

  // TODO: add rateLimitter middleware
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Express-Middleware

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
    console.log(user);

    const token = await createToken({
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      uuid: user.uuid,
    });
    req.session!.token = token;

    const tokenNonce = generateNonce();
    req.session!.tokenNonce = tokenNonce;
    res.redirect(`${frontendUrl}/login?nonce=${encodeURIComponent(tokenNonce)}`);
  });

  app.get('/auth/token', (req, res) => {
    if (!req.session || !req.session.token) {
      res.status(403).json({ error: 'unauthorized' });
      return;
    }
    const token = req.session.token;

    // Now the Single Sign On process from Discourse is done, delete the session token
    delete req.session.token;

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
