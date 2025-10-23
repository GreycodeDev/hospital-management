'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const patients = await queryInterface.sequelize.query(
      'SELECT id FROM patients;'
    );
    const patientRows = patients[0];

    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE role = "doctor";'
    );
    const userRows = users[0];

    const visits = [];

    patientRows.forEach(patient => {
      // Create 1-3 visits per patient
      const visitCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < visitCount; i++) {
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 30));
        
        const symptoms = [
          'Fever and cough',
          'Headache and dizziness',
          'Chest pain',
          'Abdominal pain',
          'Shortness of breath',
          'Joint pain and swelling',
          'Skin rash',
          'Fatigue and weakness'
        ];
        
        const diagnoses = [
          'Upper respiratory infection',
          'Hypertension',
          'Diabetes mellitus',
          'Asthma',
          'Gastroenteritis',
          'Urinary tract infection',
          'Musculoskeletal pain',
          'Anxiety disorder'
        ];

        const randomSymptom = symptoms[Math.floor(Math.random() * symptoms.length)];
        const randomDiagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];

        visits.push({
          patient_id: patient.id,
          doctor_id: userRows[Math.floor(Math.random() * userRows.length)].id,
          visit_date: visitDate,
          blood_pressure: `${120 + Math.floor(Math.random() * 30)}/${80 + Math.floor(Math.random() * 20)}`,
          temperature: (36.5 + Math.random() * 1.5).toFixed(1),
          pulse: 60 + Math.floor(Math.random() * 40),
          symptoms: randomSymptom,
          diagnosis: randomDiagnosis,
          doctor_notes: `Patient presented with ${randomSymptom.toLowerCase()}. Recommended ${randomDiagnosis.toLowerCase()} management.`,
          prescription: 'Paracetamol 500mg as needed for pain',
          admission_recommended: i === 0 && Math.random() > 0.7, // 30% chance for first visit
          visit_type: 'outpatient',
          status: i === 0 && Math.random() > 0.7 ? 'admitted' : 'doctor_seen',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('patient_visits', visits, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('patient_visits', null, {});
  }
};