require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const pinoHttp = require('pino-http');

const logger = require('./utils/logger');
const apiResponse = require('./utils/apiResponse');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Global Middleware ─────────────────────────────────────
// Order matters: requestId → cors → helmet → compression → logging → body parsing

// 1. Request ID (tracing)
app.use(requestId);

// 2. CORS
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3001', process.env.SCAN_PWA_URL || 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  }),
);

// 3. Security headers
app.use(helmet());

// 4. Gzip compression
app.use(compression());

// 5. HTTP request logging
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
    },
  }),
);

// 6. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  return apiResponse.success(res, { status: 'healthy', uptime: process.uptime() }, 'Service is healthy');
});

// ─── API Routes ────────────────────────────────────────────
// Module routes will be mounted here as they are built:
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/organizations', require('./modules/organizations/organizations.routes'));
app.use('/api/v1/users', require('./modules/users/users.routes'));
app.use('/api/v1/locations', require('./modules/locations/locations.routes'));
app.use('/api/v1/products', require('./modules/products/products.routes'));

// ─── 404 Catch-All ─────────────────────────────────────────
app.use((_req, res) => {
  return apiResponse.notFound(res, 'Route not found');
});

// ─── Error Handler (must be last) ──────────────────────────
app.use(errorHandler);

module.exports = app;
