const express = require('express');
const BedController = require('../controllers/bed.controller.js');
const { authenticateToken, requireNurse } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.use(authenticateToken);

router.get('/', BedController.getAllBeds);
router.get('/available', BedController.getAvailableBeds);
router.get('/stats', BedController.getBedStats);
router.get('/:id', BedController.getBedById);
router.post('/', requireNurse, BedController.createBed);
router.put('/:id', requireNurse, BedController.updateBed);

module.exports = router;