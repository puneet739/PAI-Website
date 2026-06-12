-- Restructure membership types: individual / school_club + life membership flag
-- Safe: only adds columns, migrates data, then alters ENUM

-- 1. Add new columns
ALTER TABLE members
  ADD COLUMN is_life_member       TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN life_membership_number INT NULL;

-- 2. Flag existing life members
UPDATE members SET is_life_member = 1 WHERE membership_type = 'life';

-- 3. Assign sequential life membership numbers (ordered by join date)
SET @life_num = 0;
UPDATE members
  SET life_membership_number = (@life_num := @life_num + 1)
  WHERE is_life_member = 1
  ORDER BY created_at ASC;

-- 4. Expand ENUM to include both old and new values so UPDATE can succeed
ALTER TABLE members
  MODIFY COLUMN membership_type ENUM('basic','premium','instructor','life','individual','school_club') DEFAULT 'individual';

-- 5. Migrate membership_type values to new categories
UPDATE members SET membership_type = 'individual'  WHERE membership_type IN ('basic', 'premium', 'life');
UPDATE members SET membership_type = 'school_club' WHERE membership_type = 'instructor';

-- 6. Shrink ENUM to only the two new values
ALTER TABLE members
  MODIFY COLUMN membership_type ENUM('individual', 'school_club') DEFAULT 'individual';

-- 6. Migrate renewal_membership_type in member_requests (if any rows exist)
UPDATE member_requests
  SET renewal_membership_type = 'individual'
  WHERE renewal_membership_type IN ('basic', 'premium', 'life');
UPDATE member_requests
  SET renewal_membership_type = 'school_club'
  WHERE renewal_membership_type = 'instructor';
