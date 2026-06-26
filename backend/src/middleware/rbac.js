const apiResponse = require('../utils/apiResponse');

/**
 * Role-based access control middleware factory.
 * @param {string[]} allowedRoles Array of roles allowed to access the route
 */
const rbac = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return apiResponse.unauthorized(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'super_admin') {
      return apiResponse.forbidden(res, 'Insufficient permissions to access this resource');
    }

    next();
  };
};

module.exports = rbac;
