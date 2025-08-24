-- Add current_participants column to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 1;

-- Update existing matches with current participant counts
UPDATE matches 
SET current_participants = (
    SELECT 1 + 
           COALESCE(COUNT(DISTINCT CASE WHEN jr.status = 'accepted' THEN jr.user_id END), 0) + 
           COALESCE(COUNT(DISTINCT CASE WHEN mp.user_id != matches.user_id THEN mp.user_id END), 0)
    FROM join_requests jr
    LEFT JOIN matchparticipants mp ON jr.match_id = mp.match_id
    WHERE jr.match_id = matches.id
    GROUP BY jr.match_id
)
WHERE current_participants IS NULL OR current_participants = 1;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_matches_current_participants ON matches(current_participants);

-- Add a trigger to automatically update current_participants when join_requests or matchparticipants change
CREATE OR REPLACE FUNCTION update_match_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the match participant count
    UPDATE matches 
    SET current_participants = (
        SELECT 1 + 
               COALESCE(COUNT(DISTINCT CASE WHEN jr.status = 'accepted' THEN jr.user_id END), 0) + 
               COALESCE(COUNT(DISTINCT CASE WHEN mp.user_id != matches.user_id THEN mp.user_id END), 0)
        FROM join_requests jr
        LEFT JOIN matchparticipants mp ON jr.match_id = mp.match_id
        WHERE jr.match_id = matches.id
        GROUP BY jr.match_id
    )
    WHERE id = COALESCE(NEW.match_id, OLD.match_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updates
DROP TRIGGER IF EXISTS trigger_update_participant_count_jr ON join_requests;
CREATE TRIGGER trigger_update_participant_count_jr
    AFTER INSERT OR UPDATE OR DELETE ON join_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_match_participant_count();

DROP TRIGGER IF EXISTS trigger_update_participant_count_mp ON matchparticipants;
CREATE TRIGGER trigger_update_participant_count_mp
    AFTER INSERT OR UPDATE OR DELETE ON matchparticipants
    FOR EACH ROW
    EXECUTE FUNCTION update_match_participant_count();