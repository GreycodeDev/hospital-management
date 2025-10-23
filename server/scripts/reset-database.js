const { exec } = require('child_process');
const path = require('path');

const resetDatabase = async () => {
  try {
    console.log('🔄 Resetting database...');
    
    // Drop all tables
    await runCommand('npx sequelize-cli db:migrate:undo:all');
    
    // Run all migrations
    await runCommand('npx sequelize-cli db:migrate');
    
    // Run all seeders
    await runCommand('npx sequelize-cli db:seed:all');
    
    console.log('✅ Database reset completed successfully!');
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
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
};

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.log(`Stderr: ${stderr}`);
      }
      console.log(`✅ ${command.split(' ')[2]} completed`);
      resolve();
    });
  });
};

resetDatabase();