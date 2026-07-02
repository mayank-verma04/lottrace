const db = require('../db/knex');

const idempotency = async (req, res, next) => {
  const key = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  
  if (!key) {
    return next();
  }

  const organizationId = req.organizationId;
  if (!organizationId) {
    // Should be applied after tenantScope middleware
    return next();
  }

  try {
    const existing = await db('idempotency_keys')
      .where({ key, organization_id: organizationId })
      .first();

    if (existing) {
      return res.status(existing.response_status).json(existing.response_body);
    }

    // Intercept res.json to save the response
    const originalJson = res.json;
    res.json = function (body) {
      res.json = originalJson;

      // Only cache successful or client-error responses (2xx, 4xx).
      // We don't cache 500s because we want the client to retry.
      if (res.statusCode < 500) {
        db('idempotency_keys').insert({
          key,
          organization_id: organizationId,
          response_status: res.statusCode,
          response_body: typeof body === 'string' ? body : JSON.stringify(body),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }).catch(err => {
          console.error('[Idempotency] Failed to save key:', err.message);
        });
      }

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = idempotency;
