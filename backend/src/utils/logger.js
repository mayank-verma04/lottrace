const pino = require('pino');

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino/file',
          options: { destination: 1 }, // stdout
        }
      : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      '*.password',
      '*.passwordHash',
      '*.password_hash',
      '*.token',
      '*.refreshToken',
      '*.key_hash',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

module.exports = logger;
