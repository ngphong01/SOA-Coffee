-- =====================================================
-- ORDER SERVICE - VOUCHERS TABLE
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE order_db;

CREATE TABLE IF NOT EXISTS
    vouchers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        value DECIMAL(12, 2) NOT NULL DEFAULT 0,
        min_order_value DECIMAL(15, 2) DEFAULT 0,
        max_usage INT DEFAULT 100,
        used_count INT DEFAULT 0,
        expires_at DATE NULL,
        is_active TINYINT(1) DEFAULT 1,
        description VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_vc_code (code),
        INDEX idx_vc_active (is_active, expires_at),
        CONSTRAINT chk_vc_value CHECK (value > 0),
        CONSTRAINT chk_vc_max_usage CHECK (max_usage > 0)
    ) ENGINE = InnoDB;

INSERT IGNORE INTO
    vouchers (
        code,
        type,
        value,
        min_order_value,
        max_usage,
        expires_at,
        is_active,
        description
    )
VALUES
    (
        'COFFEE10',
        'percentage',
        10,
        50000,
        100,
        '2026-12-31',
        1,
        'Giảm 10% cho đơn từ 50K'
    ),
    (
        'WELCOME20',
        'percentage',
        20,
        100000,
        50,
        '2026-07-15',
        1,
        'Chào mừng giảm 20%'
    ),
    (
        'FREESHIP',
        'fixed',
        15000,
        0,
        200,
        '2026-08-01',
        1,
        'Miễn phí giao hàng'
    ),
    (
        'SUMMER50',
        'fixed',
        50000,
        200000,
        30,
        '2026-06-01',
        0,
        'Giảm 50K mùa hè - Đã hết'
    );