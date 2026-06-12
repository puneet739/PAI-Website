-- Add 'life' membership type to support lifetime memberships
ALTER TABLE members
MODIFY COLUMN membership_type ENUM('basic', 'premium', 'instructor', 'life') DEFAULT 'basic';

-- Update any existing 'life' membership records if they exist
-- This is safe to run even if no records exist
UPDATE members 
SET membership_type = 'life' 
WHERE membership_type NOT IN ('basic', 'premium', 'instructor', 'life');
