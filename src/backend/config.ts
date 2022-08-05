export function checkVariables(
  envVars: NodeJS.ProcessEnv,
  requiredKeys: Array<keyof NodeJS.ProcessEnv>,
) {
  const missingKeys = requiredKeys.filter((key) => !envVars[key]);
  if (missingKeys.length > 0) {
    throw `Variable(s) ${missingKeys.join(', ')} are missing from your environment`;
  }
}

export function getConfig() {
  checkVariables(process.env, [
    'ENVIRONMENT',
    'PORT',
    'PORT',
    'DB_NAME',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_PORT',
    'DISCOURSE_URL',
    'DISCOURSE_SSO_SECRET',
    'DISCOURSE_API_KEY',
    'DISCOURSE_API_USER',
    'COOKIE_SECRET',
    'JWT_SECRET',
    'LETTER_ACCESS_KEY_SALT',
    'LETTER_AES_KEY',
    'REDIS_URL',
  ]);

  if (process.env.ENVIRONMENT !== 'production' && !process.env.FRONTEND_PORT) {
    throw 'Variable FRONTEND_PORT is missing from your environment';
  }

  if (process.env.ENVIRONMENT === 'production' && !process.env.SENDGRID_API_KEY) {
    throw 'Variable SENDGRID_API_KEY is missing from your environment';
  }
  if (process.env.ENVIRONMENT === 'production' && !process.env.SENDGRID_FROM_EMAIL_ADDRESS) {
    throw 'Variable SENDGRID_FROM_EMAIL_ADRESS is missing from your environment';
  }
  if (process.env.ENVIRONMENT === 'production' && !process.env.SENDGRID_BOOKING_TEMPLATE_ID) {
    throw 'Variable SENDGRID_BOOKING_TEMPLATE_ID is missing from your environment';
  }

  // `checkVariables` should ensure required variables are available here. Unfortunately typescript
  // is not able to pick this up automatically. So disabling no-non-null-assertion eslint rule here.
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const hostname = process.env.APP_DOMAIN || 'localhost';
  const port = parseInt(process.env.PORT!, 10);
  const serviceUrlProtocol = hostname === 'localhost' ? 'http' : 'https';
  const serviceUrlPort = hostname === 'localhost' ? `:${process.env.FRONTEND_PORT}` : '';
  const serviceUrl = `${serviceUrlProtocol}://${hostname}${serviceUrlPort}`;

  return {
    environment: process.env.ENVIRONMENT,
    hostname,
    serviceUrl,
    port,
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
      : null,

    discourseUrl: process.env.DISCOURSE_URL!,
    discourseSsoSecret: process.env.DISCOURSE_SSO_SECRET!,
    discourseApiKey: process.env.DISCOURSE_API_KEY!,
    discourseApiUser: process.env.DISCOURSE_API_USER!,
    cookieSecret: process.env.COOKIE_SECRET!,

    jwtSecret: process.env.JWT_SECRET!,
    letterAccessKeySalt: process.env.LETTER_ACCESS_KEY_SALT!,
    letterAesKey: process.env.LETTER_AES_KEY!,

    dbName: process.env.DB_NAME!,
    dbUser: process.env.DB_USERNAME!,
    dbPassword: process.env.DB_PASSWORD!,
    dbHost: process.env.DB_HOST!,
    dbPort: parseInt(process.env.DB_PORT!, 10),

    redisUrl: process.env.REDIS_URL!,

    sendGridApiKey: process.env.SENDGRID_API_KEY || null,
    sendGridFromEmailAddress: process.env.SENDGRID_FROM_EMAIL_ADDRESS || null,
    sendGridBookingTemplateId: process.env.SENDGRID_BOOKING_TEMPLATE_ID || null,
  };
}
