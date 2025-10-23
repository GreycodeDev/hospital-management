const express = require('express');
const PatientController = require('../controllers/patient.controller.js');
const { authenticateToken, requireReception } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.use(authenticateToken);

router.get('/', PatientController.getAllPatients);
router.get('/search', PatientController.searchPatients);
router.get('/stats', PatientController.getPatientStats);
router.get('/:id', PatientController.getPatientById);
router.post('/', requireReception, PatientController.registerPatient);
router.put('/:id', requireReception, PatientController.updatePatient);

module.exports = router;