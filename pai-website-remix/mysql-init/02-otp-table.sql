-- OTP Verifications Table
-- This table stores one-time passwords for various purposes (password reset, email verification, etc.)

CREATE TABLE IF NOT EXISTS otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    purpose ENUM('password_reset', 'email_verification', 'two_factor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_purpose (email, purpose),
    INDEX idx_expires_at (expires_at),
    UNIQUE KEY unique_email_purpose (email, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grant privileges
GRANT ALL PRIVILEGES ON pai_db.* TO 'pai_user'@'%';
FLUSH PRIVILEGES;
