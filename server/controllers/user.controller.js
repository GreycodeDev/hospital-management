const db = require('../models/index.js');
const { Op } = require('sequelize');

class UserController {
  // Get all users (with pagination and filtering)
  async getAllUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        role, 
        search, 
        is_active 
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (role) {
        whereClause.role = role;
      }
      
      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }
      
      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: users } = await db.User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalUsers: count,
            usersPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const user = await db.User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new user (admin only)
  async createUser(req, res) {
    try {
      const { 
        username, 
        email, 
        password, 
        role, 
        first_name, 
        last_name,
        phone_number 
      } = req.body;

      // Validation
      if (!username || !email || !password || !role || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      if (!['admin', 'doctor', 'nurse', 'billing_clerk', 'receptionist'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { username: username }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Create user
      const user = await db.User.create({
        username,
        email,
        password,
        role,
        first_name,
        last_name,
        phone_number
      });

      // Return user data without password
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        is_active: user.is_active,
        last_login: user.last_login,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: userResponse }
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { 
        username, 
        email, 
        role, 
        first_name, 
        last_name,
        phone_number,
        is_active 
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Validation
      if (!first_name || !last_name || !email || !username || !role) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      if (role && !['admin', 'doctor', 'nurse', 'billing_clerk', 'receptionist'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      const user = await db.User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check for duplicate email/username (excluding current user)
      const existingUser = await db.User.findOne({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { email: email },
                { username: username }
              ]
            },
            { id: { [Op.ne]: id } }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Update user
      await user.update({
        username,
        email,
        role,
        first_name,
        last_name,
        phone_number,
        is_active
      });

      const updatedUser = await db.User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Prevent self-deletion
      if (parseInt(id) === parseInt(req.user.userId)) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      const user = await db.User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.destroy();

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const totalUsers = await db.User.count();
      const activeUsers = await db.User.count({ where: { is_active: true } });
      
      const usersByRole = await db.User.findAll({
        attributes: [
          'role',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['role']
      });

      const roleStats = {};
      usersByRole.forEach(stat => {
        roleStats[stat.role] = parseInt(stat.get('count'));
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          usersByRole: roleStats
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();