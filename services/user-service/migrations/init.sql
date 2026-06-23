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

-- =====================================================
-- SEED DATA
-- =====================================================
-- Sample Customers
INSERT IGNORE INTO
    customers (
        full_name,
        email,
        phone,
        date_of_birth,
        gender,
        address,
        loyalty_points,
        total_spent,
        total_orders,
        segment
    )
VALUES
    (
        'Nguyễn Văn An',
        'an.nguyen@gmail.com',
        '0901234567',
        '1990-03-15',
        'male',
        '12 Nguyễn Huệ, Q.1, TP.HCM',
        150,
        2500000,
        25,
        'vip'
    ),
    (
        'Trần Thị Bình',
        'binh.tran@gmail.com',
        '0912345678',
        '1995-07-22',
        'female',
        '45 Lê Lợi, Q.3, TP.HCM',
        80,
        1200000,
        12,
        'regular'
    ),
    (
        'Lê Văn Cường',
        'cuong.le@gmail.com',
        '0923456789',
        '1988-11-08',
        'male',
        '78 Trần Hưng Đạo, Q.5, TP.HCM',
        200,
        3500000,
        40,
        'vip'
    ),
    (
        'Phạm Thị Dung',
        'dung.pham@gmail.com',
        '0934567890',
        '2000-01-30',
        'female',
        '23 Hai Bà Trưng, Q.1, TP.HCM',
        30,
        450000,
        5,
        'new'
    ),
    (
        'Hoàng Văn Em',
        'em.hoang@gmail.com',
        '0945678901',
        '1993-05-18',
        'male',
        '56 CMT8, Q.10, TP.HCM',
        100,
        1800000,
        18,
        'regular'
    ),
    (
        'Ngô Thị Phương',
        'phuong.ngo@gmail.com',
        '0956789012',
        '1997-09-25',
        'female',
        '89 Võ Văn Tần, Q.3, TP.HCM',
        50,
        750000,
        8,
        'regular'
    ),
    (
        'Đỗ Văn Giang',
        'giang.do@gmail.com',
        '0967890123',
        '1985-12-10',
        'male',
        '34 Nguyễn Đình Chiểu, Q.1, TP.HCM',
        300,
        5000000,
        55,
        'vip'
    ),
    (
        'Vũ Thị Hương',
        'huong.vu@gmail.com',
        '0978901234',
        '2002-04-05',
        'female',
        '67 Phan Đình Phùng, Q.Phú Nhuận',
        10,
        150000,
        2,
        'new'
    );

-- Sample Employee (linked to admin user_id=1)
INSERT IGNORE INTO
    employees (
        user_id,
        employee_code,
        position,
        department,
        hire_date,
        salary,
        salary_type,
        status
    )
VALUES
    (
        1,
        'EMP001',
        'Quản lý cửa hàng',
        'Quản lý',
        '2024-01-15',
        15000000,
        'monthly',
        'active'
    );