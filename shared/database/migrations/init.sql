-- =====================================================
-- COFFEE SHOP DATABASE - PRODUCTION READY
-- MySQL 8.0.13+ required
-- =====================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET
  FOREIGN_KEY_CHECKS = 0;

SET
  SQL_MODE = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS coffee_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE coffee_shop_db;

-- =====================================================
-- AUTO-MIGRATION: Add missing columns from older schemas
-- Safe to run repeatedly — skips if already exists
-- =====================================================
SET
  @exist := (
    SELECT
      COUNT(*)
    FROM
      INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = 'coffee_shop_db'
      AND TABLE_NAME = 'roles'
      AND COLUMN_NAME = 'description'
  );

SET
  @sqlstmt := IF(
    @exist = 0,
    'ALTER TABLE roles ADD COLUMN description VARCHAR(255) AFTER display_name',
    'SELECT ''roles.description already exists'''
  );

PREPARE stmt
FROM
  @sqlstmt;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

SET
  @exist := (
    SELECT
      COUNT(*)
    FROM
      INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = 'coffee_shop_db'
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'avatar_url'
  );

SET
  @sqlstmt := IF(
    @exist = 0,
    'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) AFTER phone',
    'SELECT ''users.avatar_url already exists'''
  );

PREPARE stmt
FROM
  @sqlstmt;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

SET
  @exist := (
    SELECT
      COUNT(*)
    FROM
      INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = 'coffee_shop_db'
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'deleted_at'
  );

SET
  @sqlstmt := IF(
    @exist = 0,
    'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL AFTER last_login_at',
    'SELECT ''users.deleted_at already exists'''
  );

PREPARE stmt
FROM
  @sqlstmt;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

SET
  @exist := (
    SELECT
      COUNT(*)
    FROM
      INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = 'coffee_shop_db'
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'is_verified'
  );

SET
  @sqlstmt := IF(
    @exist = 0,
    'ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER is_active',
    'SELECT ''users.is_verified already exists'''
  );

PREPARE stmt
FROM
  @sqlstmt;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;

-- =====================================================
-- 1. ROLES
-- =====================================================
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

-- =====================================================
-- 2. USERS
-- =====================================================
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

-- =====================================================
-- 3. CUSTOMERS
-- =====================================================
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

-- =====================================================
-- 4. CATEGORIES
-- =====================================================
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

-- =====================================================
-- 5. PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS
  products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL DEFAULT(UUID()),
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    barcode VARCHAR(50),
    description TEXT,
    category_id INT,
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
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT chk_prod_price CHECK (
      price >= 0
      AND cost_price >= 0
    )
  ) ENGINE = InnoDB;

-- =====================================================
-- 6. INVENTORY
-- =====================================================
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
    CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT chk_inv_stock CHECK (
      quantity_in_stock >= 0
      AND quantity_reserved >= 0
    )
  ) ENGINE = InnoDB;

-- =====================================================
-- 7. INVENTORY TRANSACTIONS
-- =====================================================
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
    CONSTRAINT fk_invtx_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_invtx_user FOREIGN KEY (user_id) REFERENCES users (id)
  ) ENGINE = InnoDB;

-- =====================================================
-- 9. ORDERS
-- =====================================================
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
    CONSTRAINT fk_ord_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
    CONSTRAINT fk_ord_cashier FOREIGN KEY (cashier_id) REFERENCES users (id),
    CONSTRAINT chk_ord_amounts CHECK (
      subtotal >= 0
      AND discount_amount >= 0
      AND tax_amount >= 0
      AND total_amount >= 0
    )
  ) ENGINE = InnoDB;

-- =====================================================
-- 10. ORDER ITEMS
-- =====================================================
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
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT chk_oi_qty CHECK (
      quantity > 0
      AND unit_price >= 0
    )
  ) ENGINE = InnoDB;

-- =====================================================
-- 11. PAYMENTS
-- =====================================================
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
    CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_pay_refunder FOREIGN KEY (refunded_by) REFERENCES users (id),
    CONSTRAINT chk_pay_amount CHECK (
      amount >= 0
      AND refund_amount >= 0
    )
  ) ENGINE = InnoDB;

-- =====================================================
-- 12. EMPLOYEES
-- =====================================================
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
    CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_emp_salary CHECK (
      salary IS NULL
      OR salary >= 0
    )
  ) ENGINE = InnoDB;

-- =====================================================
-- 12. AUDIT LOGS
-- =====================================================
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

-- =====================================================
-- SEED DATA — QUÁN CÀ PHÊ
-- =====================================================
-- ---- CATEGORIES ----
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

-- ---- PRODUCTS ----
INSERT IGNORE INTO
  products (
    name,
    sku,
    category_id,
    price,
    cost_price,
    unit,
    description,
    thumbnail_url
  )
VALUES
  (
    'Cà Phê Sữa Đá',
    'CF-SUA-DA',
    1,
    35000,
    12000,
    'cup',
    'Cà phê pha phin đậm đà với sữa đặc, đá viên',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop'
  ),
  (
    'Bạc Xỉu',
    'CF-BAC-XIU',
    1,
    38000,
    14000,
    'cup',
    'Cà phê ít đắng nhiều sữa, phù hợp người mới uống',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop'
  ),
  (
    'Cà Phê Đen Đá',
    'CF-DEN-DA',
    1,
    25000,
    8000,
    'cup',
    'Cà phê đen nguyên chất, đậm vị robusta Việt Nam',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop'
  ),
  (
    'Cappuccino',
    'CF-CAP',
    1,
    45000,
    18000,
    'cup',
    'Espresso với sữa nóng và bọt sữa mịn màng',
    'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=400&fit=crop'
  ),
  (
    'Latte Nóng',
    'CF-LATTE',
    1,
    42000,
    16000,
    'cup',
    'Espresso hòa quyện cùng sữa tươi nóng hổi',
    'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=400&fit=crop'
  ),
  (
    'Trà Đào Cam Sả',
    'TEA-DAO',
    2,
    35000,
    10000,
    'cup',
    'Trà đào tươi mát với cam và sả thơm lừng',
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'
  ),
  (
    'Trà Sữa Trân Châu',
    'TS-TC',
    2,
    38000,
    12000,
    'cup',
    'Trà sữa Đài Loan thơm ngon với trân châu đen',
    'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=400&fit=crop'
  ),
  (
    'Trà Vải Thiều',
    'TEA-VAI',
    2,
    32000,
    9000,
    'cup',
    'Trà xanh thanh mát kết hợp vải thiều ngọt dịu',
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop'
  ),
  (
    'Sinh Tố Bơ',
    'ST-BO',
    3,
    40000,
    15000,
    'cup',
    'Sinh tố bơ sánh mịn, béo ngậy với sữa đặc',
    'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=400&fit=crop'
  ),
  (
    'Nước Ép Cam',
    'NE-CAM',
    3,
    30000,
    10000,
    'cup',
    'Nước cam tươi vắt nguyên chất 100%',
    'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&h=400&fit=crop'
  ),
  (
    'Sinh Tố Dâu',
    'ST-DAU',
    3,
    38000,
    14000,
    'cup',
    'Sinh tố dâu tây tươi mát, bổ sung vitamin C',
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop'
  ),
  (
    'Bánh Mì Que',
    'BM-QUE',
    4,
    15000,
    5000,
    'piece',
    'Bánh mì que giòn tan chấm sữa đặc',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop'
  ),
  (
    'Bánh Flan',
    'BM-FLAN',
    4,
    18000,
    6000,
    'piece',
    'Bánh flan caramel mềm mịn, béo thơm',
    'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&h=400&fit=crop'
  ),
  (
    'Kem Dừa',
    'KEM-DUA',
    5,
    25000,
    8000,
    'cup',
    'Kem dừa tươi mát lạnh, vị dừa đậm đà',
    'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=400&fit=crop'
  ),
  (
    'Đá Xay Dâu',
    'DX-DAU',
    5,
    35000,
    12000,
    'cup',
    'Đá xay dâu tây mát lạnh, topping kem tươi',
    'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=400&fit=crop'
  );

-- ---- INVENTORY (auto-seed) ----
INSERT IGNORE INTO
  inventory (
    product_id,
    quantity_in_stock,
    min_stock_level,
    reorder_point
  )
SELECT
  id,
  FLOOR(20 + RAND() * 80),
  10,
  5
FROM
  products;

-- ---- CUSTOMERS ----
INSERT IGNORE INTO
  customers (
    full_name,
    email,
    phone,
    gender,
    address,
    loyalty_points,
    total_spent,
    total_orders,
    segment
  )
VALUES
  (
    'Nguyễn Thị Minh Anh',
    'minhanh.nguyen@gmail.com',
    '+84901234567',
    'female',
    '15 Nguyễn Huệ, Quận 1, TP.HCM',
    1250,
    4500000,
    28,
    'vip'
  ),
  (
    'Trần Văn Hùng',
    'hung.tran@yahoo.com',
    '+84902345678',
    'male',
    '42 Lê Lợi, Quận 5, TP.HCM',
    320,
    1200000,
    8,
    'regular'
  ),
  (
    'Lê Thị Hương',
    'huong.le@outlook.com',
    '+84903456789',
    'female',
    '88 Trần Hưng Đạo, Quận 3, TP.HCM',
    890,
    3200000,
    15,
    'vip'
  ),
  (
    'Phạm Văn Đức',
    'duc.pham@gmail.com',
    '+84904567890',
    'male',
    '12 Hai Bà Trưng, Quận 10, TP.HCM',
    150,
    450000,
    3,
    'new'
  ),
  (
    'Hoàng Thị Lan',
    'lan.hoang@hotmail.com',
    '+84905678901',
    'female',
    '56 Cách Mạng Tháng 8, Tân Bình, TP.HCM',
    550,
    2100000,
    12,
    'regular'
  ),
  (
    'Võ Minh Tuấn',
    'tuan.vo@gmail.com',
    '+84906789012',
    'male',
    '200 Lý Tự Trọng, Quận 1, TP.HCM',
    720,
    2800000,
    18,
    'vip'
  ),
  (
    'Đặng Thị Mai',
    'mai.dang@gmail.com',
    '+84907890123',
    'female',
    '33 Phan Đình Phùng, Phú Nhuận, TP.HCM',
    80,
    280000,
    2,
    'new'
  ),
  (
    'Bùi Thanh Sơn',
    'son.bui@yahoo.com',
    '+84908901234',
    'male',
    '78 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    410,
    1600000,
    9,
    'regular'
  ),
  (
    'Ngô Thị Thu Hà',
    'ha.ngo@gmail.com',
    '+84909012345',
    'female',
    '145 Võ Văn Tần, Quận 1, TP.HCM',
    980,
    3800000,
    22,
    'vip'
  ),
  (
    'Đỗ Hữu Phúc',
    'phuc.do@outlook.com',
    '+84909123456',
    'male',
    '25 Nguyễn Thái Học, Quận 1, TP.HCM',
    60,
    180000,
    1,
    'new'
  ),
  (
    'Trịnh Thị Kim Ngân',
    'ngan.trinh@gmail.com',
    '+84909234567',
    'female',
    '67 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    350,
    1400000,
    7,
    'regular'
  ),
  (
    'Lý Văn Nam',
    'nam.ly@hotmail.com',
    '+84909345678',
    'male',
    '90 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
    0,
    0,
    0,
    'new'
  );

-- ---- USERS (password: "password123" — bcrypt hash) ----
INSERT IGNORE INTO
  users (
    email,
    password_hash,
    full_name,
    phone,
    role_id,
    is_active,
    is_verified
  )
VALUES
  (
    'minh.tran@coffeeshop.vn',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Trần Tuấn Minh',
    '+84912345678',
    2,
    1,
    1
  ),
  (
    'thuy.le@coffeeshop.vn',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Lê Thị Thúy',
    '+84923456789',
    3,
    1,
    1
  ),
  (
    'nam.pham@coffeeshop.vn',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Phạm Hoài Nam',
    '+84934567890',
    3,
    1,
    1
  ),
  (
    'hoa.nguyen@coffeeshop.vn',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Nguyễn Thị Hoa',
    '+84945678901',
    4,
    1,
    1
  ),
  (
    'tai.vo@coffeeshop.vn',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Võ Đức Tài',
    '+84956789012',
    4,
    1,
    1
  );

-- ---- EMPLOYEES ----
INSERT IGNORE INTO
  employees (
    user_id,
    employee_code,
    position,
    department,
    hire_date,
    salary,
    status
  )
SELECT
  u.id,
  CONCAT(
    'NV-',
    LPAD(
      ROW_NUMBER() OVER (
        ORDER BY
          u.id
      ),
      4,
      '0'
    )
  ),
  CASE
    WHEN u.email LIKE '%minh%' THEN 'Quản lý cửa hàng'
    WHEN u.email LIKE '%thuy%' THEN 'Thu ngân trưởng'
    WHEN u.email LIKE '%nam%' THEN 'Thu ngân'
    WHEN u.email LIKE '%hoa%' THEN 'Pha chế chính'
    ELSE 'Pha chế'
  END,
  CASE
    WHEN u.email LIKE '%minh%' THEN 'Quản lý'
    WHEN u.email IN ('thuy.le@coffeeshop.vn', 'nam.pham@coffeeshop.vn') THEN 'Thu ngân'
    ELSE 'Pha chế'
  END,
  '2024-01-15',
  CASE
    WHEN u.email LIKE '%minh%' THEN 15000000
    WHEN u.email LIKE '%thuy%' THEN 10000000
    WHEN u.email LIKE '%nam%' THEN 8500000
    WHEN u.email LIKE '%hoa%' THEN 9000000
    ELSE 8000000
  END,
  'active'
FROM
  users u
WHERE
  u.email LIKE '%@coffeeshop.vn';

SET
  FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- DONE ✅
-- =====================================================
SELECT
  (
    SELECT
      COUNT(*)
    FROM
      roles
  ) AS roles,
  (
    SELECT
      COUNT(*)
    FROM
      users
  ) AS users,
  (
    SELECT
      COUNT(*)
    FROM
      employees
  ) AS employees,
  (
    SELECT
      COUNT(*)
    FROM
      customers
  ) AS customers,
  (
    SELECT
      COUNT(*)
    FROM
      categories
  ) AS categories,
  (
    SELECT
      COUNT(*)
    FROM
      products
  ) AS products,
  (
    SELECT
      COUNT(*)
    FROM
      inventory
  ) AS inventory;