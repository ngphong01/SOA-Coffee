-- Grant coffee_user permissions on all microservice databases
-- This runs BEFORE the individual service init scripts (00- prefix)
GRANT ALL PRIVILEGES ON `auth_db`.* TO 'coffee_user' @'%';

GRANT ALL PRIVILEGES ON `user_db`.* TO 'coffee_user' @'%';

GRANT ALL PRIVILEGES ON `product_db`.* TO 'coffee_user' @'%';

GRANT ALL PRIVILEGES ON `category_db`.* TO 'coffee_user' @'%';

GRANT ALL PRIVILEGES ON `inventory_db`.* TO 'coffee_user' @'%';

GRANT ALL PRIVILEGES ON `order_db`.* TO 'coffee_user' @'%';

GRANT ALL PRIVILEGES ON `payment_db`.* TO 'coffee_user' @'%';

GRANT ALL PRIVILEGES ON `analytics_db`.* TO 'coffee_user' @'%';

FLUSH PRIVILEGES;