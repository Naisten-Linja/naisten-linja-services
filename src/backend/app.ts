import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import winston from 'winston';
import expressWinston from 'express-winston';
import path from 'path';
import redis from 'redis';
import connectRedis, { RedisStore } from 'connect-redis';
import cron from 'node-cron';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import onlineLetterRoutes from './routes/onlineLetterRoutes';
import letterRoutes from './routes/letterRoutes';
import bookingTypesRoutes from './routes/bookingTypesRoutes';
import bookingRoutes from './routes/bookingRoutes';
import pageRoutes from './routes/pageRoutes';
import { getUserByUuid } from './models/users';
import { getConfig } from './config';
import { getJwtr } from './auth';
import { sendBookingRemindersToVolunteers } from './controllers/emailControllers';

export function createApp() {
  const { cookieSecret, environment, jwtSecret, allowedOrigins, hostname, redisUrl } = getConfig();

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

  const redisClient = redis.createClient({ url: redisUrl });
  redisClient.on('error', (err) => {
    console.log('Redis error: ', err);
  });
  const storeOption: { store?: RedisStore } = {};

  const redisStore = connectRedis(session);
  storeOption.store = new redisStore({ client: redisClient, url: redisUrl });

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
        ...(environment === 'production' ? { domain: hostname } : {}),
      },
      ...storeOption,
    }),
  );

  // In production, serve the all the frontend static files in the `./build` directory
  app.use('/', express.static(path.join(__dirname, '../../build')));

  const jwtr = getJwtr();

  app.use(
    jwt({
      secret: jwtSecret,
      algorithms: ['HS256'],
      isRevoked: async (req, _, done) => {
        try {
          const authHeader = req.headers.authorization;
          if (!authHeader) {
            return done(new Error('missing auth header'));
          }
          const token = authHeader.replace('Bearer ', '');
          await jwtr.verify(token, jwtSecret);
          done(null, false);
        } catch (err) {
          // @ts-ignore
          if (err.name === 'TokenDestroyedError') {
            return done(null, true);
          } else {
            return done(err, true);
          }
        }
      },
    }).unless({
      path: [
        '/api/auth/sso',
        '/api/auth/sso/verify',
        '/api/auth/profile-redirect',
        /^\/api\/auth\/token\/.*/,
        '/api/online-letter/start',
        '/api/online-letter/send',
        '/api/online-letter/read',
        // Disable authentication for all routes that does not start with `/api`
        /^(?!\/api.*$).*/,
      ],
    }),
  );

  app.use(async (req: Request, res: Response, next: NextFunction) => {
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
  app.use('/api/profile', profileRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/online-letter', onlineLetterRoutes);
  app.use('/api/letters', letterRoutes);
  app.use('/api/booking-types', bookingTypesRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/pages', pageRoutes);

  // Support for SPA routes when hard refreshing a frontend page.
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

  // @ts-ignore
  app.use((err, _, res, next) => {
    // Return human readable error message in case jwtr.verify throws an error
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({ error: err.message });
    }
    next();
  });

  activateNotificationCronJobs();

  return app;
}

function activateNotificationCronJobs() {
  // Send booking notifications to volunteers
  // some days before the booking they had made.
  const hour = getConfig().bookingReminderSendingHour;
  const daysBeforeString = getConfig().bookingReminderDaysBefore;
  if (!hour) {
    console.warn(
      'Env BOOKING_REMINDER_SENDING_HOUR was not set, not sending any booking reminders',
    );
    return;
  }
  if (!daysBeforeString) {
    console.warn('Env BOOKING_REMINDER_DAYS_BEFORE was not set, not sending any booking reminders');
    return;
  }
  const daysBefore = parseInt(daysBeforeString, 10);
  if (isNaN(daysBefore)) {
    console.warn(
      `Env BOOKING_REMINDER_DAYS_BEFORE was set to an invalid value "${daysBefore}", not a single number`,
    );
  }

  cron.schedule(`0 ${hour} * * *`, async () => {
    const results = await sendBookingRemindersToVolunteers(daysBefore);

    if (typeof results === 'undefined') {
      console.log('Failed to run sendBookingRemindersToVolunteers');
    } else {
      const success = results.filter((res) => res).length;
      const errors = results.length - success;
      console.log(`Sent ${success} emails, failed to send ${errors} emails`);
    }
  });
}
