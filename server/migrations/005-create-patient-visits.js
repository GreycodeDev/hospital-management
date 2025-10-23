'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patient_visits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      visit_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      blood_pressure: {
        type: Sequelize.STRING(20)
      },
      temperature: {
        type: Sequelize.DECIMAL(4, 2)
      },
      pulse: {
        type: Sequelize.INTEGER
      },
      weight: {
        type: Sequelize.DECIMAL(5, 2)
      },
      height: {
        type: Sequelize.DECIMAL(5, 2)
      },
      symptoms: {
        type: Sequelize.TEXT
      },
      diagnosis: {
        type: Sequelize.TEXT
      },
      doctor_notes: {
        type: Sequelize.TEXT
      },
      prescription: {
        type: Sequelize.TEXT
      },
      admission_recommended: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      visit_type: {
        type: Sequelize.ENUM('outpatient', 'inpatient', 'emergency'),
        defaultValue: 'outpatient'
      },
      status: {
        type: Sequelize.ENUM('registered', 'vitals_taken', 'doctor_seen', 'admitted', 'discharged'),
        defaultValue: 'registered'
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
    await queryInterface.dropTable('patient_visits');
  }
};