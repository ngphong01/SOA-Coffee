SELECT
    `value`,
    HEX(`value`)
FROM
    user_db.settings
WHERE
    `key` = 'general.shop_name';