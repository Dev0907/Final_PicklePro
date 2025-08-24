-- Create message_status table for tracking message delivery and read status
CREATE TABLE IF NOT EXISTS message_status (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(message_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user_id ON message_status(user_id);
CREATE INDEX IF NOT EXISTS idx_message_status_status ON message_status(status);

-- Update chat_messages table to use UUID for message IDs if not already done
ALTER TABLE chat_messages 
ALTER COLUMN id TYPE VARCHAR(255);

-- Add session_id column to chat_messages for better session management
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);

-- Add message type column for different message types (text, image, etc.)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';

-- Add reply_to column for message replies
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS reply_to VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to);