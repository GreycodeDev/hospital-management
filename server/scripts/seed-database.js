const { exec } = require('child_process');
const path = require('path');

const seeders = [
  '001-seed-wards.js',
  '002-seed-beds.js',
  '003-seed-users.js',
  '004-seed-patients.js',
  '005-seed-services.js',
  '006-seed-admissions.js',
  '007-seed-billing.js',
  '008-seed-patient-visits.js'
];

const runSeeder = (seederName) => {
  return new Promise((resolve, reject) => {
    exec(`npx sequelize-cli db:seed --seed ${seederName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running ${seederName}:`, error);
        reject(error);
        return;
      }
      console.log(`✅ ${seederName} completed successfully`);
      resolve();
    });
  });
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    for (const seeder of seeders) {
      await runSeeder(seeder);
    }
    
    console.log('🎉 All seeders completed successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log('   • 7 Wards with different specialties');
    console.log('   • 95 Beds across all wards');
    console.log('   • 8 Users with different roles');
    console.log('   • 10 Patients with complete information');
    console.log('   • 20 Medical services and procedures');
    console.log('   • 5 Admissions (3 current, 2 discharged)');
    console.log('   • Sample billing records for all admissions');
    console.log('   • Patient visit history');
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Admin: admin@victoriahospital.com / password123');
    console.log('   Doctor: john.mbanga@victoriahospital.com / password123');
    console.log('   Nurse: mary.mlambo@victoriahospital.com / password123');
    console.log('   Billing: billing@victoriahospital.com / password123');
    console.log('   Reception: reception@victoriahospital.com / password123');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();