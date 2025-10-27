'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get admissions and services
    const admissions = await queryInterface.sequelize.query(
      'SELECT id, patient_id FROM admissions;'
    );
    const admissionRows = admissions[0];

    const services = await queryInterface.sequelize.query(
      'SELECT id, service_type, price FROM services;'
    );
    const serviceRows = services[0];

    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE role IN ("doctor", "nurse", "billing_clerk");'
    );
    const userRows = users[0];

    const billingData = [];

    // Service descriptions mapping
    const serviceDescriptions = {
      'Consultation': 'Initial consultation fee',
      'Bed': 'Bed charges',
      'Medication': 'Medication administration',
      'LabTest': 'Laboratory test',
      'Procedure': 'Medical procedure',
      'X-Ray': 'X-Ray imaging',
      'Other': 'Medical service'
    };

    // Generate billing records for each admission
    admissionRows.forEach(admission => {
      // Add consultation fee
      const consultationService = serviceRows.find(s => s.service_type === 'Consultation');
      billingData.push({
        patient_id: admission.patient_id,
        admission_id: admission.id,
        service_id: consultationService?.id,
        service_type: 'Consultation',
        description: 'Initial consultation fee',
        quantity: 1,
        unit_price: 50.00,
        total_amount: 50.00,
        service_date: new Date(),
        is_paid: Math.random() > 0.3, // 70% paid
        added_by: userRows[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Add bed charges (3-7 days)
      const stayDays = Math.floor(Math.random() * 5) + 3;
      const dailyRate = 100.00;
      const bedService = serviceRows.find(s => s.service_type === 'Bed');
      billingData.push({
        patient_id: admission.patient_id,
        admission_id: admission.id,
        service_id: bedService?.id,
        service_type: 'Bed',
        description: `Bed charges for ${stayDays} days`,
        quantity: stayDays,
        unit_price: dailyRate,
        total_amount: stayDays * dailyRate,
        service_date: new Date(),
        is_paid: Math.random() > 0.4, // 60% paid
        added_by: userRows[0].id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Add 2-4 random services
      const randomServiceCount = Math.floor(Math.random() * 3) + 2;
      const usedServices = new Set();
      
      for (let i = 0; i < randomServiceCount; i++) {
        // Filter out Consultation and Bed services for random selection
        const availableServices = serviceRows.filter(s => 
          s.service_type !== 'Consultation' && 
          s.service_type !== 'Bed' &&
          !usedServices.has(s.id)
        );
        
        if (availableServices.length === 0) break;
        
        const randomService = availableServices[Math.floor(Math.random() * availableServices.length)];
        usedServices.add(randomService.id);
        
        const quantity = randomService.service_type === 'Medication' ? Math.floor(Math.random() * 3) + 1 : 1;
        const description = serviceDescriptions[randomService.service_type] || `${randomService.service_type} service`;
        
        billingData.push({
          patient_id: admission.patient_id,
          admission_id: admission.id,
          service_id: randomService.id,
          service_type: randomService.service_type,
          description: description,
          quantity: quantity,
          unit_price: randomService.price,
          total_amount: quantity * randomService.price,
          service_date: new Date(),
          is_paid: Math.random() > 0.5, // 50% paid
          added_by: userRows[Math.floor(Math.random() * userRows.length)].id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('billing', billingData, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('billing', null, {});
  }
};