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
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'mensaje' => 'No se pudo conectar con MySQL.']);
    exit;
}

$entrada = json_decode(file_get_contents('php://input'), true) ?? [];
$metodo = $_SERVER['REQUEST_METHOD'];
$usuarioId = filter_var($entrada['usuario_id'] ?? $_GET['usuario_id'] ?? null, FILTER_VALIDATE_INT);

if (!$usuarioId) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'mensaje' => 'Usuario no válido.']);
    exit;
}

if ($metodo === 'GET') {
    $consulta = $pdo->prepare(
        'SELECT p.id, p.estado, p.subtotal, p.envio, p.total, p.creado_en, pg.proveedor
         FROM pedidos p LEFT JOIN pagos pg ON pg.pedido_id = p.id
         WHERE p.usuario_id = ? ORDER BY p.creado_en DESC'
    );
    $consulta->execute([$usuarioId]);
    $pedidos = $consulta->fetchAll();

    foreach ($pedidos as &$pedido) {
        $pedido['id'] = (int) $pedido['id'];
        $pedido['total'] = (float) $pedido['total'];
        $pedido['fecha'] = date('d/m/Y H:i', strtotime($pedido['creado_en']));
        $detalle = $pdo->prepare('SELECT nombre_producto AS nombre, precio_unitario AS precio, cantidad, subtotal FROM detalle_pedido WHERE pedido_id = ?');
        $detalle->execute([$pedido['id']]);
        $pedido['items'] = $detalle->fetchAll();
        foreach ($pedido['items'] as &$item) {
            $item['precio'] = (float) $item['precio'];
            $item['cantidad'] = (int) $item['cantidad'];
            $item['subtotal'] = (float) $item['subtotal'];
        }
    }
    echo json_encode(['ok' => true, 'pedidos' => $pedidos]);
    exit;
}

if ($metodo !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'mensaje' => 'Método no permitido.']);
    exit;
}

$items = $entrada['items'] ?? [];
$proveedor = $entrada['proveedor'] ?? 'efectivo';
if (!in_array($proveedor, ['stripe', 'paypal', 'efectivo'], true) || !is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'mensaje' => 'El carrito o el método de pago no son válidos.']);
    exit;
}

try {
    $pdo->beginTransaction();
    $subtotal = 0.0;
    $detalles = [];
    $consultaProducto = $pdo->prepare('SELECT id, nombre, precio, cantidad FROM productos WHERE id = ? AND activo = 1 FOR UPDATE');

    foreach ($items as $item) {
        $productoId = filter_var($item['id'] ?? null, FILTER_VALIDATE_INT);
        $cantidad = filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT);
        if (!$productoId || !$cantidad || $cantidad < 1) {
            throw new RuntimeException('Hay un producto inválido en el carrito.');
        }

        $consultaProducto->execute([$productoId]);
        $producto = $consultaProducto->fetch();
        if (!$producto || (int) $producto['cantidad'] < $cantidad) {
            throw new RuntimeException('No hay existencias suficientes para uno de los productos.');
        }

        $precio = (float) $producto['precio'];
        $importe = $precio * $cantidad;
        $subtotal += $importe;
        $detalles[] = [$producto, $cantidad, $importe];
    }

    $consultaPedido = $pdo->prepare('INSERT INTO pedidos (usuario_id, subtotal, envio, total) VALUES (?, ?, 0, ?)');
    $consultaPedido->execute([$usuarioId, $subtotal, $subtotal]);
    $pedidoId = (int) $pdo->lastInsertId();
    $consultaDetalle = $pdo->prepare('INSERT INTO detalle_pedido (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal) VALUES (?, ?, ?, ?, ?, ?)');
    $consultaInventario = $pdo->prepare('UPDATE productos SET cantidad = cantidad - ? WHERE id = ?');

    foreach ($detalles as [$producto, $cantidad, $importe]) {
        $consultaDetalle->execute([$pedidoId, $producto['id'], $producto['nombre'], $producto['precio'], $cantidad, $importe]);
        $consultaInventario->execute([$cantidad, $producto['id']]);
    }

    $consultaPago = $pdo->prepare('INSERT INTO pagos (pedido_id, proveedor, estado, monto) VALUES (?, ?, \'pendiente\', ?)');
    $consultaPago->execute([$pedidoId, $proveedor, $subtotal]);
    $pdo->commit();
    echo json_encode(['ok' => true, 'pedido_id' => $pedidoId, 'total' => $subtotal, 'mensaje' => 'Pedido registrado correctamente.']);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(['ok' => false, 'mensaje' => $error->getMessage()]);
}
