-- Auto-generate membership_id for new members
-- This trigger will automatically create a membership ID in format PAI-MEM-XXXXX
-- where XXXXX is a 5-digit zero-padded member ID

DROP TRIGGER IF EXISTS before_member_insert;

DELIMITER $$

CREATE TRIGGER before_member_insert
BEFORE INSERT ON members
FOR EACH ROW
BEGIN
    -- Only generate membership_id if it's not already set
    IF NEW.membership_id IS NULL OR NEW.membership_id = '' THEN
        -- We can't use NEW.id here as it's not assigned yet in BEFORE INSERT
        -- So we'll use a temporary placeholder that will be updated in AFTER INSERT
        SET NEW.membership_id = 'TEMP';
    END IF;
END$$

DELIMITER ;

-- Trigger to update membership_id after insert (when we have the actual ID)
DROP TRIGGER IF EXISTS after_member_insert;

DELIMITER $$

CREATE TRIGGER after_member_insert
AFTER INSERT ON members
FOR EACH ROW
BEGIN
    -- Update the membership_id with the actual format using the new member's ID
    IF NEW.membership_id = 'TEMP' THEN
        UPDATE members 
        SET membership_id = CONCAT('PAI-MEM-', LPAD(NEW.id, 5, '0'))
        WHERE id = NEW.id;
    END IF;
END$$

DELIMITER ;

-- Update any existing members that don't have a membership_id
UPDATE members 
SET membership_id = CONCAT('PAI-MEM-', LPAD(id, 5, '0'))
WHERE membership_id IS NULL OR membership_id = '' OR membership_id = 'TEMP';
