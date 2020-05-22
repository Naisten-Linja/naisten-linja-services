import express from 'express';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import winston from 'winston';
import expressWinston from 'express-winston';

import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import onlineLetterRoutes from './onlineLetterRoutes';
import letterRoutes from './letterRoutes';

import { getConfig } from './config';

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
        '/api/auth',
        '/api/auth/sso',
        '/api/auth/sso/verify',
        /^\/api\/auth\/token\/.*/,
        '/api/online-letter/start',
        '/api/online-letter/send',
        '/api/online-letter/read',
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

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/online-letter', onlineLetterRoutes);
  app.use('/api/letters', letterRoutes);

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
