-- =====================================================
-- AUTH SERVICE DATABASE
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE auth_db;

-- 1. ROLES
CREATE TABLE IF NOT EXISTS
    roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE = InnoDB;

INSERT IGNORE INTO
    roles (id, name, display_name, description)
VALUES
    (
        1,
        'super_admin',
        'Super Admin',
        'Toàn quyền hệ thống'
    ),
    (2, 'admin', 'Administrator', 'Quản trị viên'),
    (3, 'manager', 'Manager', 'Quản lý cửa hàng'),
    (4, 'cashier', 'Cashier', 'Thu ngân'),
    (5, 'barista', 'Barista', 'Pha chế'),
    (6, 'viewer', 'Viewer', 'Chỉ xem');

-- 2. USERS (auth-specific: credentials + role)
CREATE TABLE IF NOT EXISTS
    users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT(UUID()),
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(500),
        role_id INT NOT NULL DEFAULT 4,
        is_active TINYINT(1) DEFAULT 1,
        is_verified TINYINT(1) DEFAULT 0,
        last_login_at TIMESTAMP NULL,
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_users_uuid (uuid),
        UNIQUE KEY uk_users_email_deleted (email, deleted_at),
        INDEX idx_users_role (role_id),
        INDEX idx_users_active (is_active, deleted_at),
        CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
    ) ENGINE = InnoDB;

-- 3. REFRESH TOKENS
CREATE TABLE IF NOT EXISTS
    refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rt_user (user_id),
        INDEX idx_rt_token (token),
        CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE = InnoDB;

-- 4. AUDIT LOGS (global)
CREATE TABLE IF NOT EXISTS
    audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT(UUID()),
        user_id INT NULL,
        action VARCHAR(200) NOT NULL,
        module VARCHAR(100),
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        old_values JSON,
        new_values JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status ENUM('success', 'failure') DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_user_date (user_id, created_at),
        INDEX idx_audit_entity (entity_type, entity_id),
        INDEX idx_audit_action (action),
        INDEX idx_audit_created (created_at),
        CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;