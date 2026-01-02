/**
 * Async Handler Wrapper
 *
 * The Problem:
 * Without this, every async route needs try-catch:
 *
 *   app.get('/users', async (req, res, next) => {
 *     try {
 *       const users = await User.find();
 *       res.json(users);
 *     } catch (error) {
 *       next(error);  // Must remember this!
 *     }
 *   });
 *
 * With asyncHandler:
 *
 *   app.get('/users', asyncHandler(async (req, res) => {
 *     const users = await User.find();
 *     res.json(users);
 *     // Errors automatically passed to error middleware!
 *   }));
 *
 * How it works:
 * - Wraps the function in a Promise
 * - If rejected, calls next(error) automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
