/**
 * Standard API response helpers.
 * ALL controllers must use these — never res.json() directly.
 * See docs/API_STANDARDS.md for the response envelope format.
 */
const apiResponse = {
  /**
   * Success response (200)
   */
  success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  },

  /**
   * Created response (201)
   */
  created(res, data, message = 'Created successfully') {
    return res.status(201).json({ success: true, message, data });
  },

  /**
   * Paginated list response (200)
   */
  paginated(res, data, pagination, message = 'Fetched successfully') {
    return res.status(200).json({ success: true, message, data, pagination });
  },

  /**
   * No content response (204)
   */
  noContent(res) {
    return res.status(204).send();
  },

  /**
   * Generic error response
   */
  error(res, message, code, statusCode = 500, details = null) {
    const body = { success: false, message, error: { code } };
    if (details) body.error.details = details;
    return res.status(statusCode).json(body);
  },

  /**
   * Not found (404) — also used for cross-tenant access denial
   */
  notFound(res, message = 'Resource not found') {
    return res.status(404).json({ success: false, message, error: { code: 'NOT_FOUND' } });
  },

  /**
   * Validation error (422)
   */
  validationError(res, details) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      error: { code: 'VALIDATION_ERROR', details },
    });
  },

  /**
   * Unauthorized (401)
   */
  unauthorized(res, code = 'AUTH_REQUIRED', message = 'Authentication required') {
    return res.status(401).json({ success: false, message, error: { code } });
  },

  /**
   * Forbidden (403)
   */
  forbidden(res, message = 'Insufficient permissions') {
    return res.status(403).json({ success: false, message, error: { code: 'AUTH_FORBIDDEN' } });
  },
};

module.exports = apiResponse;
