import pool from './db.js';

const addMissingTypes = async () => {
  try {
    console.log('Adding missing notification types...');
    
    await pool.query(`
      ALTER TABLE notifications 
      DROP CONSTRAINT IF EXISTS notifications_type_check
    `);
    
    await pool.query(`
      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_type_check 
      CHECK (type IN (
        'info', 'success', 'warning', 'error',
        'tournament_registration', 'tournament_update', 'tournament_withdrawal',
        'tournament_created', 'tournament_updated', 'tournament_cancelled', 'tournament_registration_confirmed',
        'new_tournament_available', 'new_player_joined',
        'match_created', 'match_updated', 'match_cancelled', 'new_match_available',
        'match_join_request', 'join_request_sent', 'join_request_accepted', 'join_request_declined',
        'match_partner_joined', 'system_announcement', 'maintenance', 'test_announcement', 'system_test',
        'booking_confirmed', 'booking_cancelled', 'booking_completed'
      ))
    `);
    
    console.log('✅ Added system_test to allowed notification types');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
};

addMissingTypes();