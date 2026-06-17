const mysql = require('mysql2/promise');
(async () => {
  const p = await mysql.createConnection({
    host: 'mysql', user: 'coffee_user', password: 'coffee_pass_2024',
    database: 'user_db', charset: 'utf8mb4'
  });
  await p.execute('DELETE FROM settings');
  await p.execute("INSERT INTO settings (`key`, `value`) VALUES ('general.shop_name', 'Quán Cà Phê')");
  await p.execute("INSERT INTO settings (`key`, `value`) VALUES ('general.address', '123 Đường Cà Phê, Quận 1, TP.HCM')");
  await p.execute("INSERT INTO settings (`key`, `value`) VALUES ('general.phone', '0901234567')");
  await p.execute("INSERT INTO settings (`key`, `value`) VALUES ('general.email', 'contact@coffeeshop.vn')");
  const [rows] = await p.query('SELECT * FROM settings');
  rows.forEach(r => console.log(r.key, '=', r.value));
  await p.end();
})();
