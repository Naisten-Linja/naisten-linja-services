import url from 'url';

export function checkVariables() {
  [
    'ENVIRONMENT',
    'PORT',
    'DISCOURSE_URL',
    'BACKEND_URL',
    'FRONTEND_URL',
    'DISCOURSE_SSO_SECRET',
    'COOKIE_SECRET',
    'JWT_PUBLIC_KEY',
    'JWT_PRIVATE_KEY',
  ].forEach((key) => {
    if (!(key in process.env)) {
      throw `Missing variable ${key} from your environment`;
    }
  });
}

export function getConfig() {
  checkVariables();

  const backendUrl = process.env.BACKEND_URL!;
  const { hostname } = url.parse(backendUrl);

  if (hostname === null) {
    throw `BACKEND_URL has hostname = null!`;
  }
  return {
    discourseUrl: process.env.DISCOURSE_URL!,
    discourseSsoSecret: process.env.DISCOURSE_SSO_SECRET!,
    port: parseInt(process.env.PORT!, 10),
    backendUrl: process.env.BACKEND_URL!,
    cookieSecret: process.env.COOKIE_SECRET!,
    environment: process.env.ENVIRONMENT!,
    hostName: hostname,
    jwtPublicKey: process.env.JWT_PUBLIC_KEY!,
    jwtPrivateKey: process.env.JWT_PRIVATE_KEY!,
  };
}
