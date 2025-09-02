import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAuthSystem() {
  console.log('🔍 Testing Authentication System...\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check if users table exists
    console.log('\n2. Checking users table...');
    const usersTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (usersTableCheck.rows[0].exists) {
      console.log('✅ Users table exists');
      
      // Check users table structure
      const usersStructure = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
      `);
      console.log('Users table structure:');
      usersStructure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Users table does not exist');
    }
    
    // Check if owners table exists
    console.log('\n3. Checking owners table...');
    const ownersTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'owners'
      );
    `);
    
    if (ownersTableCheck.rows[0].exists) {
      console.log('✅ Owners table exists');
      
      // Check owners table structure
      const ownersStructure = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'owners' 
        ORDER BY ordinal_position;
      `);
      console.log('Owners table structure:');
      ownersStructure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Owners table does not exist');
    }
    
    // Test environment variables
    console.log('\n4. Checking environment variables...');
    console.log(`DB_HOST: ${process.env.DB_HOST}`);
    console.log(`DB_PORT: ${process.env.DB_PORT}`);
    console.log(`DB_NAME: ${process.env.DB_NAME}`);
    console.log(`DB_USER: ${process.env.DB_USER}`);
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error testing auth system:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testAuthSystem();