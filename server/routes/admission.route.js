const express = require('express');
const AdmissionController = require('../controllers/admission.controller.js');
const { authenticateToken, requireDoctor } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.use(authenticateToken);

router.get('/', AdmissionController.getAllAdmissions);
router.get('/current', AdmissionController.getCurrentAdmissions);
router.get('/stats', AdmissionController.getAdmissionStats);
router.get('/:id', AdmissionController.getAdmissionById);
router.post('/', requireDoctor, AdmissionController.admitPatient);
router.put('/:id/discharge', requireDoctor, AdmissionController.dischargePatient);

module.exports = router;