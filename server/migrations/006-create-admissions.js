'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admissions', {
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
      bed_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'beds',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      visit_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'patient_visits',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      admission_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      discharge_date: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM('Admitted', 'Discharged', 'Transferred'),
        defaultValue: 'Admitted'
      },
      expected_stay_days: {
        type: Sequelize.INTEGER
      },
      reason_for_admission: {
        type: Sequelize.TEXT
      },
      attending_physician: {
        type: Sequelize.STRING(100)
      },
      insurance_info: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('admissions');
  }
};