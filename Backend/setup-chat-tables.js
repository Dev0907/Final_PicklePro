import pool from './db.js';

async function setupChatTables() {
  try {
    console.log('Checking and setting up chat tables...');
    
    // Check if chat_messages table exists
    const chatTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages'
      );
    `);
    console.log('chat_messages table exists:', chatTableResult.rows[0].exists);
    
    // Check if message_status table exists
    const statusTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'message_status'
      );
    `);
    console.log('message_status table exists:', statusTableResult.rows[0].exists);
    
    // Create chat_messages table if it doesn't exist
    if (!chatTableResult.rows[0].exists) {
      console.log('Creating chat_messages table...');
      await pool.query(`
        CREATE TABLE chat_messages (
          id VARCHAR(255) PRIMARY KEY,
          match_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          session_id VARCHAR(255),
          message_type VARCHAR(20) DEFAULT 'text',
          reply_to VARCHAR(255)
        );
      `);
      
      await pool.query(`
        CREATE INDEX idx_chat_messages_match_id ON chat_messages(match_id);
      `);
      await pool.query(`
        CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
      `);
      await pool.query(`
        CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
      `);
      await pool.query(`
        CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
      `);
      await pool.query(`
        CREATE INDEX idx_chat_messages_reply_to ON chat_messages(reply_to);
      `);
      console.log('chat_messages table created successfully');
    }
    
    // Create message_status table if it doesn't exist
    if (!statusTableResult.rows[0].exists) {
      console.log('Creating message_status table...');
      await pool.query(`
        CREATE TABLE message_status (
          id SERIAL PRIMARY KEY,
          message_id VARCHAR(255) NOT NULL,
          user_id INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'sent',
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(message_id, user_id)
        );
      `);
      
      await pool.query(`
        CREATE INDEX idx_message_status_message_id ON message_status(message_id);
      `);
      await pool.query(`
        CREATE INDEX idx_message_status_user_id ON message_status(user_id);
      `);
      await pool.query(`
        CREATE INDEX idx_message_status_status ON message_status(status);
      `);
      console.log('message_status table created successfully');
    }
    
    console.log('✅ Database setup complete! Chat functionality is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup error:', error);
    process.exit(1);
  }
}

setupChatTables();