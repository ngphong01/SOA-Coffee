DROP TABLE IF EXISTS settings;

CREATE TABLE
    settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `key` VARCHAR(100) NOT NULL UNIQUE,
        `value` TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB;

INSERT INTO
    settings (`key`, `value`)
VALUES
    ('general.shop_name', 'Quán Cà Phê'),
    (
        'general.address',
        '123 Đường Cà Phê, Quận 1, TP.HCM'
    ),
    ('general.phone', '0901234567'),
    ('general.email', 'contact@coffeeshop.vn'),
    ('general.timezone', 'Asia/Ho_Chi_Minh'),
    ('general.currency', 'VND'),
    ('general.open_time', '07:00'),
    ('general.close_time', '22:00'),
    ('general.tax_rate', '10'),
    ('general.logo_url', '');