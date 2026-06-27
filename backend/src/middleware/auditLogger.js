const { writeAuditLog } = require('../utils/auditTrail');

/**
 * Middleware to log actions to audit_log.
 * @param {string} actionPrefix - e.g. 'event', 'lot'
 */
const auditLogger = (actionPrefix) => {
  return async (req, res, next) => {
    // Intercept res.json to log after successful request
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            let specificAction = `${actionPrefix}.${req.method.toLowerCase()}`;
            if (req.path.includes('/void')) specificAction = `${actionPrefix}.void`;
            if (req.path.includes('/amend')) specificAction = `${actionPrefix}.amend`;
            if (req.path.includes('/deactivate')) specificAction = `${actionPrefix}.deactivate`;
            if (req.path.includes('/reactivate')) specificAction = `${actionPrefix}.reactivate`;
            
            await writeAuditLog({
              organizationId: req.organizationId,
              actorId: req.user?.id,
              actorType: 'user',
              action: specificAction,
              entityType: actionPrefix,
              entityId: req.params.id || req.params[`${actionPrefix}Id`] || body?.data?.id,
              metadata: { url: req.originalUrl, query: req.query, body: req.body },
              ipAddress: req.ip
            });
          } catch (err) {
            if (req.log && req.log.error) {
              req.log.error({ err }, 'Failed to write audit log from middleware');
            } else {
              console.error('Failed to write audit log from middleware:', err);
            }
          }
        });
      }
      originalJson.call(this, body);
    };
    next();
  };
};

module.exports = auditLogger;
