const db = require('../models/index.js');
const { Op } = require('sequelize');

class BedController {
  // Get all beds with filters
  async getAllBeds(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        ward_id,
        bed_type,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (ward_id) {
        whereClause.ward_id = ward_id;
      }
      
      if (bed_type) {
        whereClause.bed_type = bed_type;
      }

      // Add search functionality for bed number
      if (search) {
        whereClause.bed_number = {
          [Op.like]: `%${search}%`
        };
      }

      const { count, rows: beds } = await db.Bed.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.Ward,
            as: 'ward'
          },
          {
            model: db.Admission,
            as: 'admissions',
            where: { status: 'Admitted' },
            required: false,
            include: [
              {
                model: db.Patient,
                as: 'patient',
                attributes: ['id', 'first_name', 'last_name']
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['bed_number', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          beds,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalBeds: count,
            bedsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all beds error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get available beds with filtering
  async getAvailableBeds(req, res) {
    try {
      const { ward_type, gender, bed_type } = req.query;

      // Build where clause for beds
      const bedWhereClause = {
        status: 'Available'
      };

      if (bed_type) {
        bedWhereClause.bed_type = bed_type;
      }

      // Build where clause for wards
      const wardWhereClause = {};
      if (ward_type) {
        wardWhereClause.ward_type = ward_type;
      }
      if (gender && gender !== 'Mixed') {
        wardWhereClause.gender_specific = gender;
      }

      const availableBeds = await db.Bed.findAll({
        where: bedWhereClause,
        include: [
          {
            model: db.Ward,
            as: 'ward',
            where: wardWhereClause,
            attributes: ['id', 'ward_name', 'ward_type', 'gender_specific']
          }
        ],
        order: [
          ['ward_id', 'ASC'],
          ['bed_number', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: { availableBeds }
      });

    } catch (error) {
      console.error('Get available beds error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get bed by ID
  async getBedById(req, res) {
    try {
      const { id } = req.params;

      const bed = await db.Bed.findByPk(id, {
        include: [
          {
            model: db.Ward,
            as: 'ward'
          },
          {
            model: db.Admission,
            as: 'admissions',
            include: [
              {
                model: db.Patient,
                as: 'patient',
                attributes: ['id', 'first_name', 'last_name', 'patient_id']
              }
            ],
            order: [['admission_date', 'DESC']]
          }
        ]
      });

      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }

      res.json({
        success: true,
        data: { bed }
      });

    } catch (error) {
      console.error('Get bed by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new bed
  async createBed(req, res) {
    try {
      const {
        bed_number,
        ward_id,
        daily_rate,
        bed_type,
        status = 'Available'
      } = req.body;

      // Validation
      if (!bed_number || !ward_id) {
        return res.status(400).json({
          success: false,
          message: 'Bed number and ward ID are required'
        });
      }

      // Check if bed number already exists
      const existingBed = await db.Bed.findOne({
        where: { bed_number: bed_number }
      });

      if (existingBed) {
        return res.status(400).json({
          success: false,
          message: 'Bed with this number already exists'
        });
      }

      // Check if ward exists
      const ward = await db.Ward.findByPk(ward_id);
      if (!ward) {
        return res.status(404).json({
          success: false,
          message: 'Ward not found'
        });
      }

      const bed = await db.Bed.create({
        bed_number,
        ward_id,
        daily_rate: daily_rate || 100.00,
        bed_type: bed_type || 'Standard',
        status: status
      });

      const newBed = await db.Bed.findByPk(bed.id, {
        include: [{ model: db.Ward, as: 'ward' }]
      });

      res.status(201).json({
        success: true,
        message: 'Bed created successfully',
        data: { bed: newBed }
      });

    } catch (error) {
      console.error('Create bed error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update bed
  async updateBed(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const bed = await db.Bed.findByPk(id);

      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }

      // Check if bed number is being updated and if it already exists
      if (updateData.bed_number && updateData.bed_number !== bed.bed_number) {
        const existingBed = await db.Bed.findOne({
          where: { bed_number: updateData.bed_number }
        });

        if (existingBed) {
          return res.status(400).json({
            success: false,
            message: 'Another bed with this number already exists'
          });
        }
      }

      await bed.update(updateData);

      const updatedBed = await db.Bed.findByPk(id, {
        include: [{ model: db.Ward, as: 'ward' }]
      });

      res.json({
        success: true,
        message: 'Bed updated successfully',
        data: { bed: updatedBed }
      });

    } catch (error) {
      console.error('Update bed error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get bed statistics - FIXED PROPERTY NAMES
  async getBedStats(req, res) {
    try {
      const totalBeds = await db.Bed.count();
      const availableBeds = await db.Bed.count({ where: { status: 'Available' } });
      const occupiedBeds = await db.Bed.count({ where: { status: 'Occupied' } });
      const maintenanceBeds = await db.Bed.count({ where: { status: 'Maintenance' } });

      // Calculate occupancy rate
      const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(2) : 0;

      // Get beds by ward for detailed breakdown
      const bedsByWard = await db.Bed.findAll({
        attributes: [
          'ward_id',
          [db.sequelize.fn('COUNT', db.sequelize.col('Bed.id')), 'total'],
          [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN Bed.status = "Available" THEN 1 ELSE 0 END')), 'available'],
          [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN Bed.status = "Occupied" THEN 1 ELSE 0 END')), 'occupied'],
          [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN Bed.status = "Maintenance" THEN 1 ELSE 0 END')), 'maintenance']
        ],
        include: [
          { 
            model: db.Ward, 
            as: 'ward', 
            attributes: ['id', 'ward_name', 'ward_type'] 
          }
        ],
        group: ['ward_id', 'ward.id'],
        raw: true
      });

      // Format the response to match frontend expectations
      const formattedBedsByWard = bedsByWard.map(wardData => ({
        ward_id: wardData.ward_id,
        ward_name: wardData['ward.ward_name'],
        total: parseInt(wardData.total) || 0,
        available: parseInt(wardData.available) || 0,
        occupied: parseInt(wardData.occupied) || 0,
        maintenance: parseInt(wardData.maintenance) || 0
      }));

      res.json({
        success: true,
        data: {
          totalBeds: parseInt(totalBeds) || 0,
          availableBeds: parseInt(availableBeds) || 0,
          occupiedBeds: parseInt(occupiedBeds) || 0,
          maintenanceBeds: parseInt(maintenanceBeds) || 0,
          occupancyRate: parseFloat(occupancyRate) || 0,
          bedsByWard: formattedBedsByWard
        }
      });

    } catch (error) {
      console.error('Get bed stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get wards
  async getWards(req, res) {
    try {
      const wards = await db.Ward.findAll({
        attributes: ['id', 'ward_name', 'ward_type'],
        order: [['ward_name', 'ASC']]
      });

      res.json({
        success: true,
        data: { wards }
      });
    } catch (error) {
      console.error('Get wards error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new BedController();