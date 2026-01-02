/**
 * Standardized API Response
 *
 * Why use this?
 * - Frontend always knows what to expect
 * - Easy to add metadata later (pagination, etc.)
 * - Consistent format across all endpoints
 *
 * Usage:
 *   res.status(200).json(new ApiResponse(200, userData, 'User fetched'));
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;
