export function checkVariables() {
  [
    'ENVIRONMENT',
    'PORT',
    'DISCOURSE_URL',
    'DISCOURSE_SSO_SECRET',
    'COOKIE_SECRET',
    'JWT_SECRET',
    'LETTER_ACCESS_KEY_SALT',
    'LETTER_AES_KEY',
    'DB_NAME',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_PORT',
  ].forEach((key) => {
    if (!(key in process.env)) {
      throw `Missing variable ${key} from your environment`;
    }
  });
}

export function getConfig() {
  checkVariables();

  return {
    environment: process.env.ENVIRONMENT!,
    hostname: process.env.HOSTNAME || 'localhost',
    serviceUrl: `${
      process.env.HOSTNAME === 'localhost' || !process.env.HOSTNAME ? 'http' : 'https'
    }://${process.env.HOSTNAME || 'localhost:3000'}`,

    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : null,
    port: parseInt(process.env.PORT!, 10),

    discourseUrl: process.env.DISCOURSE_URL!,
    discourseSsoSecret: process.env.DISCOURSE_SSO_SECRET!,
    cookieSecret: process.env.COOKIE_SECRET!,

    jwtSecret: process.env.JWT_SECRET!,
    letterAccessKeySalt: process.env.LETTER_ACCESS_KEY_SALT!,
    letterAesKey: process.env.LETTER_AES_KEY!,

    dbName: process.env.DB_NAME!,
    dbUser: process.env.DB_USERNAME!,
    dbPassword: process.env.DB_PASSWORD!,
    dbHost: process.env.DB_HOST!,
    dbPort: parseInt(process.env.DB_PORT!, 10),

    redisUrl: process.env.REDIS_URL || null,
  };
}
