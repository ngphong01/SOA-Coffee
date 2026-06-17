@echo off
echo ============================================
echo   Coffee Shop - List All Databases
echo ============================================
docker exec coffee_mysql mysql -u root -p%MYSQL_ROOT_PASSWORD% -e "SELECT SCHEMA_NAME AS 'Database' FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME LIKE '%_db' ORDER BY SCHEMA_NAME;"
