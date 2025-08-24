import pool from '../db.js';

async function debugMatches() {
  try {
    console.log('🔍 Debugging matches...');

    // Check all matches
    console.log('\n1. All matches in database:');
    const allMatches = await pool.query(`
      SELECT 
        m.id, 
        m.date_time, 
        m.location, 
        m.players_required, 
        m.level_of_game,
        m.status,
        u.fullname as creator_name,
        (m.date_time > NOW()) as is_future
      FROM matches m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.date_time DESC
      LIMIT 10
    `);

    allMatches.rows.forEach((match, index) => {
      const status = match.is_future ? '🟢 FUTURE' : '🔴 PAST';
      console.log(`   ${index + 1}. ${match.level_of_game} match by ${match.creator_name}`);
      console.log(`      Date: ${new Date(match.date_time).toLocaleString()} ${status}`);
      console.log(`      Location: ${match.location}`);
      console.log(`      Players needed: ${match.players_required}`);
      console.log(`      Status: ${match.status || 'active'}`);
      console.log('');
    });

    // Check future matches only
    console.log('\n2. Future matches only:');
    const futureMatches = await pool.query(`
      SELECT 
        m.id, 
        m.date_time, 
        m.location, 
        m.players_required, 
        m.level_of_game,
        m.status,
        u.fullname as creator_name
      FROM matches m
      JOIN users u ON m.user_id = u.id
      WHERE m.date_time > NOW()
      ORDER BY m.date_time ASC
    `);

    if (futureMatches.rows.length === 0) {
      console.log('   ⚠️  No future matches found!');
    } else {
      futureMatches.rows.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.level_of_game} match by ${match.creator_name}`);
        console.log(`      Date: ${new Date(match.date_time).toLocaleString()}`);
        console.log(`      Location: ${match.location}`);
        console.log(`      Players needed: ${match.players_required}`);
        console.log(`      Status: ${match.status || 'active'}`);
        console.log('');
      });
    }

    // Check participants for future matches
    console.log('\n3. Checking participants for future matches:');
    const matchParticipants = await pool.query(`
      SELECT 
        m.id as match_id,
        m.level_of_game,
        m.players_required,
        u.fullname as creator_name,
        COUNT(mp.user_id) as current_participants
      FROM matches m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN matchparticipants mp ON m.id = mp.match_id
      WHERE m.date_time > NOW()
      GROUP BY m.id, m.level_of_game, m.players_required, u.fullname
      ORDER BY m.date_time ASC
    `);

    matchParticipants.rows.forEach((match, index) => {
      const isFull = parseInt(match.current_participants) >= match.players_required;
      const status = isFull ? '🔴 FULL' : '🟢 AVAILABLE';
      console.log(`   ${index + 1}. ${match.level_of_game} match by ${match.creator_name} ${status}`);
      console.log(`      Participants: ${match.current_participants}/${match.players_required}`);
      console.log('');
    });

    // Test the exact query used by getAllMatches
    console.log('\n4. Testing getAllMatches query (FIXED):');
    const availableMatches = await pool.query(`
      SELECT 
        m.*, 
        u.fullname as creator_name, 
        u.level_of_game as creator_level, 
        COALESCE(COUNT(mp.user_id), 0) as current_participants
       FROM matches m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN matchparticipants mp ON m.id = mp.match_id
       WHERE m.date_time > NOW() 
         AND (m.status IS NULL OR m.status = 'active' OR m.status = 'upcoming')
       GROUP BY m.id, u.fullname, u.level_of_game
       HAVING COALESCE(COUNT(mp.user_id), 0) < m.players_required
       ORDER BY m.date_time ASC
    `);

    console.log(`   Found ${availableMatches.rows.length} available matches`);
    availableMatches.rows.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.level_of_game} match by ${match.creator_name}`);
      console.log(`      Date: ${new Date(match.date_time).toLocaleString()}`);
      console.log(`      Participants: ${match.current_participants}/${match.players_required}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error debugging matches:', error);
    throw error;
  }
}

// Run the debug
debugMatches()
  .then(() => {
    console.log('🎯 Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });