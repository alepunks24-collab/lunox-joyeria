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
$accion = $entrada['accion'] ?? '';

if ($accion === 'google') {
    $token = trim((string) ($entrada['credential'] ?? ''));
    $clientId = '456950544975-dgu7u1veh9135lvqlj0dsosvcvsvm60m.apps.googleusercontent.com';
    if ($token === '') {
        http_response_code(500);
        echo json_encode(['ok' => false, 'mensaje' => 'Falta configurar el Client ID de Google.']);
        exit;
    }

    $respuesta = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($token));
    $perfil = $respuesta ? json_decode($respuesta, true) : null;
    if (!is_array($perfil) || ($perfil['aud'] ?? '') !== $clientId || ($perfil['email_verified'] ?? '') !== 'true') {
        http_response_code(401);
        echo json_encode(['ok' => false, 'mensaje' => 'La cuenta de Google no pudo verificarse.']);
        exit;
    }

    try {
        $emailGoogle = strtolower(trim((string) ($perfil['email'] ?? '')));
        $nombreGoogle = trim((string) ($perfil['name'] ?? $emailGoogle));
        $consulta = $pdo->prepare('SELECT id, nombre, email FROM usuarios WHERE email = ? LIMIT 1');
        $consulta->execute([$emailGoogle]);
        $usuario = $consulta->fetch();

        if (!$usuario) {
            $hashAleatorio = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
            $consulta = $pdo->prepare('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)');
            $consulta->execute([$nombreGoogle, $emailGoogle, $hashAleatorio]);
            $usuario = ['id' => (int) $pdo->lastInsertId(), 'nombre' => $nombreGoogle, 'email' => $emailGoogle];
        }

        $usuario['id'] = (int) $usuario['id'];
        $usuario['historial'] = [];
        echo json_encode(['ok' => true, 'usuario' => $usuario, 'mensaje' => 'Sesión iniciada con Google.']);
        exit;
    } catch (Throwable $error) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'mensaje' => 'La base de datos no está preparada para cuentas de Google. Importa lunox.sql o agrega la columna google_id.']);
        exit;
    }
}

$email = strtolower(trim((string) ($entrada['email'] ?? '')));
$password = (string) ($entrada['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'mensaje' => 'Correo o contraseña no válidos.']);
    exit;
}

if ($accion === 'registrar') {
    $nombre = trim((string) ($entrada['nombre'] ?? ''));

    if (mb_strlen($nombre) < 2 || strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/\d/', $password)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'mensaje' => 'Revisa el nombre y los requisitos de la contraseña.']);
        exit;
    }

    $consulta = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
    $consulta->execute([$email]);
    if ($consulta->fetch()) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'mensaje' => 'Ya existe una cuenta con ese correo. Usa otro email.']);
        exit;
    }

    $consulta = $pdo->prepare('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)');
    $consulta->execute([$nombre, $email, password_hash($password, PASSWORD_DEFAULT)]);
    $usuario = ['id' => (int) $pdo->lastInsertId(), 'nombre' => $nombre, 'email' => $email, 'historial' => []];
    echo json_encode(['ok' => true, 'usuario' => $usuario, 'mensaje' => 'Cuenta creada correctamente.']);
    exit;
}

if ($accion === 'iniciar') {
    $consulta = $pdo->prepare('SELECT id, nombre, email, password_hash FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1');
    $consulta->execute([$email]);
    $usuario = $consulta->fetch();

    if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'mensaje' => 'Correo o contraseña incorrectos.']);
        exit;
    }

    unset($usuario['password_hash']);
    $usuario['id'] = (int) $usuario['id'];
    $usuario['historial'] = [];
    echo json_encode(['ok' => true, 'usuario' => $usuario, 'mensaje' => 'Sesión iniciada.']);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'mensaje' => 'Acción no válida.']);
