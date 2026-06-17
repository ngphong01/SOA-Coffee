@echo off
echo ============================================
echo   Coffee Shop - Show Table Count per DB
echo ============================================
docker exec coffee_mysql mysql -u root -p%MYSQL_ROOT_PASSWORD% -e "SELECT TABLE_SCHEMA AS 'Database', COUNT(*) AS 'Tables' FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA LIKE '%_db' GROUP BY TABLE_SCHEMA ORDER BY TABLE_SCHEMA;"
echo.
echo ============================================
echo   Detail: Tables per Database
echo ============================================
for %%D in (auth_db user_db product_db category_db inventory_db order_db payment_db analytics_db) do (
    echo.
    echo --- %%D ---
    docker exec coffee_mysql mysql -u root -p%MYSQL_ROOT_PASSWORD% -e "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='%%D' ORDER BY TABLE_NAME;"
)
