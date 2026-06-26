const jwt = require('jsonwebtoken');
const env = require('../config/env');
const apiResponse = require('../utils/apiResponse');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiResponse.unauthorized(res, 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.ACCESS_JWT_SECRET);
    req.user = {
      id: decoded.sub,
      organizationId: decoded.orgId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return apiResponse.unauthorized(res, 'Token is invalid or expired');
  }
};

module.exports = authenticate;
