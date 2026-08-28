<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = new PDO(
        'mysql:host=sql306.infinityfree.com;dbname=if0_42773941_lunox;charset=utf8mb4',
        'if0_42773941',
        '5i5rrXGDG1Hl3',
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
