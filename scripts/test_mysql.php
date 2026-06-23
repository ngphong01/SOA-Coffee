<?php
try {
    $pdo = new PDO("mysql:host=mysql;port=3306", "phong", "phong12345");
    echo "SUCCESS: Connected!\n";
    foreach($pdo->query("SHOW DATABASES") as $row) {
        echo "  - " . $row[0] . "\n";
    }
} catch(Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
