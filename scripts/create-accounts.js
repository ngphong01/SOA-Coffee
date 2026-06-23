/**
 * Script sinh hash bcrypt và tạo SQL INSERT cho tài khoản admin/tester
 * Run: node scripts/create-accounts.js
 */
const bcrypt = require('bcryptjs');

const PASSWORD = 'Phong@2004';
const ROUNDS = 12;

const users = [
  { email: 'nguyentuan@dvp.com.vn',  full_name: 'Nguyễn Tuấn',   role_id: 2 }, // admin
  { email: 'phamhao@dvp.com.vn',     full_name: 'Phạm Hào',      role_id: 2 }, // admin
  { email: 'phunghung@tester.com.vn', full_name: 'Phùng Hưng',    role_id: 6 }, // viewer (kiểm thử)
];

async function main() {
  const hash = await bcrypt.hash(PASSWORD, ROUNDS);
  console.log(`-- ============================================`);
  console.log(`-- Password hash for: ${PASSWORD}`);
  console.log(`-- ============================================`);
  console.log();

  for (const u of users) {
    console.log(`-- ${u.full_name} (role_id=${u.role_id})`);
    console.log(`INSERT INTO auth_db.users (full_name, email, password_hash, role_id, is_active, is_verified)`);
    console.log(`VALUES ('${u.full_name}', '${u.email}', '${hash}', ${u.role_id}, 1, 1)`);
    console.log(`ON DUPLICATE KEY UPDATE password_hash = '${hash}', role_id = ${u.role_id}, is_active = 1, is_verified = 1;`);
    console.log();
  }

  console.log(`-- Verify:`);
  console.log(`-- SELECT id, full_name, email, role_id, is_active, is_verified FROM auth_db.users WHERE email IN ('nguyentuan@dvp.com.vn', 'phamhao@dvp.com.vn', 'phunghung@tester.com.vn');`);
}

main().catch(console.error);
