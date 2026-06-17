-- =====================================================
-- PRODUCT SERVICE DATABASE
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS product_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE product_db;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    barcode VARCHAR(50),
    description TEXT,
    category_id INT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(12, 2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs',
    thumbnail_url VARCHAR(500),
    is_active TINYINT(1) DEFAULT 1,
    total_sold INT DEFAULT 0,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_prod_uuid (uuid),
    UNIQUE KEY uk_prod_sku_deleted (sku, deleted_at),
    INDEX idx_prod_category (category_id),
    INDEX idx_prod_active (is_active, deleted_at),
    INDEX idx_prod_name (name),
    CONSTRAINT chk_prod_price CHECK (price >= 0 AND cost_price >= 0)
) ENGINE = InnoDB;

INSERT IGNORE INTO products (name, sku, category_id, price, cost_price, unit, description, thumbnail_url) VALUES
('Cà Phê Sữa Đá', 'CF-SUA-DA', 1, 35000, 12000, 'cup', 'Cà phê pha phin đậm đà với sữa đặc', 'https://picsum.photos/seed/cfsuada/400/400'),
('Bạc Xỉu', 'CF-BAC-XIU', 1, 38000, 14000, 'cup', 'Cà phê ít đắng nhiều sữa', 'https://picsum.photos/seed/bacxiu/400/400'),
('Cà Phê Đen Đá', 'CF-DEN-DA', 1, 25000, 8000, 'cup', 'Cà phê đen nguyên chất', 'https://picsum.photos/seed/cfden/400/400'),
('Cappuccino', 'CF-CAP', 1, 45000, 18000, 'cup', 'Espresso với sữa nóng và bọt sữa', 'https://picsum.photos/seed/capuchino/400/400'),
('Latte Nóng', 'CF-LATTE', 1, 42000, 16000, 'cup', 'Espresso hòa quyện cùng sữa tươi', 'https://picsum.photos/seed/latte/400/400'),
('Trà Đào Cam Sả', 'TEA-DAO', 2, 35000, 13000, 'cup', 'Trà đào thơm mát cùng cam sả', 'https://lofita.vn/wp-content/uploads/2026/01/tra20dao20cam20sa.jpg'),
('Trà Sữa Trân Châu', 'TEA-TS', 2, 38000, 14000, 'cup', 'Trà sữa đài loan trân châu đen', 'https://picsum.photos/seed/trasua/400/400'),
('Sinh Tố Bơ', 'ST-BO', 3, 40000, 15000, 'cup', 'Sinh tố bơ tươi béo ngậy', 'https://picsum.photos/seed/sinhtobo/400/400'),
('Nước Ép Cam', 'NE-CAM', 3, 35000, 12000, 'cup', 'Nước ép cam tươi nguyên chất', 'https://picsum.photos/seed/nuoccam/400/400'),
('Bánh Tiramisu', 'BANH-TIRA', 4, 45000, 18000, 'pcs', 'Bánh tiramisu Ý truyền thống', 'https://picsum.photos/seed/tiramisu/400/400'),
('Đá Xay Socola', 'DX-CHOCO', 5, 45000, 17000, 'cup', 'Đá xay socola kem tươi', 'https://mocgarden.com.vn/wp-content/uploads/2025/06/Socola-da-xay-2.png'),
('Kem Matcha', 'KEM-MATCHA', 5, 35000, 12000, 'pcs', 'Kem matcha Nhật Bản', 'https://picsum.photos/seed/matcha/400/400');
