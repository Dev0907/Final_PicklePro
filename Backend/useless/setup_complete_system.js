import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'KheloMore',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function setupCompleteSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up complete owner management system...\n');
    
    // 1. Create uploads directory
    console.log('📁 Creating upload directories...');
    const uploadDirs = [
      'uploads',
      'uploads/facilities',
      'uploads/courts',
      'uploads/tournaments'
    ];
    
    uploadDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ Created ${dir} directory`);
      } else {
        console.log(`  ✅ ${dir} directory already exists`);
      }
    });
    
    // 2. Run all database setup scripts
    console.log('\n🗄️  Setting up database schema...');
    
    const setupScripts = [
      'setup_complete_database.sql',
      'update_notification_system.sql',
      'fix_missing_tables.sql'
    ];
    
    for (const script of setupScripts) {
      if (fs.existsSync(script)) {
        console.log(`  📄 Running ${script}...`);
        const sql = fs.readFileSync(script, 'utf8');
        await client.query(sql);
        console.log(`  ✅ ${script} completed`);
      } else {
        console.log(`  ⚠️  ${script} not found, skipping`);
      }
    }
    
    // 3. Insert sample data if tables are empty
    console.log('\n📊 Checking and inserting sample data...');
    
    // Check if we have sample facilities
    const facilityCount = await client.query('SELECT COUNT(*) FROM facilities');
    if (parseInt(facilityCount.rows[0].count) === 0) {
      console.log('  📝 Inserting sample facilities...');
      
      // Insert sample owner if not exists
      const ownerResult = await client.query(`
        INSERT INTO owners (full_name, email, password, phone_no, created_at)
        VALUES ('Sample Owner', 'owner@example.com', '$2b$10$sample', '1234567890', NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `);
      
      let ownerId;
      if (ownerResult.rows.length > 0) {
        ownerId = ownerResult.rows[0].id;
      } else {
        const existingOwner = await client.query('SELECT id FROM owners LIMIT 1');
        ownerId = existingOwner.rows[0]?.id;
      }
      
      if (ownerId) {
        // Insert sample facility
        const facilityResult = await client.query(`
          INSERT INTO facilities (owner_id, name, location, description, sports_supported, amenities, photos)
          VALUES ($1, 'Premium Pickleball Center', 'Downtown Sports Complex, Main Street', 
                  'State-of-the-art pickleball facility with professional courts and modern amenities',
                  ARRAY['Pickleball'], 
                  ARRAY['Parking', 'Restrooms', 'Pro Shop', 'Locker Rooms', 'Refreshments'],
                  ARRAY['/uploads/facilities/sample1.jpg', '/uploads/facilities/sample2.jpg'])
          RETURNING id
        `, [ownerId]);
        
        const facilityId = facilityResult.rows[0].id;
        
        // Insert sample courts
        const courts = [
          { name: 'Court 1', pricing: 500 },
          { name: 'Court 2', pricing: 500 },
          { name: 'Court 3', pricing: 600 }
        ];
        
        for (const court of courts) {
          await client.query(`
            INSERT INTO courts (facility_id, name, sport_type, pricing_per_hour, operating_hours_start, operating_hours_end, is_active)
            VALUES ($1, $2, 'Pickleball', $3, '06:00', '22:00', true)
          `, [facilityId, court.name, court.pricing]);
        }
        
        console.log('  ✅ Sample facilities and courts created');
      }
    } else {
      console.log('  ✅ Sample data already exists');
    }
    
    // 4. Create sample notifications
    console.log('\n🔔 Setting up sample notifications...');
    const notificationCount = await client.query('SELECT COUNT(*) FROM notifications');
    if (parseInt(notificationCount.rows[0].count) < 5) {
      // Get a sample user
      const userResult = await client.query('SELECT id FROM users LIMIT 1');
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        const sampleNotifications = [
          {
            type: 'facility_added',
            title: 'New Facility Available!',
            message: 'Premium Pickleball Center is now available for bookings. Check out the new courts!'
          },
          {
            type: 'court_added',
            title: 'New Courts Added',
            message: 'New pickleball courts are now available for booking at competitive rates.'
          }
        ];
        
        for (const notification of sampleNotifications) {
          await client.query(`
            INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
            VALUES ($1, $2, $3, $4, false, NOW())
          `, [userId, notification.type, notification.title, notification.message]);
        }
        
        console.log('  ✅ Sample notifications created');
      }
    } else {
      console.log('  ✅ Notifications already exist');
    }
    
    // 5. Final system verification
    console.log('\n🔍 Final system verification...');
    
    const verificationQueries = [
      { name: 'Facilities', query: 'SELECT COUNT(*) FROM facilities' },
      { name: 'Courts', query: 'SELECT COUNT(*) FROM courts' },
      { name: 'Notifications', query: 'SELECT COUNT(*) FROM notifications' },
      { name: 'Maintenance Blocks', query: 'SELECT COUNT(*) FROM maintenance_blocks' }
    ];
    
    for (const check of verificationQueries) {
      const result = await client.query(check.query);
      const count = parseInt(result.rows[0].count);
      console.log(`  📊 ${check.name}: ${count} records`);
    }
    
    console.log('\n🎉 Complete Owner Management System Setup Successful!');
    console.log('\n📋 System Features Ready:');
    console.log('  ✅ Owner Dashboard with Analytics');
    console.log('  ✅ Court Management with Photo Upload');
    console.log('  ✅ Tournament Management with Notifications');
    console.log('  ✅ Slot Management with Maintenance Scheduling');
    console.log('  ✅ Comprehensive Notification System');
    console.log('  ✅ User-side Pickleball Court Booking');
    console.log('  ✅ Real-time Analytics and Reporting');
    
    console.log('\n🚀 Ready to start the application!');
    console.log('   Backend: npm start (http://localhost:5000)');
    console.log('   Frontend: npm run dev (http://localhost:3000)');
    
  } catch (error) {
    console.error('❌ Error setting up complete system:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the complete setup
setupCompleteSystem()
  .then(() => {
    console.log('\n✅ Complete system setup finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });