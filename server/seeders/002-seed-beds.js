'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const wards = await queryInterface.sequelize.query(
      'SELECT id FROM wards;'
    );
    const wardRows = wards[0];

    const beds = [];
    
    // Generate beds for each ward
    wardRows.forEach(ward => {
      let bedCount = 0;
      
      // Different capacities based on ward type
      switch(ward.id) {
        case 1: // General Ward A - 20 beds
          bedCount = 20;
          break;
        case 2: // General Ward B - 15 beds
          bedCount = 15;
          break;
        case 3: // ICU - 8 beds
          bedCount = 8;
          break;
        case 4: // Maternity - 12 beds
          bedCount = 12;
          break;
        case 5: // Pediatric - 10 beds
          bedCount = 10;
          break;
        case 6: // Surgical - 16 beds
          bedCount = 16;
          break;
        case 7: // Orthopedic - 14 beds
          bedCount = 14;
          break;
        default:
          bedCount = 10;
      }

      for (let i = 1; i <= bedCount; i++) {
        const bedType = ward.id === 3 ? 'ICU' : 
                       ward.id === 4 ? 'Maternity' : 
                       ward.id === 5 ? 'Pediatric' : 'Standard';
        
        const dailyRate = ward.id === 3 ? 500.00 : 
                         ward.id === 4 ? 200.00 : 
                         ward.id === 5 ? 150.00 : 100.00;

        beds.push({
          bed_number: `B-${ward.id.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
          ward_id: ward.id,
          status: i <= 3 ? 'Occupied' : 'Available', // First 3 beds occupied in each ward
          daily_rate: dailyRate,
          bed_type: bedType,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('beds', beds, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('beds', null, {});
  }
};