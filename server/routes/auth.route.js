const express = require('express');
const AuthController = require('../controllers/auth.controller.js');
const { authenticateToken } = require('../middleware/auth.middleware.js');

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.put('/change-password', authenticateToken, AuthController.changePassword);
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;