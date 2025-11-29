-- PAI Database Initialization Script
-- This script runs automatically when the MySQL container starts for the first time

-- Create tables for PAI website

-- Users/Members table
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    membership_type ENUM('basic', 'premium', 'instructor') DEFAULT 'basic',
    membership_status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    active_until DATE NULL,
    pilot_rating VARCHAR(50) DEFAULT 'P1',
    total_flights INT DEFAULT 0,
    total_flight_hours DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_membership_status (membership_status)
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

-- Insert sample data for flying sites
INSERT INTO flying_sites (name, location, state, description, difficulty_level, is_active) VALUES
('Bir Billing', 'Bir, Kangra', 'Himachal Pradesh', 'The Himalayan mecca for XC and soaring, with world-class conditions.', 'advanced', TRUE),
('Kamshet', 'Kamshet, Pune', 'Maharashtra', 'Training-friendly ridges with reliable winds near Pune and Mumbai.', 'beginner', TRUE),
('Nandi Hills', 'Nandi Hills, Chikkaballapur', 'Karnataka', 'Scenic morning flights and ridge soaring near Bengaluru.', 'intermediate', TRUE),
('Yelagiri', 'Yelagiri', 'Tamil Nadu', 'Beginner-friendly conditions and a vibrant local community.', 'beginner', TRUE);

-- Create demo users (password: 'password123' - bcrypt hashed)
-- Hash generated with: bcrypt.hash('password123', 10)
-- active_until dates set to 1 year from now
INSERT INTO members (email, password_hash, name, phone, membership_type, membership_status, active_until, pilot_rating, total_flights, total_flight_hours) VALUES
('admin@pai.org.in', '$2b$10$M7tjfHnU39uMsb9Bfwmwi.PT4JGhQbebg8cp7gCpBdZxikhVdpZgW', 'PAI Admin', '+91-9876543210', 'instructor', 'active', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Instructor', 250, 450.50),
('pilot@example.com', '$2b$10$M7tjfHnU39uMsb9Bfwmwi.PT4JGhQbebg8cp7gCpBdZxikhVdpZgW', 'John Pilot', '+91-9876543211', 'premium', 'active', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'P4', 85, 120.75),
('beginner@example.com', '$2b$10$M7tjfHnU39uMsb9Bfwmwi.PT4JGhQbebg8cp7gCpBdZxikhVdpZgW', 'Sarah Beginner', '+91-9876543212', 'basic', 'active', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'P2', 15, 22.50);

-- Grant privileges
GRANT ALL PRIVILEGES ON pai_db.* TO 'pai_user'@'%';
FLUSH PRIVILEGES;
