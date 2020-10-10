import express from 'express';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import winston from 'winston';
import expressWinston from 'express-winston';
import path from 'path';

import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import onlineLetterRoutes from './onlineLetterRoutes';
import letterRoutes from './letterRoutes';
import { getUserByUuid } from './models/users';

import { getConfig } from './config';

export function createApp() {
  const { cookieSecret, environment, jwtSecret, allowedOrigins } = getConfig();

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

  if (allowedOrigins) {
    app.use(
      cors({
        credentials: true,
        origin: allowedOrigins,
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
      }),
    );
  }

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
        // Cookie is needed only in /auth routes for Discourse SSO
        path: '/api/auth',
        // Cookie will expires if ther is no new requests for 10 minutes , and
        // a new empty cookie will be generated instead.
        // In the context of our SSO login flow, this means the user has 10 minutes
        // to complete the login process in Discourse
        maxAge: 600000,
        ...(environment === 'production'
          ? { domain: 'naistenlinja-services-dev.herokuapp.com' }
          : {}),
      },
    }),
  );

  app.use('/', express.static(path.join(__dirname, '../../build')));

  app.use(
    jwt({ secret: jwtSecret }).unless({
      path: [
        '/api/auth',
        '/api/auth/sso',
        '/api/auth/sso/verify',
        /^\/api\/auth\/token\/.*/,
        '/api/online-letter/start',
        '/api/online-letter/send',
        '/api/online-letter/read',
        // Disable authentication for all routes that does not start with `/api`
        /^(?!\/api.*$).*/,
      ],
    }),
  );

  // @ts-ignore
  app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({ error: 'unauthorized' });
    }
    next();
  });
  // @ts-ignore
  app.use(async (req, res, next) => {
    // @ts-ignore
    const { user } = req;
    if (user && user.uuid) {
      const dbUser = await getUserByUuid(user.uuid);
      // Check if user information in jwt token matches info from the database.
      if (
        !dbUser ||
        dbUser.role !== user.role ||
        dbUser.email !== user.email ||
        dbUser.fullName !== user.fullName
      ) {
        res.status(401).json({ error: 'invalid jwt token' });
        return;
      }
    }
    next();
  });

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

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/online-letter', onlineLetterRoutes);
  app.use('/api/letters', letterRoutes);

  app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, '../../build/index.html'));
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
