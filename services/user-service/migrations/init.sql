-- =====================================================
-- USER SERVICE DATABASE
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE user_db;

-- 1. CUSTOMERS
CREATE TABLE IF NOT EXISTS
    customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT(UUID()),
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        address TEXT,
        notes TEXT,
        loyalty_points INT DEFAULT 0,
        total_spent DECIMAL(15, 2) DEFAULT 0,
        total_orders INT DEFAULT 0,
        segment ENUM('new', 'regular', 'vip') DEFAULT 'new',
        is_active TINYINT(1) DEFAULT 1,
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_cust_uuid (uuid),
        UNIQUE KEY uk_cust_email_deleted (email, deleted_at),
        UNIQUE KEY uk_cust_phone_deleted (phone, deleted_at),
        INDEX idx_cust_segment (segment),
        INDEX idx_cust_active (is_active, deleted_at),
        CONSTRAINT chk_cust_points CHECK (loyalty_points >= 0),
        CONSTRAINT chk_cust_spent CHECK (total_spent >= 0)
    ) ENGINE = InnoDB;

-- 2. EMPLOYEES
CREATE TABLE IF NOT EXISTS
    employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL DEFAULT(UUID()),
        user_id INT NOT NULL UNIQUE,
        employee_code VARCHAR(20) NOT NULL UNIQUE,
        position VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        hire_date DATE NOT NULL,
        end_date DATE NULL,
        salary DECIMAL(15, 2),
        salary_type ENUM('hourly', 'monthly') DEFAULT 'monthly',
        bank_account VARCHAR(50),
        bank_name VARCHAR(100),
        emergency_contact_name VARCHAR(150),
        emergency_contact_phone VARCHAR(20),
        national_id VARCHAR(20),
        address TEXT,
        notes TEXT,
        status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_emp_uuid (uuid),
        INDEX idx_emp_status (status),
        INDEX idx_emp_dept (department),
        CONSTRAINT chk_emp_salary CHECK (
            salary IS NULL
            OR salary >= 0
        )
    ) ENGINE = InnoDB;