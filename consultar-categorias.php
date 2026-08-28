<?php
$host     = 'bcmwiwcu7wsokpucujyr-mysql.services.clever-cloud.com';
$dbname   = 'bcmwiwcu7wsokpucujyr';
$user     = 'u31nuek9ybom1mpt';
$password = 'Xu0NAevFvqrjmAkK9204';

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};port=3306;charset=utf8mb4",
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    foreach ($pdo->query('SELECT id, nombre, categoria, imagen FROM productos ORDER BY id') as $producto) {
        echo $producto['id'] . ' | ' . $producto['nombre'] . ' | ' . $producto['categoria'] . ' | ' . $producto['imagen'] . PHP_EOL;
    }
} catch (PDOException $e) {
    die("Error en la conexión: " . $e->getMessage());
}
