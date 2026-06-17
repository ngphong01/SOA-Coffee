-- =====================================================
-- INVENTORY SERVICE DATABASE
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE inventory_db;

-- 1. INVENTORY
CREATE TABLE IF NOT EXISTS
    inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL UNIQUE,
        quantity_in_stock DECIMAL(12, 3) DEFAULT 0,
        quantity_reserved DECIMAL(12, 3) DEFAULT 0,
        quantity_available DECIMAL(12, 3) GENERATED ALWAYS AS (quantity_in_stock - quantity_reserved) STORED,
        min_stock_level DECIMAL(12, 3) DEFAULT 10,
        max_stock_level DECIMAL(12, 3) DEFAULT 1000,
        reorder_point DECIMAL(12, 3) DEFAULT 20,
        location VARCHAR(100),
        last_restock_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_inv_low_stock (quantity_available, reorder_point),
        CONSTRAINT chk_inv_stock CHECK (
            quantity_in_stock >= 0
            AND quantity_reserved >= 0
        )
    ) ENGINE = InnoDB;

-- 2. INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS
    inventory_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT(UUID()),
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        type ENUM(
            'import',
            'export',
            'adjustment',
            'sale',
            'return'
        ) NOT NULL,
        quantity DECIMAL(12, 3) NOT NULL,
        quantity_before DECIMAL(12, 3),
        quantity_after DECIMAL(12, 3),
        unit_cost DECIMAL(12, 2) DEFAULT 0,
        total_cost DECIMAL(15, 2) DEFAULT 0,
        reference_no VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_invtx_uuid (uuid),
        INDEX idx_invtx_product_type (product_id, type),
        INDEX idx_invtx_created (created_at),
        INDEX idx_invtx_user (user_id),
        CONSTRAINT fk_invtx_product FOREIGN KEY (product_id) REFERENCES inventory (id)
    ) ENGINE = InnoDB;