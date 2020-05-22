import express, { Request } from 'express';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'express-jwt';

import { UserRole, ApiLetterAdmin } from '../common/constants-common';
import { getConfig } from './config';
import { getQueryData, encodeString, generateRandomString } from './utils';
import { createSso, validateSsoRequest, createToken, generateUserDataFromSsoRequest } from './auth';
import { upsertUser, UpsertUserParams } from './models/users';
import { getApiUsers, updateApiUserRole } from './controllers/userControllers';
import { assignLetter, initiateLetter, sendLetter, readLetter, getAllLetters } from './controllers/letterControllers';

export function createApp(port: number) {
  const { cookieSecret, hostName, environment, frontendUrl, jwtPrivateKey } = getConfig();

  const app = express();

  // TODO: add rateLimitter middleware
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Express-Middleware

  // Required for session cookie to work behind a proxy
  app.set('trust proxy', 1);

  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );
  app.use(bodyParser.json());
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
      saveUninitialized: true,
      resave: true,
      cookie: {
        secure: environment === 'production',
        httpOnly: true,
        domain: hostName,
        // Cookie is needed only in /auth routes for Discourse SSO
        path: '/auth',
        // Cookie will expires if ther is no new requests for 10 minutes , and
        // a new empty cookie will be generated instead.
        // In the context of our SSO login flow, this means the user has 10 minutes
        // to complete the login process in Discourse
        maxAge: 600000,
      },
    }),
  );
  app.use(
    jwt({ secret: jwtPrivateKey }).unless({
      path: [
        '/auth',
        '/auth/sso',
        '/auth/sso/verify',
        /^\/auth\/token\/.*/,
        '/online-letter/start',
        '/online-letter/send',
        '/online-letter/read',
      ],
    }),
  );

  app.get('/auth/sso', async (req, res) => {
    const { frontendUrl } = getConfig();
    if (!req.session) {
      console.log('Missing Session in request');
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(JSON.stringify({ error: 'unable to login' }))}`);
      return;
    }
    // req.session.touch();
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
    const tokenNonce = generateRandomString(16, 'base64');
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

  app.get('/users', async (req, res) => {
    // Only allow admin to see users list
    // @ts-ignore
    if (req.user.role !== UserRole.staff) {
      res.status(403).json({ error: 'unauthorized' });
      return;
    }
    const users = await getApiUsers();
    res.status(200).json({ data: users });
  });

  app.put('/users/:uuid/role', async (req, res) => {
    // Only allow staff to edit user's role
    // @ts-ignore
    if (req.user.role !== UserRole.staff) {
      res.status(403).json({ error: 'unauthorized' });
      return;
    }

    // Verify if role in request body is valid
    if (!req.body.role || Object.values(UserRole).indexOf(req.body.role) < 0) {
      res.status(400).json({ error: `invalid role. allowed roles are ${Object.values(UserRole).join(', ')}` });
      return;
    }

    // Update the user's role with uuid specifed in route
    const updatedUser = await updateApiUserRole({ uuid: req.params.uuid, role: req.body.role });
    if (!updatedUser) {
      res.status(400).json({ error: `unable to update user` });
      return;
    }
    res.status(201).json({ data: updatedUser });
  });

  app.post('/online-letter/start', async (req, res) => {
    const letter = await initiateLetter();
    if (!letter) {
      res.status(400).json({ error: 'unable to start a letter' });
      return;
    }
    res.status(201).json({ data: letter });
  });

  app.post('/online-letter/send', async (req, res) => {
    const { uuid, title, content, accessKey, accessPassword } = req.body;
    const trimmedTitle = title ? title.trim() : '';
    const trimmedContent = content ? content.trim() : '';

    if (!uuid || !trimmedTitle || !trimmedContent || !accessKey || !accessPassword) {
      res.status(400).json({ error: 'missing title, content, accessKey or accessPassword' });
      return;
    }

    const letter = await sendLetter({ uuid, accessKey, accessPassword, title: trimmedTitle, content: trimmedContent });
    if (!letter) {
      res.status(400).json({ error: 'failed to send letter' });
      return;
    }
    res.status(201).json({ data: { success: true } });
  });

  app.post('/online-letter/read', async (req, res) => {
    const { accessKey, accessPassword } = req.body;
    if (!accessKey || !accessPassword) {
      res.status(400).json({ error: 'missing title, content, accessKey or accessPassword' });
      return;
    }
    const letter = await readLetter({ accessKey, accessPassword });
    if (!letter) {
      res.status(403).json({ error: 'Wrong letter access credentials' });
      return;
    }
    const letterContent = {
      title: letter.title,
      content: letter.content,
      created: letter.created,
    };
    res.status(200).json({ data: letterContent });
  });

  app.get('/letters', async (req, res) => {
    // Only allow staff to edit user's role
    // @ts-ignore
    if (req.user.role !== UserRole.staff) {
      res.status(403).json({ error: 'unauthorized' });
      return;
    }
    const letters = await getAllLetters();
    if (!letters) {
      res.status(200).json({ data: [] });
      return;
    }
    const result = letters
      .map(
        (letter): ApiLetterAdmin => {
          const { created, uuid, title, content, assignedResponderUuid, status } = letter;
          return { uuid, created, title, content, assignedResponderUuid, status };
        },
      )
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    res.status(200).json({ data: result });
  });

  app.post('/letters/assign', async (req, res) => {
    // Only allow staff to edit user's role
    // @ts-ignore
    if (req.user.role !== UserRole.staff) {
      res.status(403).json({ error: 'unauthorized' });
      return;
    }

    const { letterUuid, assigneeUuid } = req.body;
    if (!letterUuid || !assigneeUuid) {
      res.status(400).json({ error: 'missing letterUuid or assigneeUuid in request body' });
      return;
    }

    const letter = await assignLetter({ letterUuid, assigneeUuid });
    if (!letter) {
      res.status(400).json({ error: 'failed to assign letter' });
      return;
    }
    res.status(201).json({ data: letter });
  });

  return app;
}

const { port } = getConfig();
const app = createApp(port);
app.listen(port, () => console.log(`app listening at http://localhost:${port}`));
