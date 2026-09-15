CREATE TABLE IF NOT EXISTS insurance_booking_config (
  id INT PRIMARY KEY DEFAULT 1,
  direct_booking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  consecutive_failures INT NOT NULL DEFAULT 0,
  auto_disabled_until DATETIME NULL,
  last_recovery_check_at DATETIME NULL,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO insurance_booking_config (id, direct_booking_enabled) VALUES (1, TRUE);

CREATE TABLE IF NOT EXISTS insurance_booking_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type ENUM('auto_disabled', 'auto_recovered', 'admin_enabled', 'admin_disabled') NOT NULL,
  actor_id INT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES members(id) ON DELETE SET NULL
);
