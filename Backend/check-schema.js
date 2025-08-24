import pool from './db.js';

const checkSchema = async () => {
  try {
    console.log('Checking database schema...');
    
    // Check matches table structure
    const matchesSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Matches table structure:');
    matchesSchema.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check users table structure
    const usersSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n👥 Users table structure:');
    usersSchema.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check join_requests table structure
    const joinRequestsSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'join_requests' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n🤝 Join_requests table structure:');
    joinRequestsSchema.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Show sample data from matches
    const sampleMatches = await pool.query('SELECT * FROM matches LIMIT 3');
    console.log('\n📊 Sample matches data:');
    sampleMatches.rows.forEach(match => {
      console.log(`  Match ${match.id}:`, Object.keys(match).map(key => `${key}=${match[key]}`).join(', '));
    });
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    await pool.end();
  }
};

checkSchema();