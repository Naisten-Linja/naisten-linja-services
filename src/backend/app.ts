import express from 'express';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import winston from 'winston';
import expressWinston from 'express-winston';

import authRoutes from './authRoutes';
import { UserRole, ApiLetterAdmin } from '../common/constants-common';
import { getConfig } from './config';
import { getApiUsers, updateApiUserRole } from './controllers/userControllers';
import {
  assignLetter,
  initiateLetter,
  sendLetter,
  readLetter,
  getAllLetters,
} from './controllers/letterControllers';

export function createApp() {
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

  app.use(
    expressWinston.logger({
      transports: [new winston.transports.Console()],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf((info) => {
          const { timestamp, level, message } = info;
          const ts = timestamp.slice(0, 19).replace('T', ' ');
          return `${ts} [${level}]: ${message}`;
        }),
      ),
      expressFormat: true,
      colorize: true,
    }),
  );

  app.use('/auth', authRoutes);

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
      res
        .status(400)
        .json({ error: `invalid role. allowed roles are ${Object.values(UserRole).join(', ')}` });
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

  app.post('/online-letter/start', async (_, res) => {
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

    const letter = await sendLetter({
      uuid,
      accessKey,
      accessPassword,
      title: trimmedTitle,
      content: trimmedContent,
    });
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

  app.use(
    expressWinston.errorLogger({
      transports: [new winston.transports.Console()],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf((info) => {
          const { timestamp, level, message } = info;
          const ts = timestamp.slice(0, 19).replace('T', ' ');
          return `${ts} [${level}]: ${message}`;
        }),
      ),
    }),
  );

  return app;
}

const { port } = getConfig();
const app = createApp();
app.listen(port, () => console.log(`app listening at http://localhost:${port}`));
