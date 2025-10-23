'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get sample patients and beds
    const patients = await queryInterface.sequelize.query(
      'SELECT id FROM patients LIMIT 5;'
    );
    const patientRows = patients[0];

    const beds = await queryInterface.sequelize.query(
      'SELECT id FROM beds WHERE status = "Occupied" LIMIT 5;'
    );
    const bedRows = beds[0];

    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE role = "doctor" LIMIT 2;'
    );
    const userRows = users[0];

    await queryInterface.bulkInsert('admissions', [
      {
        patient_id: patientRows[0].id,
        bed_id: bedRows[0].id,
        admission_date: new Date('2023-10-15'),
        status: 'Admitted',
        expected_stay_days: 5,
        reason_for_admission: 'Pneumonia with high fever and respiratory distress',
        attending_physician: 'Dr. John Mbanga',
        insurance_info: 'CIMAS Medical Aid - 123456',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        patient_id: patientRows[1].id,
        bed_id: bedRows[1].id,
        admission_date: new Date('2023-10-16'),
        status: 'Admitted',
        expected_stay_days: 3,
        reason_for_admission: 'Appendicitis requiring surgical intervention',
        attending_physician: 'Dr. Sarah Chimoto',
        insurance_info: 'First Mutual Health - 789012',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        patient_id: patientRows[2].id,
        bed_id: bedRows[2].id,
        admission_date: new Date('2023-10-10'),
        discharge_date: new Date('2023-10-14'),
        status: 'Discharged',
        expected_stay_days: 4,
        reason_for_admission: 'Fractured femur from fall',
        attending_physician: 'Dr. Thomas Makone',
        insurance_info: 'PSMAS - 345678',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        patient_id: patientRows[3].id,
        bed_id: bedRows[3].id,
        admission_date: new Date('2023-10-17'),
        status: 'Admitted',
        expected_stay_days: 2,
        reason_for_admission: 'Hypertension crisis monitoring',
        attending_physician: 'Dr. John Mbanga',
        insurance_info: 'Self-pay',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        patient_id: patientRows[4].id,
        bed_id: bedRows[4].id,
        admission_date: new Date('2023-10-12'),
        discharge_date: new Date('2023-10-13'),
        status: 'Discharged',
        expected_stay_days: 1,
        reason_for_admission: 'Asthma exacerbation',
        attending_physician: 'Dr. Sarah Chimoto',
        insurance_info: 'CIMAS Medical Aid - 901234',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('admissions', null, {});
  }
};