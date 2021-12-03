import express from 'express';

import { generateRandomString } from './utils';
import { createSso, validateSsoRequest, createToken, generateUserDataFromSsoRequest } from './auth';
import { upsertUser } from './models/users';
import { getConfig } from './config';

const router = express.Router();

router.get('/sso', async (req, res) => {
  if (!req.session) {
    console.error('Missing Session in request');
    res.redirect(
      `${req.headers.referer}login?error=${encodeURIComponent(
        JSON.stringify({ error: 'unable to login' }),
      )}`,
    );
    return;
  }
  // req.session.touch();
  const redirectUrl = createSso(req);
  res.redirect(redirectUrl);
});

router.get('/sso/verify', async (req, res) => {
  const { serviceUrl } = getConfig();
  if (!req.session) {
    console.log('Missing Session in request');
    res.redirect(
      `${serviceUrl}/login?error=${encodeURIComponent(
        JSON.stringify({ error: 'unable to login' }),
      )}`,
    );
  }
  if (!validateSsoRequest(req)) {
    console.log('Invalid sso return request', req.query);
    res.redirect(
      `${serviceUrl}/login?error=${encodeURIComponent(
        JSON.stringify({ error: 'unable to login' }),
      )}`,
    );
    return;
  }

  const userData = generateUserDataFromSsoRequest(req);
  if (!userData) {
    console.log('Invalid user data', req.query);
    res.redirect(
      `${serviceUrl}/login?error=${encodeURIComponent(
        JSON.stringify({ error: 'not allowed role' }),
      )}`,
    );
    return;
  }
  // Create/Update user information in the database
  const user = await upsertUser(userData);
  if (!user || !req.session) {
    res.redirect(
      `${serviceUrl}/login?error=${encodeURIComponent(
        JSON.stringify({ error: 'unable to login' }),
      )}`,
    );
    return;
  }

  const token = await createToken({
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    uuid: user.uuid,
  });
  const tokenNonce = generateRandomString(16, 'base64');
  req.session.tokenData = {
    token,
    nonce: tokenNonce,
  };
  res.redirect(`${serviceUrl}/login/${encodeURIComponent(tokenNonce)}`);
});

router.get('/token/:nonce', (req, res) => {
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

export default router;
