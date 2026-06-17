-- =====================================================
-- ORDER SERVICE DATABASE
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE order_db;

-- 1. ORDERS (soft refs: customer_id, cashier_id point to auth_db.users)
CREATE TABLE IF NOT EXISTS
    orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT(UUID()),
        order_number VARCHAR(50) NOT NULL,
        customer_id INT NULL,
        cashier_id INT NOT NULL,
        type ENUM('dine_in', 'takeaway', 'delivery') DEFAULT 'dine_in',
        status ENUM(
            'pending',
            'processing',
            'completed',
            'cancelled',
            'refunded'
        ) DEFAULT 'pending',
        table_number VARCHAR(20),
        subtotal DECIMAL(15, 2) DEFAULT 0,
        discount_amount DECIMAL(15, 2) DEFAULT 0,
        tax_amount DECIMAL(15, 2) DEFAULT 0,
        total_amount DECIMAL(15, 2) DEFAULT 0,
        coupon_code VARCHAR(50),
        notes TEXT,
        cancel_reason TEXT,
        completed_at TIMESTAMP NULL,
        cancelled_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_ord_uuid (uuid),
        UNIQUE KEY uk_ord_number (order_number),
        INDEX idx_ord_customer (customer_id, created_at),
        INDEX idx_ord_cashier (cashier_id, created_at),
        INDEX idx_ord_status_created (status, created_at),
        INDEX idx_ord_created (created_at),
        CONSTRAINT chk_ord_amounts CHECK (
            subtotal >= 0
            AND discount_amount >= 0
            AND tax_amount >= 0
            AND total_amount >= 0
        )
    ) ENGINE = InnoDB;

-- 2. ORDER ITEMS
CREATE TABLE IF NOT EXISTS
    order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(200),
        product_sku VARCHAR(50),
        quantity DECIMAL(12, 3) NOT NULL,
        unit_price DECIMAL(12, 2) NOT NULL,
        discount_amount DECIMAL(12, 2) DEFAULT 0,
        total_price DECIMAL(15, 2) NOT NULL,
        notes TEXT,
        INDEX idx_oi_order (order_id),
        INDEX idx_oi_product (product_id),
        CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        CONSTRAINT chk_oi_qty CHECK (
            quantity > 0
            AND unit_price >= 0
        )
    ) ENGINE = InnoDB;