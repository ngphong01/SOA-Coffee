-- =====================================================
-- CATEGORY SERVICE DATABASE
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS category_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE category_db;

CREATE TABLE IF NOT EXISTS
    categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT(UUID()),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        parent_id INT NULL,
        color VARCHAR(7),
        image_url VARCHAR(500),
        sort_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_cat_uuid (uuid),
        INDEX idx_cat_parent (parent_id),
        INDEX idx_cat_active (is_active),
        CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL
    ) ENGINE = InnoDB;

-- SEED: Categories
INSERT IGNORE INTO
    categories (name, slug, description, color)
VALUES
    (
        'Cà Phê Việt',
        'ca-phe-viet',
        'Cà phê pha máy, phin truyền thống',
        '#6F4E37'
    ),
    (
        'Trà & Trà Sữa',
        'tra-tra-sua',
        'Trà trái cây, trà sữa trân châu',
        '#4CAF50'
    ),
    (
        'Sinh Tố & Nước Ép',
        'sinh-to-nuoc-ep',
        'Sinh tố tươi, nước ép trái cây',
        '#FF9800'
    ),
    (
        'Bánh & Ăn Nhẹ',
        'banh-an-nhe',
        'Bánh ngọt, bánh mì, snack',
        '#E91E63'
    ),
    (
        'Đá Xay & Kem',
        'da-xay-kem',
        'Đá xay, kem tươi các loại',
        '#2196F3'
    );