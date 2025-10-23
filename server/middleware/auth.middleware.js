const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'hospital_secret_key'
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Specific role middlewares
const requireAdmin = requireRole(['admin']);
const requireDoctor = requireRole(['admin', 'doctor']);
const requireNurse = requireRole(['admin', 'doctor', 'nurse']);
const requireBilling = requireRole(['admin', 'billing_clerk']);
const requireReception = requireRole(['admin', 'receptionist']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireDoctor,
  requireNurse,
  requireBilling,
  requireReception
};