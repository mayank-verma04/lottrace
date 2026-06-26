/**
 * Operational error class for expected application errors.
 * Throw this in service code — caught by errorHandler middleware.
 *
 * @example
 *   throw new AppError('Lot not found', 'NOT_FOUND', 404);
 *   throw new AppError('Lot is voided', 'LOT_VOIDED', 409);
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable message
   * @param {string} code - Machine-readable error code (e.g. 'NOT_FOUND', 'LOT_VOIDED')
   * @param {number} statusCode - HTTP status code
   * @param {Array|null} details - Optional validation-style detail array
   */
  constructor(message, code, statusCode, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
