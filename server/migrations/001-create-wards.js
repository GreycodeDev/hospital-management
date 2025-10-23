'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ward_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      ward_type: {
        type: Sequelize.ENUM('General', 'ICU', 'Maternity', 'Pediatric', 'Surgical', 'Orthopedic', 'Cardiac'),
        allowNull: false
      },
      gender_specific: {
        type: Sequelize.ENUM('Male', 'Female', 'Mixed'),
        defaultValue: 'Mixed'
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.dropTable('wards');
  }
};