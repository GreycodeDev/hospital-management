const express = require('express');
const BillingController = require('../controllers/billing.controller.js');
const { authenticateToken, requireBilling } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', BillingController.getBillingStats);
router.get('/patient/:patient_id', BillingController.getPatientBillings);
router.post('/service', requireBilling, BillingController.addService);
router.post('/bed-charges', requireBilling, BillingController.addBedCharges);
router.post('/generate-bill', requireBilling, BillingController.generateFinalBill);
router.put('/:id/mark-paid', requireBilling, BillingController.markAsPaid);
router.put('/bill/:bill_id/pay', requireBilling, BillingController.processPayment);

module.exports = router;