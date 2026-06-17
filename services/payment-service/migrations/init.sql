-- =====================================================
-- PAYMENT SERVICE DATABASE
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS payment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE payment_db;

CREATE TABLE IF NOT EXISTS
    payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT(UUID()),
        order_id INT NOT NULL,
        transaction_id VARCHAR(100),
        method ENUM('cash', 'card', 'e_wallet', 'bank_transfer') NOT NULL,
        status ENUM(
            'pending',
            'completed',
            'failed',
            'refunded',
            'partial_refund'
        ) DEFAULT 'pending',
        amount DECIMAL(15, 2) NOT NULL,
        amount_tendered DECIMAL(15, 2),
        change_amount DECIMAL(15, 2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'VND',
        refund_amount DECIMAL(15, 2) DEFAULT 0,
        refund_reason TEXT,
        refunded_at TIMESTAMP NULL,
        refunded_by INT NULL,
        notes TEXT,
        processed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_pay_uuid (uuid),
        UNIQUE KEY uk_pay_txn (transaction_id),
        INDEX idx_pay_order_status (order_id, status),
        INDEX idx_pay_method (method),
        INDEX idx_pay_created (created_at),
        CONSTRAINT chk_pay_amount CHECK (
            amount >= 0
            AND refund_amount >= 0
        )
    ) ENGINE = InnoDB;