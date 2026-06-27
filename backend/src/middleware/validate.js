const { ZodError } = require('zod');
const apiResponse = require('../utils/apiResponse');

/**
 * Validates request data against Zod schemas.
 * Supports body, query, and params validation.
 *
 * @param {import('zod').ZodSchema | { body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schemaOrConfig
 */
const validate = (schemaOrConfig) => (req, res, next) => {
  try {
    // Support legacy usage: validate(schema) treats it as body schema
    if (typeof schemaOrConfig?.parse === 'function') {
      req.validatedBody = schemaOrConfig.parse(req.body);
      return next();
    }

    // Object form: { body, query, params }
    if (schemaOrConfig.body) {
      req.validatedBody = schemaOrConfig.body.parse(req.body);
    }
    if (schemaOrConfig.query) {
      req.validatedQuery = schemaOrConfig.query.parse(req.query);
    }
    if (schemaOrConfig.params) {
      req.validatedParams = schemaOrConfig.params.parse(req.params);
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
      return apiResponse.validationError(res, details);
    }
    next(err);
  }
};

module.exports = validate;

