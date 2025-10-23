const db = require('../models/index.js');
const { Op } = require('sequelize');

class AdmissionController {
  // Admit patient
  async admitPatient(req, res) {
    try {
      const {
        patient_id,
        bed_id,
        visit_id,
        expected_stay_days,
        reason_for_admission,
        attending_physician,
        insurance_info
      } = req.body;

      // Validation
      if (!patient_id || !bed_id) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID and bed ID are required'
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

      // Check if bed exists and is available
      const bed = await db.Bed.findByPk(bed_id, {
        include: [{ model: db.Ward, as: 'ward' }]
      });

      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }

      if (bed.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: 'Bed is not available'
        });
      }

      // Check if patient already has an active admission
      const activeAdmission = await db.Admission.findOne({
        where: {
          patient_id: patient_id,
          status: 'Admitted'
        }
      });

      if (activeAdmission) {
        return res.status(400).json({
          success: false,
          message: 'Patient is already admitted'
        });
      }

      // Check gender compatibility
      if (bed.ward.gender_specific !== 'Mixed' && 
          bed.ward.gender_specific !== patient.gender) {
        return res.status(400).json({
          success: false,
          message: `This ward is for ${bed.ward.gender_specific} patients only`
        });
      }

      // Start transaction
      const transaction = await db.sequelize.transaction();

      try {
        // Create admission
        const admission = await db.Admission.create({
          patient_id,
          bed_id,
          visit_id,
          expected_stay_days,
          reason_for_admission,
          attending_physician,
          insurance_info
        }, { transaction });

        // Update bed status
        await bed.update({ status: 'Occupied' }, { transaction });

        // Update patient visit if provided
        if (visit_id) {
          await db.PatientVisit.update(
            { admission_recommended: true, status: 'admitted' },
            { where: { id: visit_id }, transaction }
          );
        }

        await transaction.commit();

        const newAdmission = await db.Admission.findByPk(admission.id, {
          include: [
            {
              model: db.Patient,
              as: 'patient'
            },
            {
              model: db.Bed,
              as: 'bed',
              include: [{ model: db.Ward, as: 'ward' }]
            }
          ]
        });

        res.status(201).json({
          success: true,
          message: 'Patient admitted successfully',
          data: { admission: newAdmission }
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Admit patient error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Discharge patient
  async dischargePatient(req, res) {
    try {
      const { id } = req.params;
      const { discharge_notes } = req.body;

      const admission = await db.Admission.findByPk(id, {
        include: [
          {
            model: db.Bed,
            as: 'bed'
          },
          {
            model: db.Patient,
            as: 'patient'
          }
        ]
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission record not found'
        });
      }

      if (admission.status === 'Discharged') {
        return res.status(400).json({
          success: false,
          message: 'Patient is already discharged'
        });
      }

      // Start transaction
      const transaction = await db.sequelize.transaction();

      try {
        // Update admission
        await admission.update({
          status: 'Discharged',
          discharge_date: new Date()
        }, { transaction });

        // Update bed status
        await admission.bed.update({ status: 'Available' }, { transaction });

        await transaction.commit();

        const updatedAdmission = await db.Admission.findByPk(id, {
          include: [
            {
              model: db.Patient,
              as: 'patient'
            },
            {
              model: db.Bed,
              as: 'bed',
              include: [{ model: db.Ward, as: 'ward' }]
            }
          ]
        });

        res.json({
          success: true,
          message: 'Patient discharged successfully',
          data: { admission: updatedAdmission }
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Discharge patient error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all admissions
  async getAllAdmissions(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        patient_id,
        ward_id
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (patient_id) {
        whereClause.patient_id = patient_id;
      }

      const include = [
        {
          model: db.Patient,
          as: 'patient'
        },
        {
          model: db.Bed,
          as: 'bed',
          include: [
            {
              model: db.Ward,
              as: 'ward'
            }
          ]
        }
      ];

      // Filter by ward if provided
      if (ward_id) {
        include[1].where = { ward_id: ward_id };
      }

      const { count, rows: admissions } = await db.Admission.findAndCountAll({
        where: whereClause,
        include: include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['admission_date', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          admissions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalAdmissions: count,
            admissionsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get admission by ID
  async getAdmissionById(req, res) {
    try {
      const { id } = req.params;

      const admission = await db.Admission.findByPk(id, {
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Bed,
            as: 'bed',
            include: [{ model: db.Ward, as: 'ward' }]
          },
          {
            model: db.PatientVisit,
            as: 'visit'
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

      res.json({
        success: true,
        data: { admission }
      });

    } catch (error) {
      console.error('Get admission by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current admissions (active)
  async getCurrentAdmissions(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: admissions } = await db.Admission.findAndCountAll({
        where: { status: 'Admitted' },
        include: [
          {
            model: db.Patient,
            as: 'patient'
          },
          {
            model: db.Bed,
            as: 'bed',
            include: [{ model: db.Ward, as: 'ward' }]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['admission_date', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          admissions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalAdmissions: count,
            admissionsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get current admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get admission statistics
  async getAdmissionStats(req, res) {
    try {
      const totalAdmissions = await db.Admission.count();
      const currentAdmissions = await db.Admission.count({ where: { status: 'Admitted' } });
      const dischargedAdmissions = await db.Admission.count({ where: { status: 'Discharged' } });

      // Average length of stay
      const avgStayResult = await db.Admission.findOne({
        where: {
          status: 'Discharged',
          discharge_date: { [Op.ne]: null }
        },
        attributes: [
          [db.sequelize.fn('AVG', 
            db.sequelize.fn('DATEDIFF', 
              db.sequelize.col('discharge_date'), 
              db.sequelize.col('admission_date')
            )
          ), 'avgStay']
        ]
      });

      const avgStay = avgStayResult ? parseFloat(avgStayResult.get('avgStay') || 0).toFixed(2) : 0;

      res.json({
        success: true,
        data: {
          totalAdmissions,
          currentAdmissions,
          dischargedAdmissions,
          averageLengthOfStay: avgStay
        }
      });

    } catch (error) {
      console.error('Get admission stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AdmissionController();