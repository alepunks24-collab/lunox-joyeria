-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-08-2026 a las 21:03:41
-- Versión del servidor: 8.0.45
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `lunox`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_pedido`
--

CREATE TABLE `detalle_pedido` (
  `id` int UNSIGNED NOT NULL,
  `pedido_id` int UNSIGNED NOT NULL,
  `producto_id` int UNSIGNED DEFAULT NULL,
  `nombre_producto` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `cantidad` int UNSIGNED NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `detalle_pedido`
--

INSERT INTO `detalle_pedido` (`id`, `pedido_id`, `producto_id`, `nombre_producto`, `precio_unitario`, `cantidad`, `subtotal`) VALUES
(2, 2, 1, 'Pulsera Dorada', 350.00, 1, 350.00),
(3, 3, 1, 'Aritos de acero', 150.00, 3, 450.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `direcciones`
--

CREATE TABLE `direcciones` (
  `id` int UNSIGNED NOT NULL,
  `usuario_id` int UNSIGNED NOT NULL,
  `nombre_receptor` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciudad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `departamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `principal` tinyint(1) NOT NULL DEFAULT '0',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int UNSIGNED NOT NULL,
  `pedido_id` int UNSIGNED NOT NULL,
  `proveedor` enum('stripe','paypal','efectivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('pendiente','aprobado','rechazado','reembolsado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `referencia_externa` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `moneda` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HNL',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `pedido_id`, `proveedor`, `estado`, `referencia_externa`, `monto`, `moneda`, `creado_en`, `actualizado_en`) VALUES
(2, 2, 'efectivo', 'pendiente', NULL, 350.00, 'HNL', '2026-08-26 03:05:41', '2026-08-26 03:05:41'),
(3, 3, 'efectivo', 'pendiente', NULL, 450.00, 'HNL', '2026-08-28 15:53:38', '2026-08-28 15:53:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int UNSIGNED NOT NULL,
  `usuario_id` int UNSIGNED NOT NULL,
  `direccion_id` int UNSIGNED DEFAULT NULL,
  `estado` enum('pendiente','pagado','preparando','enviado','entregado','cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `subtotal` decimal(10,2) NOT NULL,
  `envio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `usuario_id`, `direccion_id`, `estado`, `subtotal`, `envio`, `total`, `creado_en`, `actualizado_en`) VALUES
(2, 11, NULL, 'pendiente', 350.00, 0.00, 350.00, '2026-08-26 03:05:41', '2026-08-26 03:05:41'),
(3, 12, NULL, 'pendiente', 450.00, 0.00, 450.00, '2026-08-28 15:53:38', '2026-08-28 15:53:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int UNSIGNED NOT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `precio` decimal(10,2) NOT NULL,
  `cantidad` int UNSIGNED NOT NULL DEFAULT '0',
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insignia` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `categoria`, `descripcion`, `precio`, `cantidad`, `imagen`, `insignia`, `activo`, `creado_en`, `actualizado_en`) VALUES
(1, 'Aritos de acero', 'Aretes', NULL, 150.00, 5, 'imagenes/1p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-28 15:53:38'),
(2, 'Aritos de acero', 'Aretes', NULL, 150.00, 10, 'imagenes/2p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 04:38:43'),
(3, 'Aritos de acero', 'Aretes', NULL, 150.00, 10, 'imagenes/3p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 06:29:41'),
(4, 'Aritos acero de flor ', 'Aretes', NULL, 150.00, 10, 'imagenes/4p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 06:30:46'),
(5, 'Aritos de acero', 'Aretes', NULL, 150.00, 10, 'imagenes/5p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 08:21:13'),
(6, 'Aritos de acero', 'Aretes', NULL, 150.00, 10, 'imagenes/6p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 07:42:17'),
(7, 'Aritos de cisne', 'Aretes', NULL, 150.00, 10, 'imagenes/7p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 07:43:39'),
(8, 'Aretes de acero, Blancos', 'Aretes', NULL, 150.00, 10, 'imagenes/8p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 07:44:30'),
(9, 'Dijes de acero', 'Collares', NULL, 90.00, 10, 'imagenes/9p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 08:09:25'),
(10, 'Aritos de acero', 'Aretes', NULL, 150.00, 10, 'imagenes/10p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 08:21:13'),
(11, 'Aritos de acero', 'Aretes', NULL, 150.00, 10, 'imagenes/11p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 08:21:13'),
(12, 'Aritos de tulipan, Acero', 'Aretes', NULL, 150.00, 10, 'imagenes/12p.jpeg', 'Nuevo', 1, '2026-08-23 23:04:55', '2026-08-26 08:02:44'),
(13, 'Collar con Dije de Cristal', 'Collares', NULL, 100.00, 10, 'imagenes/13.jpeg', 'Agotado', 1, '2026-08-23 23:04:55', '2026-08-26 07:59:27'),
(14, 'Anillo Plateado ', 'Anillos', NULL, 100.00, 10, 'imagenes/14.jpeg', 'Agotado', 1, '2026-08-23 23:04:55', '2026-08-26 08:00:48'),
(15, 'Anillo Dorado', 'Anillos', NULL, 100.00, 10, 'imagenes/15.jpeg', 'Agotado', 1, '2026-08-23 23:04:55', '2026-08-26 08:08:00'),
(16, 'Anillo dorado ', 'Anillos', NULL, 100.00, 10, 'imagenes/16.jpeg', 'Agotado', 1, '2026-08-23 23:04:55', '2026-08-26 08:12:21'),
(17, 'Aretes Largos con Piedras Negras', 'Aretes', NULL, 100.00, 10, 'imagenes/17.jpeg', 'Agotado', 1, '2026-08-23 23:04:55', '2026-08-26 08:15:50'),
(18, 'Aretes Largos con Estrellas', 'Aretes', NULL, 100.00, 10, 'imagenes/18.jpeg', 'Agotado', 1, '2026-08-23 23:04:55', '2026-08-26 08:17:46'),
(19, 'Aretes Largos con Flores y Cristales', 'Aretes', NULL, 100.00, 10, 'imagenes/19.jpeg', 'Agotado', 1, '2026-08-23 23:04:55', '2026-08-26 08:15:50'),
(20, 'Anillo diamante', 'Anillos', NULL, 100.00, 10, 'imagenes/20.jpeg', 'Agotado', 1, '2026-08-23 23:04:55', '2026-08-26 08:07:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int UNSIGNED NOT NULL,
  `nombre` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `google_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` enum('cliente','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cliente',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `google_id`, `rol`, `activo`, `creado_en`, `actualizado_en`) VALUES
(11, 'Angel', 'angelaleman307m@gmail.com', '$2y$10$scWry8zhfDuS3IitvqgbmuXVzwZHmKQnqfQy2H5DW7XZcGjVJ4RY2', NULL, 'cliente', 1, '2026-08-26 03:04:57', '2026-08-26 03:04:57'),
(12, 'Angel Aleman', 'alepunks141@gmail.com', '$2y$10$z8S4sjlbkuG39AjP87FbYuLSyeKBMvznBoeUXvyzZz4/.nbSuyKTi', NULL, 'cliente', 1, '2026-08-28 15:53:21', '2026-08-28 15:53:21');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_detalle_pedido` (`pedido_id`),
  ADD KEY `fk_detalle_producto` (`producto_id`);

--
-- Indices de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_direcciones_usuario` (`usuario_id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `referencia_externa` (`referencia_externa`),
  ADD KEY `fk_pagos_pedido` (`pedido_id`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pedidos_usuario` (`usuario_id`),
  ADD KEY `fk_pedidos_direccion` (`direccion_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD CONSTRAINT `fk_direcciones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `fk_pagos_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE RESTRICT;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedidos_direccion` FOREIGN KEY (`direccion_id`) REFERENCES `direcciones` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
