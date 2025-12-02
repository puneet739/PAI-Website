-- PAI Database Initialization Script
-- This script runs automatically when the MySQL container starts for the first time

-- Create tables for PAI website

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('ADMIN', 'USER', 'INSTRUCTOR') UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('ADMIN', 'Administrator with full access to admin panel and user management'),
('USER', 'Regular user with access to member features'),
('INSTRUCTOR', 'Instructor with access to admin panel and user management');

-- Users/Members table
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_image LONGTEXT,
    role_id INT DEFAULT 2,
    membership_type ENUM('basic', 'premium', 'instructor') DEFAULT 'basic',
    membership_status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    active_until DATE NULL,
    pilot_rating VARCHAR(50) DEFAULT 'P1',
    total_flights INT DEFAULT 0,
    total_flight_hours DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_email (email),
    INDEX idx_membership_status (membership_status),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flying sites table
CREATE TABLE IF NOT EXISTS flying_sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude INT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_state (state),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Training schools table
CREATE TABLE IF NOT EXISTS training_schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    certification_level VARCHAR(100),
    is_accredited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_accredited (is_accredited)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('competition', 'training', 'social', 'safety') DEFAULT 'social',
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    registration_deadline DATE,
    max_participants INT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_start_date (start_date),
    INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Safety incidents table
CREATE TABLE IF NOT EXISTS safety_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_date DATE NOT NULL,
    location VARCHAR(255),
    severity ENUM('minor', 'moderate', 'serious', 'fatal') DEFAULT 'minor',
    description TEXT,
    lessons_learned TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_incident_date (incident_date),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('new', 'in_progress', 'resolved') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insurance policies table
CREATE TABLE IF NOT EXISTS insurance_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    policy_type ENUM('basic', 'premium', 'comprehensive') DEFAULT 'basic',
    coverage_amount DECIMAL(10,2) NOT NULL,
    premium_amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Test questions table
CREATE TABLE IF NOT EXISTS test_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_level ENUM('P1', 'P2', 'P3', 'P4') NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_test_level (test_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    test_level ENUM('P1', 'P2', 'P3', 'P4') NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    time_taken INT NOT NULL COMMENT 'Time taken in seconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_test_level (test_level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Member requests table (for all types of requests)
CREATE TABLE IF NOT EXISTS member_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    request_type ENUM('new_membership', 'insurance', 'rating_upgrade', 'membership_renewal') NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    details TEXT,
    current_rating VARCHAR(50),
    requested_rating VARCHAR(50),
    insurance_type VARCHAR(50),
    coverage_amount DECIMAL(10,2),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    processed_by INT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES members(id) ON DELETE SET NULL,
    INDEX idx_member_id (member_id),
    INDEX idx_status (status),
    INDEX idx_request_type (request_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for flying sites
INSERT INTO flying_sites (name, location, state, description, difficulty_level, is_active) VALUES
('Bir Billing', 'Bir, Kangra', 'Himachal Pradesh', 'The Himalayan mecca for XC and soaring, with world-class conditions.', 'advanced', TRUE),
('Kamshet', 'Kamshet, Pune', 'Maharashtra', 'Training-friendly ridges with reliable winds near Pune and Mumbai.', 'beginner', TRUE),
('Nandi Hills', 'Nandi Hills, Chikkaballapur', 'Karnataka', 'Scenic morning flights and ridge soaring near Bengaluru.', 'intermediate', TRUE),
('Yelagiri', 'Yelagiri', 'Tamil Nadu', 'Beginner-friendly conditions and a vibrant local community.', 'beginner', TRUE);

-- Create demo users (password: 'password123' - bcrypt hashed)
-- Hash generated with: bcrypt.hash('password123', 10)
-- active_until dates set to 1 year from now
-- role_id: 1=ADMIN, 2=USER, 3=INSTRUCTOR
INSERT INTO members (email, password_hash, name, phone, role_id, membership_type, membership_status, active_until, pilot_rating, total_flights, total_flight_hours) VALUES
('admin@pai.org.in', '$2b$10$M7tjfHnU39uMsb9Bfwmwi.PT4JGhQbebg8cp7gCpBdZxikhVdpZgW', 'PAI Admin', '+91-9876543210', 1, 'instructor', 'active', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Instructor', 250, 450.50),
('pilot@example.com', '$2b$10$M7tjfHnU39uMsb9Bfwmwi.PT4JGhQbebg8cp7gCpBdZxikhVdpZgW', 'John Pilot', '+91-9876543211', 2, 'premium', 'active', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'P4', 85, 120.75),
('beginner@example.com', '$2b$10$M7tjfHnU39uMsb9Bfwmwi.PT4JGhQbebg8cp7gCpBdZxikhVdpZgW', 'Sarah Beginner', '+91-9876543212', 2, 'basic', 'active', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'P2', 15, 22.50),
('puneet739@gmail.com', '$2b$10$M7tjfHnU39uMsb9Bfwmwi.PT4JGhQbebg8cp7gCpBdZxikhVdpZgW', 'Puneet', NULL, 2, 'basic', 'inactive', NULL, 'P1', 0, 0.00),
('instructor@example.com', '$2b$10$M7tjfHnU39uMsb9Bfwmwi.PT4JGhQbebg8cp7gCpBdZxikhVdpZgW', 'Jane Instructor', '+91-9876543213', 3, 'instructor', 'active', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Instructor', 180, 320.25);

-- Insert sample insurance policies
INSERT INTO insurance_policies (member_id, policy_number, policy_type, coverage_amount, premium_amount, start_date, end_date, status) VALUES
(2, 'PAI-INS-2024-001', 'premium', 5000000.00, 5000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active'),
(3, 'PAI-INS-2024-002', 'basic', 2000000.00, 2000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active');

-- Insert sample events
INSERT INTO events (title, description, event_type, location, start_date, end_date, registration_deadline, max_participants, is_published) VALUES
('Panchgani Paragliding Festival 2025', 'Join us for an exciting weekend of paragliding in the beautiful hills of Panchgani. This event features tandem flights, competitions, and workshops for pilots of all levels. Experience the thrill of flying over the scenic Western Ghats with fellow enthusiasts.', 'competition', 'Panchgani, Maharashtra', DATE_ADD(CURDATE(), INTERVAL 45 DAY), DATE_ADD(CURDATE(), INTERVAL 47 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 100, TRUE),
('Bir Billing XC Camp', 'Advanced cross-country flying camp in Bir Billing. Learn XC techniques, route planning, and safety procedures from experienced instructors. Perfect for P3 and P4 pilots looking to improve their distance flying skills.', 'training', 'Bir Billing, Himachal Pradesh', DATE_ADD(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 67 DAY), DATE_ADD(CURDATE(), INTERVAL 45 DAY), 25, TRUE),
('Kamshet Safety Workshop', 'Comprehensive safety workshop covering emergency procedures, SIV training, and risk management. Open to all pilot ratings. Learn from certified instructors and improve your safety awareness.', 'safety', 'Kamshet, Maharashtra', DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 50, TRUE),
('PAI Annual Gathering', 'Annual social gathering for all PAI members. Network with fellow pilots, share experiences, and enjoy presentations on the latest in paragliding technology and techniques. Dinner and entertainment included.', 'social', 'Mumbai, Maharashtra', DATE_ADD(CURDATE(), INTERVAL 90 DAY), DATE_ADD(CURDATE(), INTERVAL 90 DAY), DATE_ADD(CURDATE(), INTERVAL 75 DAY), 200, TRUE),
('Yelagiri Beginner Flying Week', 'Week-long training program for P1 and P2 pilots. Focus on ground handling, basic flight techniques, and building confidence. Ideal for new pilots looking to gain more experience in a supportive environment.', 'training', 'Yelagiri, Tamil Nadu', DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 37 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 30, TRUE);

-- Insert sample test questions for P1 level
INSERT INTO test_questions (test_level, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
('P1', 'What is the minimum age requirement for paragliding in India?', '16 years', '18 years', '21 years', '25 years', 'B'),
('P1', 'What does the term "thermal" refer to in paragliding?', 'Cold air current', 'Rising column of warm air', 'Wind from the sea', 'Mountain breeze', 'B'),
('P1', 'Which equipment is NOT essential for paragliding?', 'Helmet', 'Reserve parachute', 'GPS device', 'Harness', 'C'),
('P1', 'What is the primary purpose of a variometer?', 'Measure speed', 'Indicate altitude changes', 'Show direction', 'Measure temperature', 'B'),
('P1', 'What should you do before every flight?', 'Check social media', 'Pre-flight safety check', 'Eat a heavy meal', 'Take a selfie', 'B'),
('P1', 'What is the correct term for the fabric wing of a paraglider?', 'Sail', 'Canopy', 'Sheet', 'Cover', 'B'),
('P1', 'Which wind condition is generally safest for beginner pilots?', 'Strong gusty winds', 'Light steady winds', 'No wind at all', 'Turbulent winds', 'B'),
('P1', 'What does "ground handling" mean?', 'Landing technique', 'Practicing wing control on the ground', 'Carrying the equipment', 'Packing the wing', 'B'),
('P1', 'What is the purpose of the reserve parachute?', 'Extra storage', 'Emergency backup', 'Decoration', 'Weather protection', 'B'),
('P1', 'What should be your first action if you experience a collapse?', 'Panic', 'Apply brake and weight shift', 'Close your eyes', 'Let go of controls', 'B'),
('P1', 'What is the recommended action in strong turbulence?', 'Speed up', 'Maintain control and find calmer air', 'Do aerobatics', 'Close the wing', 'B'),
('P1', 'Which weather condition is most dangerous for paragliding?', 'Clear skies', 'Thunderstorms', 'Light clouds', 'Morning dew', 'B'),
('P1', 'What does "aspect ratio" refer to in paragliding?', 'Pilot weight', 'Wing span to chord ratio', 'Flight duration', 'Altitude range', 'B'),
('P1', 'What is the primary function of the harness?', 'Storage', 'Connect pilot to wing', 'Weather protection', 'Communication', 'B'),
('P1', 'When should you NOT fly?', 'In the morning', 'During thunderstorms', 'With friends', 'On weekends', 'B');

-- Insert sample test questions for P2 level
INSERT INTO test_questions (test_level, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
('P2', 'What is the glide ratio of a typical beginner paraglider?', '3:1', '6:1', '9:1', '12:1', 'C'),
('P2', 'What causes a "frontal collapse"?', 'Too much brake', 'Sudden decrease in angle of attack', 'Flying too slow', 'Heavy landing', 'B'),
('P2', 'What is "ridge soaring"?', 'Flying in valleys', 'Using wind deflected upward by terrain', 'Flying at high altitude', 'Thermal flying', 'B'),
('P2', 'What is the purpose of the speed bar?', 'Increase speed', 'Decrease speed', 'Turn faster', 'Climb higher', 'A'),
('P2', 'What does "active flying" mean?', 'Doing aerobatics', 'Constantly adjusting controls for stability', 'Flying fast', 'Competitive flying', 'B'),
('P2', 'What is a "cravat"?', 'A type of harness', 'Wing tip caught in lines', 'Landing technique', 'Weather condition', 'B'),
('P2', 'What is the recommended recovery technique for a spiral dive?', 'Pull both brakes hard', 'Release outer brake and weight shift', 'Speed up', 'Deploy reserve', 'B'),
('P2', 'What is "wind gradient"?', 'Wind direction change', 'Wind speed increase with altitude', 'Wind temperature', 'Wind pressure', 'B'),
('P2', 'What is the minimum safe altitude for practicing maneuvers?', '50 meters', '100 meters', '300 meters', '1000 meters', 'D'),
('P2', 'What causes "rotor turbulence"?', 'Thermal activity', 'Wind flowing over obstacles', 'Rain', 'High altitude', 'B'),
('P2', 'What is "big ears" technique used for?', 'Increase speed', 'Rapid descent', 'Better hearing', 'Turning', 'B'),
('P2', 'What is the purpose of trim tabs?', 'Adjust wing angle', 'Store equipment', 'Measure wind', 'Communication', 'A'),
('P2', 'What is "pendulum effect"?', 'Swinging motion after pitch', 'Type of landing', 'Wind condition', 'Thermal indicator', 'A'),
('P2', 'What should you do if you encounter sink?', 'Pull full brakes', 'Speed up and find lift', 'Land immediately', 'Deploy reserve', 'B'),
('P2', 'What is the purpose of wingtip steering?', 'Emergency control', 'Fine directional control', 'Speed control', 'Altitude control', 'B');

-- Insert sample test questions for P3 level
INSERT INTO test_questions (test_level, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
('P3', 'What is the typical sink rate during a spiral dive?', '2 m/s', '5 m/s', '10 m/s', '20 m/s', 'C'),
('P3', 'What is "dynamic soaring"?', 'Using thermals', 'Using wind shear for energy', 'Fast flying', 'Acrobatic flying', 'B'),
('P3', 'What is the recommended action for a full stall?', 'Pull more brake', 'Release brakes symmetrically', 'Turn hard', 'Deploy reserve immediately', 'B'),
('P3', 'What is "convergence" in meteorology?', 'Air masses meeting', 'Air temperature', 'Wind speed', 'Cloud formation', 'A'),
('P3', 'What is the purpose of accelerated flight?', 'Show off', 'Increase penetration in headwind', 'Save fuel', 'Better visibility', 'B'),
('P3', 'What is a "SAT" maneuver?', 'Safety test', 'Spiral Asymmetric Turn', 'Slow altitude technique', 'Standard approach turn', 'B'),
('P3', 'What causes "deep stall"?', 'Too much speed', 'Excessive brake application', 'Wind shear', 'Equipment failure', 'B'),
('P3', 'What is the purpose of an SIV course?', 'Speed training', 'Simulation of Incidents in Flight', 'Social flying', 'Site inspection', 'B'),
('P3', 'What is "cloud suck"?', 'Cloud photography', 'Strong updraft pulling into cloud', 'Cloud formation', 'Weather prediction', 'B'),
('P3', 'What is the minimum altitude for reserve deployment?', '20 meters', '50 meters', '100 meters', '200 meters', 'C'),
('P3', 'What is "asymmetric collapse"?', 'Both sides collapse', 'One side of wing collapses', 'Full wing collapse', 'Tip collapse', 'B'),
('P3', 'What is the purpose of "B-line stall"?', 'Emergency descent', 'Speed increase', 'Better glide', 'Thermal centering', 'A'),
('P3', 'What is "venturi effect" in paragliding?', 'Wind acceleration through narrow spaces', 'Thermal formation', 'Wing design', 'Landing technique', 'A'),
('P3', 'What is the recommended action in a cascade of collapses?', 'Keep trying to recover', 'Deploy reserve parachute', 'Speed up', 'Turn away', 'B'),
('P3', 'What is "inversion layer"?', 'Temperature increases with altitude', 'Wind reversal', 'Cloud type', 'Landing zone', 'A');

-- Insert sample test questions for P4 level
INSERT INTO test_questions (test_level, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
('P4', 'What is the typical L/D ratio of a competition wing?', '6:1', '8:1', '10:1', '12:1', 'C'),
('P4', 'What is "McCready theory"?', 'Weather prediction', 'Optimal speed to fly in varying conditions', 'Wing design principle', 'Safety protocol', 'B'),
('P4', 'What is the purpose of "shark nose" design?', 'Aesthetics', 'Improved collapse resistance', 'Speed increase', 'Better landing', 'B'),
('P4', 'What is "XC flying"?', 'Extreme conditions', 'Cross-country distance flying', 'Acrobatic flying', 'Competition format', 'B'),
('P4', 'What is the function of mini-ribs?', 'Decoration', 'Improve aerodynamic efficiency', 'Reduce weight', 'Increase stability', 'B'),
('P4', 'What is "optimized angle of attack"?', 'Best climb rate', 'Best glide ratio', 'Fastest speed', 'Safest angle', 'B'),
('P4', 'What is the purpose of "3-liner" configuration?', 'Simplicity', 'Reduced drag and better performance', 'Easier packing', 'Lower cost', 'B'),
('P4', 'What is "task optimization" in competitions?', 'Equipment setup', 'Route planning for best speed', 'Weather analysis', 'Team coordination', 'B'),
('P4', 'What is "final glide"?', 'Last landing', 'Calculated glide to goal', 'Emergency descent', 'Competition finish', 'B'),
('P4', 'What is the purpose of "ballast"?', 'Decoration', 'Increase wing loading for better penetration', 'Safety backup', 'Equipment storage', 'B'),
('P4', 'What is "optimal cruise speed"?', 'Fastest speed', 'Speed for best distance in given conditions', 'Slowest safe speed', 'Competition speed', 'B'),
('P4', 'What is "lift distribution" in wing design?', 'Weight placement', 'How lift varies across span', 'Thermal strength', 'Pilot position', 'B'),
('P4', 'What is the purpose of "reflex profile"?', 'Better visibility', 'Improved stability and collapse resistance', 'Faster speed', 'Easier turning', 'B'),
('P4', 'What is "polar curve"?', 'Flight path', 'Graph of sink rate vs airspeed', 'Turn radius', 'Thermal pattern', 'B'),
('P4', 'What is "optimal load factor" in turns?', '1G', '1.5G', '2G', '3G', 'B');

-- Grant privileges
GRANT ALL PRIVILEGES ON pai_db.* TO 'pai_user'@'%';
FLUSH PRIVILEGES;
