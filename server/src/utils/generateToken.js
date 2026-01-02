/**
 * JWT Token Generator
 *
 * What is JWT?
 * - JSON Web Token - a secure way to transmit user identity
 * - Contains: Header (algorithm), Payload (user data), Signature
 * - Stateless: Server doesn't store sessions, token contains all info
 *
 * Flow:
 * 1. User logs in with email/password
 * 2. Server verifies credentials
 * 3. Server creates JWT with user ID
 * 4. Client stores token (localStorage)
 * 5. Client sends token with every request
 * 6. Server verifies token and knows who the user is
 */
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                    // Payload - what's inside the token
    process.env.JWT_SECRET,            // Secret key - used to sign/verify
    { expiresIn: process.env.JWT_EXPIRE || '7d' }  // Expiration
  );
};

module.exports = generateToken;
