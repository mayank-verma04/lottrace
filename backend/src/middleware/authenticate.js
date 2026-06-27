const jwt = require('jsonwebtoken');
const env = require('../config/env');
const apiResponse = require('../utils/apiResponse');
const redis = require('../config/redis');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiResponse.unauthorized(res, 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const isBlacklisted = await redis.get(`bl_${token}`);
    if (isBlacklisted) {
      return apiResponse.unauthorized(res, 'Token has been revoked');
    }

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
