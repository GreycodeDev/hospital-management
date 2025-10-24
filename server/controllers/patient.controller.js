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
        gender
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (gender) {
        whereClause.gender = gender;
      }
      
      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { patient_id: { [Op.like]: `%${search}%` } },
          { id_number: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: patients } = await db.Patient.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: db.PatientVisit,
            as: 'visits',
            limit: 1,
            order: [['visit_date', 'DESC']]
          }
        ]
      });

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
      console.error('Get all patients error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get patient by ID
  async getPatientById(req, res) {
    try {
      const { id } = req.params;

      const patient = await db.Patient.findByPk(id, {
        include: [
          {
            model: db.PatientVisit,
            as: 'visits',
            order: [['visit_date', 'DESC']]
          },
          {
            model: db.Admission,
            as: 'admissions',
            include: [
              {
                model: db.Bed,
                as: 'bed',
                include: [{ model: db.Ward, as: 'ward' }]
              }
            ],
            order: [['admission_date', 'DESC']]
          }
        ]
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.json({
        success: true,
        data: { patient }
      });

    } catch (error) {
      console.error('Get patient by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Search patients
  async searchPatients(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const patients = await db.Patient.findAll({
        where: {
          [Op.or]: [
            { first_name: { [Op.like]: `%${query}%` } },
            { last_name: { [Op.like]: `%${query}%` } },
            { patient_id: { [Op.like]: `%${query}%` } },
            { id_number: { [Op.like]: `%${query}%` } }
          ]
        },
        limit: 20
      });

      res.json({
        success: true,
        data: { patients }
      });

    } catch (error) {
      console.error('Search patients error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
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