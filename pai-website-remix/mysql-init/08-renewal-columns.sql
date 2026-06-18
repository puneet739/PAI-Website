-- Add renewal-specific columns to member_requests table
-- renewal_duration_years: how many years the member chose (1, 2 or 3)
-- renewal_amount: the amount shown to admin for payment verification
-- renewal_membership_type: the type the member wants after renewal (upgrade support)
ALTER TABLE member_requests
  ADD COLUMN renewal_duration_years TINYINT DEFAULT 1,
  ADD COLUMN renewal_amount DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN renewal_membership_type VARCHAR(50) DEFAULT NULL;
