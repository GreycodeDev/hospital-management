const express = require('express');
const ServiceController = require('../controllers/service.controller.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.use(authenticateToken);

router.get('/', ServiceController.getAllServices);
router.get('/stats', ServiceController.getServiceStats);
router.get('/type/:service_type', ServiceController.getServicesByType);
router.get('/:id', ServiceController.getServiceById);
router.post('/', requireAdmin, ServiceController.createService);
router.put('/:id', requireAdmin, ServiceController.updateService);
router.delete('/:id', requireAdmin, ServiceController.deleteService);

module.exports = router;