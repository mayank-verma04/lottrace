const { ZodError } = require('zod');
const apiResponse = require('../utils/apiResponse');

/**
 * Validates the request body against a Zod schema.
 * Attaches the parsed payload to req.validatedBody.
 * 
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
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
