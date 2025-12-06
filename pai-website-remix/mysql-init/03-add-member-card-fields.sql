-- Add fields for member card generation
ALTER TABLE members
ADD COLUMN address TEXT AFTER phone,
ADD COLUMN blood_group VARCHAR(10) AFTER address,
ADD COLUMN gender ENUM('Male', 'Female', 'Other') AFTER blood_group,
ADD COLUMN date_of_birth DATE AFTER gender,
ADD COLUMN membership_id VARCHAR(50) UNIQUE AFTER id;

-- Generate membership IDs for existing members
UPDATE members 
SET membership_id = CONCAT('PAI-MEM-', LPAD(id, 5, '0'))
WHERE membership_id IS NULL;

-- Update sample members with additional data
UPDATE members SET 
    address = '123, Cloudview Heights, Bir Billing, Himachal Pradesh, 176077',
    blood_group = 'O+',
    gender = 'Male',
    date_of_birth = '1985-08-15'
WHERE email = 'admin@pai.org.in';

UPDATE members SET 
    address = '456, Skyline Apartments, Kamshet, Maharashtra, 410405',
    blood_group = 'A+',
    gender = 'Male',
    date_of_birth = '1990-03-22'
WHERE email = 'pilot@example.com';

UPDATE members SET 
    address = '789, Valley View, Yelagiri, Tamil Nadu, 635853',
    blood_group = 'B+',
    gender = 'Female',
    date_of_birth = '1995-11-08'
WHERE email = 'beginner@example.com';

UPDATE members SET 
    address = '321, Mountain Ridge, Nandi Hills, Karnataka, 562122',
    blood_group = 'AB+',
    gender = 'Female',
    date_of_birth = '1988-06-30'
WHERE email = 'instructor@example.com';
