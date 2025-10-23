const express = require('express');
const UserController = require('../controllers/user.controller.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware.js');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

router.get('/', UserController.getAllUsers);
router.get('/stats', UserController.getUserStats);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;