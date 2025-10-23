const db = require('../models/index.js');
const { Op } = require('sequelize');

class ServiceController {
  // Get all services
  async getAllServices(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        service_type,
        category,
        is_active
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (service_type) {
        whereClause.service_type = service_type;
      }
      
      if (category) {
        whereClause.category = category;
      }
      
      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }

      const { count, rows: services } = await db.Service.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['service_name', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          services,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalServices: count,
            servicesPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all services error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get service by ID
  async getServiceById(req, res) {
    try {
      const { id } = req.params;

      const service = await db.Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        data: { service }
      });

    } catch (error) {
      console.error('Get service by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new service
  async createService(req, res) {
    try {
      const {
        service_code,
        service_name,
        service_type,
        price,
        description,
        category
      } = req.body;

      // Validation
      if (!service_code || !service_name || !service_type || !price) {
        return res.status(400).json({
          success: false,
          message: 'Service code, name, type, and price are required'
        });
      }

      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than 0'
        });
      }

      // Check if service code already exists
      const existingService = await db.Service.findOne({
        where: { service_code: service_code }
      });

      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service with this code already exists'
        });
      }

      const service = await db.Service.create({
        service_code,
        service_name,
        service_type,
        price,
        description,
        category
      });

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: { service }
      });

    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update service
  async updateService(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const service = await db.Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Check if service code is being updated and if it already exists
      if (updateData.service_code && updateData.service_code !== service.service_code) {
        const existingService = await db.Service.findOne({
          where: { service_code: updateData.service_code }
        });

        if (existingService) {
          return res.status(400).json({
            success: false,
            message: 'Another service with this code already exists'
          });
        }
      }

      await service.update(updateData);

      const updatedService = await db.Service.findByPk(id);

      res.json({
        success: true,
        message: 'Service updated successfully',
        data: { service: updatedService }
      });

    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete service
  async deleteService(req, res) {
    try {
      const { id } = req.params;

      const service = await db.Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Check if service is used in billing
      const billingCount = await db.Billing.count({
        where: { service_id: id }
      });

      if (billingCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete service that is used in billing records'
        });
      }

      await service.destroy();

      res.json({
        success: true,
        message: 'Service deleted successfully'
      });

    } catch (error) {
      console.error('Delete service error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get services by type
  async getServicesByType(req, res) {
    try {
      const { service_type } = req.params;

      const services = await db.Service.findAll({
        where: { 
          service_type: service_type,
          is_active: true
        },
        order: [['service_name', 'ASC']]
      });

      res.json({
        success: true,
        data: { services }
      });

    } catch (error) {
      console.error('Get services by type error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get service statistics
  async getServiceStats(req, res) {
    try {
      const totalServices = await db.Service.count();
      const activeServices = await db.Service.count({ where: { is_active: true } });

      const servicesByType = await db.Service.findAll({
        attributes: [
          'service_type',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['service_type']
      });

      const typeStats = {};
      servicesByType.forEach(stat => {
        typeStats[stat.service_type] = parseInt(stat.get('count'));
      });

      // Most used services
      const mostUsedServices = await db.Billing.findAll({
        attributes: [
          'service_id',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'usage_count'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total_revenue']
        ],
        include: [
          {
            model: db.Service,
            as: 'service',
            attributes: ['service_name', 'service_type']
          }
        ],
        group: ['service_id'],
        order: [[db.sequelize.literal('usage_count'), 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        data: {
          totalServices,
          activeServices,
          servicesByType: typeStats,
          mostUsedServices
        }
      });

    } catch (error) {
      console.error('Get service stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new ServiceController();