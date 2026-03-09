const jwt = require('jsonwebtoken');

// Validate JWT secret exists
if (!process.env.JWT_SECRET) {
  throw new Error('❌ CRITICAL: JWT_SECRET environment variable is not set. Cannot generate tokens.');
}

// Generate JWT token
const generateToken = (user) => {
  try {
    return jwt.sign(
      { 
        userId: user._id,
        company: user.company
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'bar-restaurant-system',
        audience: 'bar-restaurant-users'
      }
    );
  } catch (error) {
    console.error('Error generating token:', error.message);
    throw new Error('Failed to generate authentication token: ' + error.message);
  }
};

// Generate refresh token (longer expiry)
const generateRefreshToken = (user) => {
  try {
    return jwt.sign(
      { 
        userId: user._id, 
        company: user.company,
        type: 'refresh' 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '7d',
        issuer: 'bar-restaurant-system',
        audience: 'bar-restaurant-users'
      }
    );
  } catch (error) {
    console.error('Error generating refresh token:', error.message);
    throw new Error('Failed to generate refresh token: ' + error.message);
  }
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
};

