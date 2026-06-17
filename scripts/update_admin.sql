UPDATE auth_db.users
SET
    email = 'phong@triennguyen.com',
    password_hash = '$2a$10$SVU.WcjgtPYcCN7Noffk8.6hWBkkTKA4dVpNsmqgmKoSjsxhtmp9G'
WHERE
    id = 1;

SELECT
    email
FROM
    auth_db.users
WHERE
    id = 1;