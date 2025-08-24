-- Add photos column to courts table if it doesn't exist
DO $ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courts' AND column_name = 'photos') THEN
        ALTER TABLE courts 
        ADD COLUMN photos TEXT[] DEFAULT '{}';
    END IF;
END $;

-- Success message
SELECT 'Photos column added to courts table successfully!' as message;