const db = require('../models/index.js');
const { Op } = require('sequelize');

class PatientController {
   static generatePatientId() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `VCH${timestamp.slice(-6)}${random}`;
  }

  // Register new patient
 async registerPatient(req, res) {
    try {
      const {
        first_name,
        last_name,
        id_number,
        date_of_birth,
        gender,
        phone_number,
        address,
        next_of_kin_name,
        next_of_kin_phone,
        blood_type,
        allergies,
        emergency_contact
      } = req.body;

      // Validation
      if (!first_name || !last_name || !id_number || !date_of_birth || !gender) {
        return res.status(400).json({
          success: false,
          message: 'First name, last name, ID number, date of birth, and gender are required'
        });
      }

      // Check if patient already exists
      const existingPatient = await db.Patient.findOne({
        where: { id_number: id_number }
      });

      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: 'Patient with this ID number already exists'
        });
      }

      // Generate patient ID 
      const patientId = PatientController.generatePatientId();

      // Create patient
      const patient = await db.Patient.create({
        patient_id: patientId,
        first_name,
        last_name,
        id_number,
        date_of_birth,
        gender,
        phone_number,
        address,
        next_of_kin_name,
        next_of_kin_phone,
        blood_type,
        allergies,
        emergency_contact
      });

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: { patient }
      });

    } catch (error) {
      console.error('Register patient error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all patients with pagination and search
    async getAllPatients(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      gender,
      blood_type // Changed from blood_group
    } = req.query;

    console.log('📋 Get all patients request:', { search, gender, blood_type });

    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { patient_id: { [Op.like]: `%${search}%` } },
        { phone_number: { [Op.like]: `%${search}%` } },
        // Remove email from search since it doesn't exist
      ];
    }
    
    if (gender) {
      whereClause.gender = gender;
    }
    
    if (blood_type) { // Changed from blood_group
      whereClause.blood_type = blood_type; // Changed from blood_group
    }

    const { count, rows: patients } = await db.Patient.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      // Remove attributes to let Sequelize handle the column selection automatically
      // or specify only the columns that actually exist
      attributes: [
        'id', 
        'patient_id', 
        'first_name', 
        'last_name', 
        'date_of_birth', 
        'gender', 
        'phone_number', 
        // 'email', // REMOVE THIS - doesn't exist
        'blood_type', // Changed from blood_group
        'address',
        'next_of_kin_name', // Changed from emergency_contact_name
        'next_of_kin_phone', // Changed from emergency_contact_phone
        'allergies',
        'emergency_contact',
        'createdAt',
        'updatedAt'
      ]
    });

    console.log('✅ Found patients:', patients.length, 'of', count);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalPatients: count,
          patientsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('💥 Get all patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}



  // Get patient by ID
  async getPatientById(req, res) {
    try {
      const { id } = req.params;

      console.log('🔍 Get patient by ID:', id);

      const patient = await db.Patient.findByPk(id, {
        include: [
          {
            model: db.Admission,
            as: 'admissions',
            include: [
              {
                model: db.Bed,
                as: 'bed',
                include: [{ model: db.Ward, as: 'ward' }]
              }
            ]
          },
          {
            model: db.Billing,
            as: 'billings'
          },
          {
            model: db.Bill,
            as: 'bills'
          }
        ]
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      console.log('✅ Patient found:', patient.patient_id);

      res.json({
        success: true,
        data: { patient }
      });

    } catch (error) {
      console.error('💥 Get patient by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Search patients
  async searchPatients(req, res) {
  try {
    const { query, q, search } = req.query;
    const searchTerm = query || q || search;

    console.log('🔍 Patient search request:', searchTerm);

    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const patients = await db.Patient.findAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.like]: `%${searchTerm}%` } },
          { last_name: { [Op.like]: `%${searchTerm}%` } },
          { patient_id: { [Op.like]: `%${searchTerm}%` } },
          { phone_number: { [Op.like]: `%${searchTerm}%` } },
          // Remove email from search since it doesn't exist
        ]
      },
      // Remove attributes to let Sequelize handle the column selection automatically
      // or specify only the columns that actually exist
      attributes: [
        'id', 
        'patient_id', 
        'first_name', 
        'last_name', 
        'date_of_birth', 
        'gender', 
        'phone_number', 
        // 'email', // REMOVE THIS - doesn't exist
        'blood_type', // Changed from blood_group
        'address',
        'next_of_kin_name', // Changed from emergency_contact_name
        'next_of_kin_phone', // Changed from emergency_contact_phone
        'allergies',
        'emergency_contact'
      ],
      limit: 20,
      order: [['first_name', 'ASC']]
    });

    console.log('✅ Found patients:', patients.length);

    res.json({
      success: true,
      data: { 
        patients,
        count: patients.length
      }
    });

  } catch (error) {
    console.error('💥 Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

  // Update patient
  async updatePatient(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const patient = await db.Patient.findByPk(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Check if ID number is being updated and if it already exists
      if (updateData.id_number && updateData.id_number !== patient.id_number) {
        const existingPatient = await db.Patient.findOne({
          where: { id_number: updateData.id_number }
        });

        if (existingPatient) {
          return res.status(400).json({
            success: false,
            message: 'Another patient with this ID number already exists'
          });
        }
      }

      await patient.update(updateData);

      const updatedPatient = await db.Patient.findByPk(id);

      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: { patient: updatedPatient }
      });

    } catch (error) {
      console.error('Update patient error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get patient statistics
  async getPatientStats(req, res) {
    try {
      const totalPatients = await db.Patient.count();
      const patientsByGender = await db.Patient.findAll({
        attributes: [
          'gender',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['gender']
      });

      const genderStats = {};
      patientsByGender.forEach(stat => {
        genderStats[stat.gender] = parseInt(stat.get('count'));
      });

      // Count patients with active admissions
      const activeAdmissions = await db.Admission.count({
        where: { status: 'Admitted' }
      });

      res.json({
        success: true,
        data: {
          totalPatients,
          activeAdmissions,
          patientsByGender: genderStats
        }
      });

    } catch (error) {
      console.error('Get patient stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new PatientController();