'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bills', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bill_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
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
      admission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'admissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      payment_status: {
        type: Sequelize.ENUM('Pending', 'Partial', 'Paid', 'Overdue'),
        defaultValue: 'Pending'
      },
      bill_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      due_date: {
        type: Sequelize.DATE
      },
      payment_date: {
        type: Sequelize.DATE
      },
      payment_method: {
        type: Sequelize.ENUM('Cash', 'Insurance', 'Card', 'Mobile Money', 'Bank Transfer')
      },
      insurance_claim_number: {
        type: Sequelize.STRING(100)
      },
      notes: {
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
    await queryInterface.dropTable('bills');
  }
};