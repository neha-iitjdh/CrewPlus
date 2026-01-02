/**
 * Custom API Error
 *
 * Why extend Error?
 * - Can throw it like any error: throw new ApiError(404, 'Not found')
 * - Carries statusCode for proper HTTP response
 * - Can include validation errors array
 *
 * Usage:
 *   throw new ApiError(400, 'Email already exists');
 *   throw new ApiError(422, 'Validation failed', [{ field: 'email', message: 'Invalid' }]);
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
  }
}

module.exports = ApiError;
