const db = require('../models/index.js');
const { Op } = require('sequelize');

class BillingController {
  // Generate bill number
  generateBillNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BILL${timestamp.slice(-6)}${random}`;
  }

  // Get all bills with filtering
  async getAllBills(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause for bills
      const whereClause = {};
      
      if (status && status !== 'all') {
        if (status === 'paid') {
          whereClause.balance = 0;
        } else if (status === 'pending') {
          whereClause.balance = { [Op.gt]: 0 };
        }
      }

      // Build patient search condition
      const patientWhere = {};
      if (search) {
        patientWhere[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { patient_id: { [Op.like]: `%${search}%` } }
        ];
      }

      const include = [
        {
          model: db.Patient,
          as: 'patient',
          where: search ? patientWhere : undefined,
          required: !!search
        },
        {
          model: db.Admission,
          as: 'admission'
        }
      ];

      const { count, rows: bills } = await db.Bill.findAndCountAll({
        where: whereClause,
        include: include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']] // FIXED: changed 'created_at' to 'createdAt'
      });

      res.json({
        success: true,
        data: {
          bills,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            total: count,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all bills error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add service to billing
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

    console.log('📝 Add service request:', {
      patient_id,
      admission_id,
      service_type,
      description
    });

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

    // If no admission_id provided, try to find current admission
    let admissionIdToUse = admission_id;
    if (!admissionIdToUse) {
      console.log('🔍 No admission_id provided, searching for current admission...');
      const currentAdmission = await db.Admission.findOne({
        where: { 
          patient_id: patient_id,
          status: 'Admitted'
        },
        order: [['admission_date', 'DESC']]
      });
      
      if (currentAdmission) {
        admissionIdToUse = currentAdmission.id;
        console.log('✅ Found current admission:', admissionIdToUse);
      } else {
        console.log('ℹ️ No current admission found, service will be saved without admission_id');
      }
    }

    // Calculate total amount
    const calculatedQuantity = quantity || 1;
    const totalAmount = parseFloat(unit_price) * calculatedQuantity;

    console.log('💾 Creating billing record with:', {
      patient_id,
      admission_id: admissionIdToUse,
      service_type,
      totalAmount
    });

    const billing = await db.Billing.create({
      patient_id,
      admission_id: admissionIdToUse, // Use the found admission_id or null
      service_id: service_id || null,
      service_type: service_type,
      description,
      quantity: calculatedQuantity,
      unit_price: parseFloat(unit_price),
      total_amount: totalAmount,
      notes: notes || null,
      added_by: req.user.userId
    });

    const newBilling = await db.Billing.findByPk(billing.id, {
      include: [
        {
          model: db.Patient,
          as: 'patient',
          attributes: ['id', 'first_name', 'last_name', 'patient_id']
        },
        {
          model: db.Admission,
          as: 'admission',
          attributes: ['id', 'admission_date', 'status']
        }
      ]
    });

    console.log('✅ Service added successfully:', newBilling.id);

    res.status(201).json({
      success: true,
      message: 'Service added to billing successfully',
      data: { billing: newBilling }
    });

  } catch (error) {
    console.error('💥 Add service error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
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
        service_type: 'room_charges',
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

      // Get individual billings
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
          }
        ],
        order: [['createdAt', 'DESC']] // FIXED: changed 'created_at' to 'createdAt'
      });

      // Get final bills
      const finalBills = await db.Bill.findAll({
        where: { patient_id: patient_id },
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Admission,
            as: 'admission'
          }
        ],
        order: [['createdAt', 'DESC']] // FIXED: changed 'created_at' to 'createdAt'
      });

      // Combine both types of bills
      const allBills = [
        ...billings.map(b => ({ ...b.toJSON(), type: 'billing' })),
        ...finalBills.map(b => ({ ...b.toJSON(), type: 'final_bill' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        success: true,
        data: {
          billings: allBills
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
  // In your billing.controller.js - Replace the generateFinalBill method

  // Generate final bill
async generateFinalBill(req, res) {
  try {
    const { admission_id, patient_id } = req.body; // Also accept patient_id

    console.log('🎫 Generate final bill request:', { admission_id, patient_id });

    let admission;
    
    if (admission_id) {
      // Use provided admission_id
      admission = await db.Admission.findByPk(admission_id, {
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
    } else if (patient_id) {
      // Find the most recent admission for the patient
      admission = await db.Admission.findOne({
        where: { patient_id: patient_id },
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Billing,
            as: 'billings'
          }
        ],
        order: [['admission_date', 'DESC']]
      });
      
      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'No admission found for this patient'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either admission_id or patient_id is required'
      });
    }

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }

    // Get ALL billings for this patient (not just those linked to admission)
    const allPatientBillings = await db.Billing.findAll({
      where: { 
        patient_id: admission.patient_id,
        is_paid: false // Only include unpaid billings
      }
    });

    console.log('📊 Billings found:', {
      admissionBillings: admission.billings?.length || 0,
      allPatientBillings: allPatientBillings.length
    });

    // Calculate total amount from all unpaid billings
    const totalAmount = allPatientBillings.reduce((sum, billing) => {
      return sum + parseFloat(billing.total_amount);
    }, 0);

    // Check if bill already exists
    const existingBill = await db.Bill.findOne({
      where: { patient_id: admission.patient_id, balance: { [Op.gt]: 0 } }
    });

    if (existingBill) {
      return res.status(400).json({
        success: false,
        message: 'Active bill already exists for this patient'
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

    console.log('✅ Final bill generated:', newBill.bill_number);

    res.status(201).json({
      success: true,
      message: 'Final bill generated successfully',
      data: { 
        bill: newBill,
        billings: allPatientBillings // Return the billings that were included
      }
    });

  } catch (error) {
    console.error('💥 Generate final bill error:', error);
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

      if (bill.balance <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Bill is already fully paid'
        });
      }

      const paymentAmount = parseFloat(amount_paid);
      if (paymentAmount > bill.balance) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount exceeds bill balance'
        });
      }

      const newBalance = parseFloat(bill.balance) - paymentAmount;
      const newAmountPaid = parseFloat(bill.amount_paid || 0) + paymentAmount;

      await bill.update({
        amount_paid: newAmountPaid,
        balance: newBalance,
        payment_method: payment_method,
        insurance_claim_number: insurance_claim_number,
        payment_date: new Date(),
        payment_status: newBalance === 0 ? 'Paid' : 'Partial'
      });

      // Mark all related billings as paid if bill is fully paid
      if (newBalance === 0) {
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
      const paidBills = await db.Bill.count({ where: { balance: 0 } });
      const pendingBills = await db.Bill.count({ where: { balance: { [Op.gt]: 0 } } });

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