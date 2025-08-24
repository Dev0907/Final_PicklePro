import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'KheloMore',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function addPhotosColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding photos column to courts table...');
    
    // Add photos column to courts table
    await client.query(`
      ALTER TABLE courts ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}'
    `);
    
    console.log('✅ Photos column added to courts table successfully!');
    
    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courts' AND column_name = 'photos'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification: Photos column exists with type:', result.rows[0].data_type);
    } else {
      console.log('❌ Verification failed: Photos column not found');
    }
    
  } catch (error) {
    console.error('❌ Error adding photos column:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the update
addPhotosColumn()
  .then(() => {
    console.log('🎉 Database update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database update failed:', error);
    process.exit(1);
  });