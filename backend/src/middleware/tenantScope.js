const apiResponse = require('../utils/apiResponse');

/**
 * Tenant scope middleware.
 * Ensures the request is scoped to an organization (from the JWT).
 * Attaches req.organizationId for downstream use.
 */
const tenantScope = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    return apiResponse.unauthorized(res, 'Organization scope missing');
  }

  req.organizationId = req.user.organizationId;
  next();
};

module.exports = tenantScope;
