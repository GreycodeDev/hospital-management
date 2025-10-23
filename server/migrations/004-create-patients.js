'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patient_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      id_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING(20)
      },
      address: {
        type: Sequelize.TEXT
      },
      next_of_kin_name: {
        type: Sequelize.STRING(100)
      },
      next_of_kin_phone: {
        type: Sequelize.STRING(20)
      },
      blood_type: {
        type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
      },
      allergies: {
        type: Sequelize.TEXT
      },
      emergency_contact: {
        type: Sequelize.STRING(20)
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
    await queryInterface.dropTable('patients');
  }
};