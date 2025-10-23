const db = require('../models/index.js');
const { Op } = require('sequelize');

class BillingController {
  // Generate bill number
  generateBillNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BILL${timestamp.slice(-6)}${random}`;
  }

  // Add service to billing
  async addService(req, res) {
    try {
      const {
        patient_id,
        admission_id,
        service_id,
        service_type,
        description,
        quantity,
        unit_price,
        notes
      } = req.body;

      // Validation
      if (!patient_id || !service_type || !description || !unit_price) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID, service type, description, and unit price are required'
        });
      }

      // Check if patient exists
      const patient = await db.Patient.findByPk(patient_id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Check if admission exists if provided
      if (admission_id) {
        const admission = await db.Admission.findByPk(admission_id);
        if (!admission) {
          return res.status(404).json({
            success: false,
            message: 'Admission not found'
          });
        }
      }

      const billing = await db.Billing.create({
        patient_id,
        admission_id,
        service_id,
        service_type,
        description,
        quantity: quantity || 1,
        unit_price,
        notes,
        added_by: req.user.userId
      });

      const newBilling = await db.Billing.findByPk(billing.id, {
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Admission,
            as: 'admission'
          },
          {
            model: db.Service,
            as: 'service'
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Service added to billing successfully',
        data: { billing: newBilling }
      });

    } catch (error) {
      console.error('Add service error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add bed charges for admission
  async addBedCharges(req, res) {
    try {
      const { admission_id, days, daily_rate } = req.body;

      // Validation
      if (!admission_id || !days || !daily_rate) {
        return res.status(400).json({
          success: false,
          message: 'Admission ID, days, and daily rate are required'
        });
      }

      const admission = await db.Admission.findByPk(admission_id, {
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Bed,
            as: 'bed'
          }
        ]
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      const totalAmount = days * daily_rate;

      const billing = await db.Billing.create({
        patient_id: admission.patient_id,
        admission_id: admission.id,
        service_type: 'Bed',
        description: `Bed charges for ${days} day(s)`,
        quantity: days,
        unit_price: daily_rate,
        total_amount: totalAmount,
        added_by: req.user.userId
      });

      res.status(201).json({
        success: true,
        message: 'Bed charges added successfully',
        data: { billing }
      });

    } catch (error) {
      console.error('Add bed charges error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get billings for patient
  async getPatientBillings(req, res) {
    try {
      const { patient_id } = req.params;
      const { admission_id, is_paid } = req.query;

      const whereClause = { patient_id: patient_id };

      if (admission_id) {
        whereClause.admission_id = admission_id;
      }

      if (is_paid !== undefined) {
        whereClause.is_paid = is_paid === 'true';
      }

      const billings = await db.Billing.findAll({
        where: whereClause,
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Admission,
            as: 'admission'
          },
          {
            model: db.Service,
            as: 'service'
          }
        ],
        order: [['service_date', 'DESC']]
      });

      // Calculate totals
      const totalAmount = billings.reduce((sum, billing) => sum + parseFloat(billing.total_amount), 0);
      const paidAmount = billings
        .filter(billing => billing.is_paid)
        .reduce((sum, billing) => sum + parseFloat(billing.total_amount), 0);
      const pendingAmount = totalAmount - paidAmount;

      res.json({
        success: true,
        data: {
          billings,
          summary: {
            totalAmount,
            paidAmount,
            pendingAmount,
            totalItems: billings.length
          }
        }
      });

    } catch (error) {
      console.error('Get patient billings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Generate final bill
  async generateFinalBill(req, res) {
    try {
      const { admission_id } = req.body;

      if (!admission_id) {
        return res.status(400).json({
          success: false,
          message: 'Admission ID is required'
        });
      }

      const admission = await db.Admission.findByPk(admission_id, {
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Billing,
            as: 'billings'
          }
        ]
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      if (admission.status !== 'Discharged') {
        return res.status(400).json({
          success: false,
          message: 'Patient must be discharged before generating final bill'
        });
      }

      // Calculate total amount from billings
      const totalAmount = admission.billings.reduce((sum, billing) => {
        return sum + parseFloat(billing.total_amount);
      }, 0);

      // Check if bill already exists
      const existingBill = await db.Bill.findOne({
        where: { admission_id: admission_id }
      });

      if (existingBill) {
        return res.status(400).json({
          success: false,
          message: 'Final bill already exists for this admission'
        });
      }

      const bill = await db.Bill.create({
        bill_number: this.generateBillNumber(),
        patient_id: admission.patient_id,
        admission_id: admission.id,
        total_amount: totalAmount,
        balance: totalAmount,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });

      const newBill = await db.Bill.findByPk(bill.id, {
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Admission,
            as: 'admission'
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Final bill generated successfully',
        data: { bill: newBill }
      });

    } catch (error) {
      console.error('Generate final bill error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Mark billing as paid
  async markAsPaid(req, res) {
    try {
      const { id } = req.params;
      const { amount_paid, payment_method, insurance_claim_number } = req.body;

      const billing = await db.Billing.findByPk(id);

      if (!billing) {
        return res.status(404).json({
          success: false,
          message: 'Billing record not found'
        });
      }

      if (billing.is_paid) {
        return res.status(400).json({
          success: false,
          message: 'Billing is already marked as paid'
        });
      }

      await billing.update({
        is_paid: true
      });

      res.json({
        success: true,
        message: 'Billing marked as paid successfully'
      });

    } catch (error) {
      console.error('Mark as paid error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Process payment for final bill
  async processPayment(req, res) {
    try {
      const { bill_id } = req.params;
      const { amount_paid, payment_method, insurance_claim_number } = req.body;

      const bill = await db.Bill.findByPk(bill_id, {
        include: [
          {
            model: db.Patient,
            as: 'patient'
          }
        ]
      });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Bill not found'
        });
      }

      if (bill.payment_status === 'Paid') {
        return res.status(400).json({
          success: false,
          message: 'Bill is already fully paid'
        });
      }

      const newAmountPaid = parseFloat(bill.amount_paid) + parseFloat(amount_paid);
      const balance = parseFloat(bill.total_amount) - newAmountPaid;

      await bill.update({
        amount_paid: newAmountPaid,
        balance: balance,
        payment_method: payment_method,
        insurance_claim_number: insurance_claim_number,
        payment_date: new Date()
      });

      // Mark all related billings as paid
      if (balance <= 0) {
        await db.Billing.update(
          { is_paid: true },
          { where: { admission_id: bill.admission_id } }
        );
      }

      const updatedBill = await db.Bill.findByPk(bill_id, {
        include: [
          {
            model: db.Patient,
            as: 'patient'
          }
        ]
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: { bill: updatedBill }
      });

    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get billing statistics
  async getBillingStats(req, res) {
    try {
      const totalRevenue = await db.Billing.sum('total_amount', {
        where: { is_paid: true }
      });

      const pendingRevenue = await db.Billing.sum('total_amount', {
        where: { is_paid: false }
      });

      const totalBills = await db.Bill.count();
      const paidBills = await db.Bill.count({ where: { payment_status: 'Paid' } });
      const pendingBills = await db.Bill.count({ where: { payment_status: 'Pending' } });

      // Revenue by service type
      const revenueByService = await db.Billing.findAll({
        attributes: [
          'service_type',
          [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'revenue']
        ],
        where: { is_paid: true },
        group: ['service_type']
      });

      const serviceRevenue = {};
      revenueByService.forEach(item => {
        serviceRevenue[item.service_type] = parseFloat(item.get('revenue') || 0);
      });

      res.json({
        success: true,
        data: {
          totalRevenue: parseFloat(totalRevenue || 0),
          pendingRevenue: parseFloat(pendingRevenue || 0),
          totalBills,
          paidBills,
          pendingBills,
          revenueByService: serviceRevenue
        }
      });

    } catch (error) {
      console.error('Get billing stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new BillingController();