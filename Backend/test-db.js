import pool from './db.js';

const testDatabase = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);
    
    // Check if matches table exists and get structure
    const matchesSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'matches'
      ORDER BY ordinal_position
    `);
    console.log('📋 Matches table structure:');
    matchesSchema.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if chat_messages table exists
    const chatTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'chat_messages'
      )
    `);
    console.log('💬 Chat messages table exists:', chatTableExists.rows[0].exists);
    
    // Get some sample matches
    const matches = await pool.query('SELECT id, user_id, players_required FROM matches LIMIT 3');
    console.log('🎾 Sample matches:');
    matches.rows.forEach(match => {
      console.log(`  - Match ${match.id}: creator=${match.user_id}, players_needed=${match.players_required}`);
    });
    
    // Check join_requests table
    const joinRequests = await pool.query(`
      SELECT match_id, user_id, status, COUNT(*) as count
      FROM join_requests 
      GROUP BY match_id, user_id, status
      LIMIT 5
    `);
    console.log('🤝 Sample join requests:');
    joinRequests.rows.forEach(req => {
      console.log(`  - Match ${req.match_id}: user=${req.user_id}, status=${req.status}, count=${req.count}`);
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
};

testDatabase();