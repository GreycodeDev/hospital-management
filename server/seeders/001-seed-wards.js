'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('wards', [
      {
        ward_name: 'General Ward A',
        ward_type: 'General',
        gender_specific: 'Mixed',
        capacity: 20,
        description: 'General medical ward for all patients',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ward_name: 'General Ward B',
        ward_type: 'General',
        gender_specific: 'Mixed',
        capacity: 15,
        description: 'General medical ward for all patients',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ward_name: 'ICU',
        ward_type: 'ICU',
        gender_specific: 'Mixed',
        capacity: 8,
        description: 'Intensive Care Unit for critical patients',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ward_name: 'Maternity Ward',
        ward_type: 'Maternity',
        gender_specific: 'Female',
        capacity: 12,
        description: 'Maternity and postnatal care',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ward_name: 'Pediatric Ward',
        ward_type: 'Pediatric',
        gender_specific: 'Mixed',
        capacity: 10,
        description: 'Children and adolescent care',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ward_name: 'Surgical Ward',
        ward_type: 'Surgical',
        gender_specific: 'Mixed',
        capacity: 16,
        description: 'Pre and post-operative care',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ward_name: 'Orthopedic Ward',
        ward_type: 'Orthopedic',
        gender_specific: 'Mixed',
        capacity: 14,
        description: 'Bone and joint treatment',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('wards', null, {});
  }
};