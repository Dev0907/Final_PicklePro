import fs from 'fs';
import path from 'path';
import pool from '../db.js';

async function setupBookingSystem() {
  try {
    console.log('🚀 Setting up booking system...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'create_booking_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Booking system setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('  ✅ facilities table');
    console.log('  ✅ courts table');
    console.log('  ✅ bookings table');
    console.log('  ✅ All necessary indexes');
    console.log('  ✅ Sample data (if tables were empty)');
    console.log('\n🎉 You can now use the court booking system!');
    
  } catch (error) {
    console.error('❌ Error setting up booking system:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupBookingSystem();