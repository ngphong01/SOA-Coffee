-- =====================================================
-- ANALYTICS SERVICE DATABASE (read-optimized)
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS analytics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE analytics_db;

-- Materialized daily sales summary
CREATE TABLE IF NOT EXISTS
    daily_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_date DATE NOT NULL UNIQUE,
        total_orders INT DEFAULT 0,
        total_revenue DECIMAL(15, 2) DEFAULT 0,
        total_discount DECIMAL(15, 2) DEFAULT 0,
        total_tax DECIMAL(15, 2) DEFAULT 0,
        avg_order_value DECIMAL(12, 2) DEFAULT 0,
        cash_count INT DEFAULT 0,
        card_count INT DEFAULT 0,
        e_wallet_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB;

-- Top selling products
CREATE TABLE IF NOT EXISTS
    top_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_date DATE NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(200),
        total_quantity DECIMAL(12, 3) DEFAULT 0,
        total_revenue DECIMAL(15, 2) DEFAULT 0,
        rank_pos INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tp_date (report_date),
        INDEX idx_tp_rank (report_date, rank_pos)
    ) ENGINE = InnoDB;

-- Hourly traffic
CREATE TABLE IF NOT EXISTS
    hourly_traffic (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_date DATE NOT NULL,
        hour TINYINT NOT NULL,
        order_count INT DEFAULT 0,
        revenue DECIMAL(15, 2) DEFAULT 0,
        UNIQUE KEY uk_ht_date_hour (report_date, hour)
    ) ENGINE = InnoDB;