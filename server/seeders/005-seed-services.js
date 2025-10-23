'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('services', [
      // Consultation Services
      {
        service_code: 'CON001',
        service_name: 'General Consultation',
        service_type: 'Consultation',
        price: 50.00,
        description: 'General medical consultation with doctor',
        category: 'Consultation',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'CON002',
        service_name: 'Specialist Consultation',
        service_type: 'Consultation',
        price: 100.00,
        description: 'Specialist medical consultation',
        category: 'Consultation',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'CON003',
        service_name: 'Emergency Consultation',
        service_type: 'Consultation',
        price: 150.00,
        description: 'Emergency department consultation',
        category: 'Consultation',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Laboratory Tests
      {
        service_code: 'LAB001',
        service_name: 'Complete Blood Count',
        service_type: 'LabTest',
        price: 25.00,
        description: 'Complete blood count test',
        category: 'Hematology',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'LAB002',
        service_name: 'Blood Glucose Test',
        service_type: 'LabTest',
        price: 15.00,
        description: 'Blood glucose level test',
        category: 'Biochemistry',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'LAB003',
        service_name: 'Liver Function Test',
        service_type: 'LabTest',
        price: 45.00,
        description: 'Liver function panel test',
        category: 'Biochemistry',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'LAB004',
        service_name: 'Urinalysis',
        service_type: 'LabTest',
        price: 20.00,
        description: 'Complete urinalysis',
        category: 'Urine Analysis',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'LAB005',
        service_name: 'COVID-19 PCR Test',
        service_type: 'LabTest',
        price: 60.00,
        description: 'COVID-19 PCR test',
        category: 'Microbiology',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Imaging Services
      {
        service_code: 'IMG001',
        service_name: 'Chest X-Ray',
        service_type: 'Procedure',
        price: 80.00,
        description: 'Chest X-ray examination',
        category: 'Radiology',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'IMG002',
        service_name: 'Abdominal Ultrasound',
        service_type: 'Procedure',
        price: 120.00,
        description: 'Abdominal ultrasound scan',
        category: 'Radiology',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'IMG003',
        service_name: 'CT Scan Head',
        service_type: 'Procedure',
        price: 350.00,
        description: 'CT scan of head',
        category: 'Radiology',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'IMG004',
        service_name: 'MRI Scan',
        service_type: 'Procedure',
        price: 500.00,
        description: 'Magnetic resonance imaging',
        category: 'Radiology',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Medications
      {
        service_code: 'MED001',
        service_name: 'Paracetamol 500mg',
        service_type: 'Medication',
        price: 5.00,
        description: 'Pain relief medication',
        category: 'Pharmacy',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'MED002',
        service_name: 'Amoxicillin 500mg',
        service_type: 'Medication',
        price: 12.00,
        description: 'Antibiotic medication',
        category: 'Pharmacy',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'MED003',
        service_name: 'Insulin Vial',
        service_type: 'Medication',
        price: 25.00,
        description: 'Insulin for diabetes',
        category: 'Pharmacy',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'MED004',
        service_name: 'Salbutamol Inhaler',
        service_type: 'Medication',
        price: 18.00,
        description: 'Asthma inhaler',
        category: 'Pharmacy',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Procedures
      {
        service_code: 'PRO001',
        service_name: 'Minor Surgery',
        service_type: 'Procedure',
        price: 300.00,
        description: 'Minor surgical procedure',
        category: 'Surgery',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'PRO002',
        service_name: 'Suturing',
        service_type: 'Procedure',
        price: 75.00,
        description: 'Wound suturing',
        category: 'Surgery',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'PRO003',
        service_name: 'IV Therapy',
        service_type: 'Procedure',
        price: 35.00,
        description: 'Intravenous therapy administration',
        category: 'Nursing',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        service_code: 'PRO004',
        service_name: 'Dressing Change',
        service_type: 'Procedure',
        price: 15.00,
        description: 'Wound dressing change',
        category: 'Nursing',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('services', null, {});
  }
};