const { v4: uuid } = require('uuid');

/**
 * Middleware: attach a unique request ID to every incoming request.
 * Sets `req.id` and the `X-Request-ID` response header.
 * Used for distributed tracing across logs.
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuid();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

module.exports = requestId;
