import express from 'express';

import { generateRandomString } from '../utils';
import {
  createSso,
  validateSsoRequest,
  createToken,
  generateUserDataFromSsoRequest,
  logUserOutOfDiscourse,
  getJwtr,
  TokenData,
} from '../auth';
import { UserRole } from '../../common/constants-common';
import { upsertUser } from '../models/users';
import { getConfig } from '../config';
import { isAuthenticated } from '../middlewares';

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

  const t = await createToken({
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    uuid: user.uuid,
  });

  if (!t) {
    res.redirect(`${serviceUrl}/login`);
    return;
  }

  const tokenNonce = generateRandomString(16, 'base64');

  req.session.tokenData = {
    token: t.token,
    tokenExpirationTime: t.exp,
    nonce: tokenNonce,
  };
  res.redirect(`${serviceUrl}/login/${encodeURIComponent(tokenNonce)}`);
});

router.get('/token/:nonce', async (req, res) => {
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
  const expiresAt = req.session.tokenData.tokenExpirationTime;

  // Now the Single Sign On process from Discourse is done, delete the session token
  delete req.session.tokenData;

  res.json({
    data: {
      token,
      expiresAt,
    },
  });
});

router.post('/logout', async (req, res) => {
  try {
    const { user } = req;
    if (user && req.headers.authorization) {
      const { jwtSecret } = getConfig();
      const token = req.headers.authorization.replace('Bearer ', '');
      const jwtr = await getJwtr();
      const tokenData = await jwtr.verify<TokenData>(token, jwtSecret);
      if (tokenData && tokenData.jti) {
        await jwtr.destroy(tokenData.jti);
      }
      const success = await logUserOutOfDiscourse(user.uuid);
      res.status(201).json({
        data: { success },
      });
      return;
    }
    res.status(401).json({ data: { success: false } });
  } catch (err) {
    console.log(err);
    res.status(401).json({ data: { success: false } });
  }
});

router.post<
  Record<string, never>,
  | {
      data: {
        token: string;
        expiresAt: number;
      };
    }
  | { error: string }
>('/refresh', isAuthenticated([UserRole.staff, UserRole.volunteer]), async (req, res) => {
  try {
    const { jwtSecret } = getConfig();

    // These information should always be available if the user is authenticated
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const token = authorizationHeader.substr('Bearer '.length, authorizationHeader.length);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = req.user!;

    const jwtr = await getJwtr();

    const tokenData = await jwtr.verify<TokenData>(token, jwtSecret);
    if (tokenData && tokenData.jti) {
      await jwtr.destroy(tokenData.jti);
    }

    const t = await createToken({
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      uuid: user.uuid,
    });

    if (!t) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    res.status(201).json({
      data: {
        token: t.token,
        expiresAt: t.exp,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: 'unauthorized' });
  }
});

/**
 * Redirect the user to their Discourse profile information.
 *
 * This can not be done on frontend because it does not know the
 * Discourse server address, because the address is only specified
 * in the environment variables.
 *
 * THIS ROUTE IS NOT PROTECTED BY ANY AUTHENTICATION
 */
router.get('/profile-redirect', async (_, res) => {
  const { discourseUrl } = getConfig();
  res.redirect(`${discourseUrl}/my/preferences/account`, 302);
});

export default router;
