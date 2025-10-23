'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@victoriahospital.com',
        password: hashedPassword,
        role: 'admin',
        first_name: 'System',
        last_name: 'Administrator',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'drjohn',
        email: 'john.mbanga@victoriahospital.com',
        password: hashedPassword,
        role: 'doctor',
        first_name: 'John',
        last_name: 'Mbanga',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'drsarah',
        email: 'sarah.chimoto@victoriahospital.com',
        password: hashedPassword,
        role: 'doctor',
        first_name: 'Sarah',
        last_name: 'Chimoto',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'nursemary',
        email: 'mary.mlambo@victoriahospital.com',
        password: hashedPassword,
        role: 'nurse',
        first_name: 'Mary',
        last_name: 'Mlambo',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'nursepeter',
        email: 'peter.moyo@victoriahospital.com',
        password: hashedPassword,
        role: 'nurse',
        first_name: 'Peter',
        last_name: 'Moyo',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'billingclerk',
        email: 'billing@victoriahospital.com',
        password: hashedPassword,
        role: 'billing_clerk',
        first_name: 'Grace',
        last_name: 'Ndlovu',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'receptionist',
        email: 'reception@victoriahospital.com',
        password: hashedPassword,
        role: 'receptionist',
        first_name: 'Linda',
        last_name: 'Khumalo',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'drthomas',
        email: 'thomas.makone@victoriahospital.com',
        password: hashedPassword,
        role: 'doctor',
        first_name: 'Thomas',
        last_name: 'Makone',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};