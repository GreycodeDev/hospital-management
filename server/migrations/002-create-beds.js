'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('beds', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bed_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      ward_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'wards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('Available', 'Occupied', 'Maintenance', 'Reserved'),
        defaultValue: 'Available'
      },
      daily_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 100.00
      },
      bed_type: {
        type: Sequelize.ENUM('Standard', 'ICU', 'Maternity', 'Pediatric', 'Private'),
        defaultValue: 'Standard'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('beds');
  }
};