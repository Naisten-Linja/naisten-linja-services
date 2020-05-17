import express, { Request } from 'express';
import session from 'express-session';

import { getConfig } from './config';
import { getQueryData, encodeString } from './utils';
import { createSso, validateSsoRequest, createToken } from './auth';

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

    if (req.session) {
      req.session.token = token;
    }

    // TODO: create or update existing user information
    // TODO: redirect to frontend with a get parameter to request for the token

    res.json(ssoData);
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
