-- Add rating expiry tracking, same shape as membership's active_until
ALTER TABLE members
  ADD COLUMN rating_valid_until DATE NULL;

ALTER TABLE member_requests
  MODIFY COLUMN request_type
    ENUM('new_membership','insurance','rating_upgrade','membership_renewal','rating_renewal')
    NOT NULL;

-- One-time backfill for existing members based on their current pilot_rating.
-- Permanent ratings (P1-P6, PPG1-4) never expire; annual ones start a 1-year clock now.
UPDATE members SET rating_valid_until = '2099-12-31'
  WHERE pilot_rating IS NULL OR pilot_rating NOT REGEXP 'P(7|8|9|10)|PPG(5|6|7)|SCHOOL|CLUB';
UPDATE members SET rating_valid_until = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
  WHERE pilot_rating REGEXP 'P(7|8|9|10)|PPG(5|6|7)|SCHOOL|CLUB';
