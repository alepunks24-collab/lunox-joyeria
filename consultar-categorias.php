<?php
$pdo = new PDO('mysql:host=sql306.infinityfree.com;dbname=if0_42773941_lunox;charset=utf8mb4', 'if0_42773941', '5i5rrXGDG1Hl3');
foreach ($pdo->query('SELECT id, nombre, categoria, imagen FROM productos ORDER BY id') as $producto) {
    echo $producto['id'] . ' | ' . $producto['nombre'] . ' | ' . $producto['categoria'] . ' | ' . $producto['imagen'] . PHP_EOL;
}
