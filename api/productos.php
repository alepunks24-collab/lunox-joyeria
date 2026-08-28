<?php

declare(strict_types=1);
// andres se cago

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = new PDO(
        'mysql:host=bcmwiwcu7wsokpucujyr-mysql.services.clever-cloud.com;dbname=bcmwiwcu7wsokpucujyr;port=3306;charset=utf8mb4',
        'u31nuek9ybom1mpt',
        'Xu0NAevFvqrjmAkK9204',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $consulta = $pdo->query(
        'SELECT id, nombre, categoria, precio, imagen, insignia
        FROM productos WHERE activo = 1 ORDER BY id'
    );
    $productos = $consulta->fetchAll();

    foreach ($productos as &$producto) {
        $producto['id'] = (int) $producto['id'];
        $producto['precio'] = (float) $producto['precio'];
    }

    echo json_encode(['ok' => true, 'productos' => $productos]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'mensaje' => 'No se pudieron cargar los productos.']);
}
