let productos = [];

let carrito = [];
let categoriaActual = 'todos';
const API_AUTH = 'api/auth.php';
const API_PEDIDOS = 'api/pedidos.php';
const GOOGLE_CLIENT_ID = '456950544975-dgu7u1veh9135lvqlj0dsosvcvsvm60m.apps.googleusercontent.com';
let googleInicializado = false;

async function solicitarAPI(url, opciones) {
    let respuesta;
    try {
        respuesta = await fetch(url, opciones);
    } catch (error) {
        throw new Error('No se pudo contactar con el servidor. Abre la página desde Apache en http://localhost:8080.');
    }
    const texto = await respuesta.text();
    let datos;
    try {
        datos = JSON.parse(texto);
    } catch (error) {
        throw new Error('El servidor devolvió un error no válido (HTTP ' + respuesta.status + '). Revisa que Apache, PHP y la base de datos estén activos.');
    }
    if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.mensaje || 'No se pudo completar la operación.');
    }
    return datos;
}



function escaparHTML(texto) {
    const contenedor = document.createElement('div');
    contenedor.textContent = texto == null ? '' : String(texto);
    return contenedor.innerHTML;
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('CRIPTO_NO_DISPONIBLE');
    }
    const datos = new TextEncoder().encode(password);
    const bufferHash = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(bufferHash))
        .map(function(b) { return b.toString(16).padStart(2, '0'); })
        .join('');
}

function validarFortalezaPassword(password) {
    return {
        longitud: password.length >= 8,
        mayuscula: /[A-Z]/.test(password),
        minuscula: /[a-z]/.test(password),
        numero: /[0-9]/.test(password)
    };
}

function passwordEsValida(reglas) {
    return reglas.longitud && reglas.mayuscula && reglas.minuscula && reglas.numero;
}

function actualizarIndicadorFortaleza(password) {
    const contenedor = document.getElementById('fortalezaPassword');
    if (!contenedor) return;
    const reglas = validarFortalezaPassword(password);
    Object.keys(reglas).forEach(function(clave) {
        const item = contenedor.querySelector('[data-regla="' + clave + '"]');
        if (item) item.classList.toggle('cumplido', reglas[clave]);
    });
}


const MAX_INTENTOS_LOGIN = 5;
const BLOQUEO_LOGIN_MS = 60 * 1000;

function obtenerIntentos() {
    return JSON.parse(localStorage.getItem('intentosLoginLunox') || '{}');
}

function guardarIntentos(intentos) {
    localStorage.setItem('intentosLoginLunox', JSON.stringify(intentos));
}

function segundosDeBloqueo(email) {
    const registro = obtenerIntentos()[email.toLowerCase()];
    if (registro && registro.bloqueadoHasta && Date.now() < registro.bloqueadoHasta) {
        return Math.ceil((registro.bloqueadoHasta - Date.now()) / 1000);
    }
    return 0;
}

function registrarIntentoFallido(email) {
    const intentos = obtenerIntentos();
    const clave = email.toLowerCase();
    const registro = intentos[clave] || { conteo: 0 };
    registro.conteo += 1;
    if (registro.conteo >= MAX_INTENTOS_LOGIN) {
        registro.bloqueadoHasta = Date.now() + BLOQUEO_LOGIN_MS;
        registro.conteo = 0;
    }
    intentos[clave] = registro;
    guardarIntentos(intentos);
}

function limpiarIntentosFallidos(email) {
    const intentos = obtenerIntentos();
    delete intentos[email.toLowerCase()];
    guardarIntentos(intentos);
}

function obtenerUsuario() {
    return JSON.parse(localStorage.getItem('usuarioLunox') || 'null');
}

function obtenerUsuarios() {
    return JSON.parse(localStorage.getItem('usuariosLunox') || '[]');
}

function guardarUsuarios(usuarios) {
    localStorage.setItem('usuariosLunox', JSON.stringify(usuarios));
}

function guardarUsuario(usuario) {
    const usuarios = obtenerUsuarios();
    const indiceExistente = usuarios.findIndex(function(u) {
        return u.email.toLowerCase() === usuario.email.toLowerCase();
    });

    if (indiceExistente >= 0) {
        usuarios[indiceExistente] = usuario;
    } else {
        usuarios.push(usuario);
    }

    guardarUsuarios(usuarios);
    localStorage.setItem('usuarioLunox', JSON.stringify(usuario));
    actualizarEstadoSesion();
}

function cerrarSesion() {
    localStorage.removeItem('usuarioLunox');
    actualizarEstadoSesion();
    if (window.location.pathname.endsWith('login.html')) {
        return;
    }
    window.location.href = 'login.html';
}

function actualizarEstadoSesion() {
    const usuario = obtenerUsuario();
    const estado = document.getElementById('estadoSesion');
    if (!estado) return;

    if (usuario) {
        estado.innerHTML = '<a href="perfil.html" class="usuario-perfil">' +
            '<span class="icono-luna">🌙</span> ' + escaparHTML(usuario.nombre) +
            '</a> <button class="boton-cerrar-sesion" onclick="cerrarSesion()">Cerrar sesión</button>';
    } else {
        estado.innerHTML = '<a href="login.html" class="boton-dorado boton-cuenta">Iniciar sesión</a>';
    }
}

function requiereSesion() {
    if (!obtenerUsuario()) {
        mostrarNotificacion('Por favor inicia sesión para comprar.');
        window.location.href = 'login.html';
        return true;
    }
    return false;
}

function cambiarPestanaLogin(tab) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(function(button) {
        button.classList.toggle('tab-activa', button.dataset.tab === tab);
    });
    const panelLogin = document.getElementById('panelLogin');
    const panelRegister = document.getElementById('panelRegister');
    if (panelLogin) panelLogin.classList.toggle('activo', tab === 'login');
    if (panelRegister) panelRegister.classList.toggle('activo', tab === 'register');
}

async function iniciarSesionManual(email, password) {
    const segundos = segundosDeBloqueo(email);
    if (segundos > 0) {
        mostrarNotificacion('Demasiados intentos fallidos. Espera ' + segundos + ' segundos e intenta de nuevo.');
        return;
    }

    try {
        const datos = await solicitarAPI(API_AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'iniciar', email: email, password: password })
        });
        limpiarIntentosFallidos(email);
        guardarUsuario(datos.usuario);
        mostrarNotificacion('Sesión iniciada como ' + datos.usuario.nombre);
        window.location.href = 'index.html';
    } catch (error) {
        registrarIntentoFallido(email);
        mostrarNotificacion(error.message);
    }
}

async function registrarUsuario(nombre, email, password) {
    const datos = await solicitarAPI(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'registrar', nombre: nombre.trim(), email: email.trim(), password: password })
    });
    guardarUsuario(datos.usuario);
    mostrarNotificacion(datos.mensaje);
    window.location.href = 'index.html';
}

async function iniciarSesionGoogle(credential) {
    try {
        const datos = await solicitarAPI(API_AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'google', credential: credential })
        });
        guardarUsuario(datos.usuario);
        mostrarNotificacion(datos.mensaje);
        window.location.href = 'index.html';
    } catch (error) {
        mostrarNotificacion(error.message);
    }
}

function inicializarGoogle() {
    if (googleInicializado || !window.google || GOOGLE_CLIENT_ID.indexOf('PON_AQUI') === 0) return;
    googleInicializado = true;
    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: function(respuesta) {
            iniciarSesionGoogle(respuesta.credential);
        }
    });
    ['googleLogin', 'googleRegistro'].forEach(function(id) {
        const contenedor = document.getElementById(id);
        if (!contenedor) return;
        window.google.accounts.id.renderButton(contenedor, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 300
        });
    });
}

function renderizarProductos(categoria = 'todos') {
    const grilla = document.getElementById('grillaProductos');
    grilla.innerHTML = '';

    const filtrados = categoria === 'todos'
        ? productos
        : productos.filter(function(p) { return p.categoria === categoria; });

    if (filtrados.length === 0) {
        grilla.innerHTML = '<p class="sin-resultados">No hay productos en esta categoría.</p>';
        return;
    }

    filtrados.forEach(function(p) {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-producto';
        tarjeta.onclick = function() { abrirModal(p.id); };
        tarjeta.innerHTML =
            '<div class="contenedor-imagen-producto">' +
                '<img src="' + p.imagen + '" alt="' + p.nombre + '" class="imagen-producto" onerror="this.style.display=\'none\'; this.parentElement.classList.add(\'imagen-fallback\');">' +
                (p.insignia ? '<span class="insignia-producto">' + p.insignia + '</span>' : '') +
            '</div>' +
            '<div class="info-producto">' +
                '<p class="categoria-producto">' + p.categoria + '</p>' +
                '<h3 class="nombre-producto">' + p.nombre + '</h3>' +
                '<p class="precio-producto">L. ' + p.precio.toFixed(2) + '</p>' +
                '<button class="boton-agregar" onclick="event.stopPropagation(); agregarAlCarrito(' + p.id + ', this)">Agregar al carrito</button>' +
            '</div>';
        grilla.appendChild(tarjeta);
    });
}


function generarFiltros() {
    const contenedor = document.getElementById('filtrosCategoria');
    const categorias = ['todos', ...new Set(productos.map(function(p) { return p.categoria; }))];

    contenedor.innerHTML = '';

    categorias.forEach(function(cat) {
        const btn = document.createElement('button');
        btn.className = 'filtro-btn' + (cat === categoriaActual ? ' active' : '');
        btn.dataset.categoria = cat;
        btn.textContent = cat === 'todos' ? 'Todos' : cat;
        btn.onclick = function() {
            document.querySelectorAll('.filtro-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            categoriaActual = cat;
            renderizarProductos(cat);
        };
        contenedor.appendChild(btn);
    });
}


function abrirModal(idProducto) {
    const producto = productos.find(function(p) { return p.id === idProducto; });
    if (!producto) return;

    const modal = document.getElementById('panelModal');
    const fondo = document.getElementById('fondoModal');
    const contenido = document.getElementById('modalContenido');

    contenido.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}" class="modal-imagen" onerror="this.src='imagenes/placeholder.jpeg'">
        <div class="modal-info">
            <p class="modal-categoria">${producto.categoria}</p>
            <h2>${producto.nombre}</h2>
            ${producto.insignia ? '<span class="modal-insignia">' + producto.insignia + '</span>' : ''}
            <p class="modal-precio">L. ${producto.precio.toFixed(2)}</p>
            <p class="modal-descripcion">Pieza exclusiva de nuestra colección, diseñada con materiales de alta calidad para resaltar tu estilo.</p>
            <button class="modal-boton-agregar" onclick="agregarDesdeModal(${producto.id})">Agregar al carrito</button>
        </div>
    `;

    modal.classList.add('abierto');
    fondo.classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    document.getElementById('panelModal').classList.remove('abierto');
    document.getElementById('fondoModal').classList.remove('activo');
    document.body.style.overflow = '';
}

function agregarDesdeModal(idProducto) {
    agregarAlCarrito(idProducto);
    cerrarModal();
}


function agregarAlCarrito(idProducto, boton) {
    if (requiereSesion()) return;
    const producto = productos.find(function(p) { return p.id === idProducto; });
    if (!producto) return;

    const existente = carrito.find(function(articulo) { return articulo.id === idProducto; });
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }

    actualizarCarritoUI();
    mostrarNotificacion(producto.nombre + ' agregado al carrito');

    if (boton) {
        boton.textContent = 'Agregado';
        boton.classList.add('agregado');
        setTimeout(function() {
            boton.textContent = 'Agregar al carrito';
            boton.classList.remove('agregado');
        }, 1500);
    }
}

function cambiarCantidad(id, cambio) {
    const articulo = carrito.find(function(i) { return i.id === id; });
    if (!articulo) return;

    articulo.cantidad += cambio;
    if (articulo.cantidad <= 0) {
        carrito = carrito.filter(function(i) { return i.id !== id; });
    }
    actualizarCarritoUI();
}

function eliminarArticulo(id) {
    carrito = carrito.filter(function(i) { return i.id !== id; });
    actualizarCarritoUI();
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const contenedorArticulos = document.getElementById('articulosCarrito');
    const pieCarrito = document.getElementById('pieCarrito');
    const contador = document.getElementById('contadorCarrito');
    const totalElemento = document.getElementById('totalCarrito');

    const totalArticulos = carrito.reduce(function(acc, i) { return acc + i.cantidad; }, 0);
    const totalPrecio = carrito.reduce(function(acc, i) { return acc + (i.precio * i.cantidad); }, 0);

    contador.textContent = totalArticulos;

    if (carrito.length === 0) {
        contenedorArticulos.innerHTML = '<p class="carrito-vacio">Tu carrito esta vacio</p>';
        pieCarrito.style.display = 'none';
        return;
    }

    pieCarrito.style.display = 'block';
    totalElemento.textContent = 'L. ' + totalPrecio.toFixed(2);

    contenedorArticulos.innerHTML = '';
    carrito.forEach(function(articulo) {
        const producto = productos.find(function(p) { return p.id === articulo.id; });
        const div = document.createElement('div');
        div.className = 'articulo-carrito';
        div.innerHTML =
            '<div class="imagen-articulo-carrito">' +
                '<img src="' + (producto ? producto.imagen : 'imagenes/placeholder.jpeg') + '" alt="' + articulo.nombre + '">' +
            '</div>' +
            '<div class="info-articulo-carrito">' +
                '<h4>' + articulo.nombre + '</h4>' +
                '<p class="precio-unitario-carrito">L. ' + articulo.precio.toFixed(2) + '</p>' +
                '<p class="subtotal-articulo-carrito">Subtotal: L. ' + (articulo.precio * articulo.cantidad).toFixed(2) + '</p>' +
            '</div>' +
            '<div class="controles-articulo">' +
                '<button onclick="cambiarCantidad(' + articulo.id + ', -1)">−</button>' +
                '<span class="cantidad-display">' + articulo.cantidad + '</span>' +
                '<button onclick="cambiarCantidad(' + articulo.id + ', 1)">+</button>' +
            '</div>' +
            '<button class="boton-eliminar-articulo" onclick="eliminarArticulo(' + articulo.id + ')" title="Eliminar">✕</button>';
        contenedorArticulos.appendChild(div);
    });
}

function abrirCarrito() {
    document.getElementById('panelCarrito').classList.add('abierto');
    document.getElementById('fondoCarrito').classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
    document.getElementById('panelCarrito').classList.remove('abierto');
    document.getElementById('fondoCarrito').classList.remove('activo');
    document.body.style.overflow = '';
}

function generarMensajeCompra() {
    if (carrito.length === 0) return '';

    const total = carrito.reduce(function(acc, i) { return acc + (i.precio * i.cantidad); }, 0);

    let mensaje = '*Cotizacion LUNOX Joyeria*\n\nHola, me interesan los siguientes productos:\n\n';

    carrito.forEach(function(articulo) {
        mensaje += '*' + articulo.nombre + '*\n';
        mensaje += '   Cantidad: ' + articulo.cantidad + '\n';
        mensaje += '   Precio unitario: L. ' + articulo.precio.toFixed(2) + '\n';
        mensaje += '   Subtotal: L. ' + (articulo.precio * articulo.cantidad).toFixed(2) + '\n\n';
    });

    mensaje += '---------------------------------\n';
    mensaje += '*Total estimado: L. ' + total.toFixed(2) + '*\n\n';
    mensaje += 'Podria confirmarme disponibilidad y forma de pago? Muchas gracias!';

    return mensaje;
}

async function comprar() {
    if (requiereSesion()) return;
    const total = carrito.reduce(function(acc, i) { return acc + (i.precio * i.cantidad); }, 0);
    if (total === 0) return;

    const mensaje = generarMensajeCompra();
    if (!mensaje) return;

    const usuario = obtenerUsuario();
    try {
        await solicitarAPI(API_PEDIDOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: usuario.id,
                items: carrito.map(function(item) {
                    return { id: item.id, cantidad: item.cantidad };
                }),
                proveedor: 'efectivo'
            })
        });
    } catch (error) {
        mostrarNotificacion(error.message);
        return;
    }

    const numeroWA = '50498665777';
    const url = 'https://wa.me/' + numeroWA + '?text=' + encodeURIComponent(mensaje);
    window.open(url, '_blank');
    carrito = [];
    actualizarCarritoUI();
    mostrarNotificacion('Pedido registrado correctamente.');
}

function agregarHistorial(metodo) {
    const usuario = obtenerUsuario();
    if (!usuario || carrito.length === 0) return;

    const total = carrito.reduce(function(acc, i) { return acc + (i.precio * i.cantidad); }, 0);
    const fecha = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const entradas = carrito.map(function(articulo) {
        return {
            nombre: articulo.nombre,
            cantidad: articulo.cantidad,
            subtotal: articulo.precio * articulo.cantidad
        };
    });

    usuario.historial = usuario.historial || [];
    usuario.historial.unshift({ fecha: fecha, metodo: metodo, total: total, items: entradas });
    guardarUsuario(usuario);
}

function cerrarMenu() {
    document.getElementById('navMovil').classList.remove('abierto');
}

function mostrarNotificacion(texto) {
    let notificacion = document.getElementById('notificacion');
    if (!notificacion) {
        notificacion = document.createElement('div');
        notificacion.id = 'notificacion';
        notificacion.className = 'notificacion';
        document.body.appendChild(notificacion);
    }
    notificacion.textContent = texto;
    notificacion.classList.add('visible');
    clearTimeout(notificacion._temporizador);
    notificacion._temporizador = setTimeout(function() {
        notificacion.classList.remove('visible');
    }, 2200);
}

async function cargarProductos() {
    const datos = await solicitarAPI('api/productos.php', { method: 'GET' });
    productos = datos.productos;
}

document.addEventListener('DOMContentLoaded', async function() {
    inicializarGoogle();
    window.addEventListener('load', inicializarGoogle);
    actualizarEstadoSesion();
    if (document.getElementById('filtrosCategoria')) {
        try {
            await cargarProductos();
            generarFiltros();
            renderizarProductos('todos');
        } catch (error) {
            mostrarNotificacion(error.message);
        }
    }

    const botonCarrito = document.getElementById('botonCarrito');
    if (botonCarrito) {
        botonCarrito.addEventListener('click', function() {
            if (!obtenerUsuario()) {
                mostrarNotificacion('Por favor inicia sesión para ver el carrito.');
                window.location.href = 'login.html';
                return;
            }
            abrirCarrito();
        });
    }

    const botonMenu = document.getElementById('botonMenu');
    if (botonMenu) {
        botonMenu.addEventListener('click', function() {
            document.getElementById('navMovil').classList.toggle('abierto');
        });
    }

    const pestanas = document.querySelectorAll('.tab');
    pestanas.forEach(function(boton) {
        boton.addEventListener('click', function() {
            cambiarPestanaLogin(this.dataset.tab);
        });
    });

    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            if (!email || !password) {
                mostrarNotificacion('Completa tu correo y contraseña.');
                return;
            }
            if (!validarEmail(email)) {
                mostrarNotificacion('Ingresa un correo válido.');
                return;
            }
            try {
                await iniciarSesionManual(email, password);
            } catch (error) {
                mostrarNotificacion('No se pudo iniciar sesión de forma segura en este navegador.');
            }
        });
    }

    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
        formRegister.addEventListener('submit', async function(event) {
            event.preventDefault();
            const nombre = document.getElementById('registerNombre').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value.trim();
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value.trim();

            if (!nombre || !email || !password || !passwordConfirm) {
                mostrarNotificacion('Completa tu nombre, correo y contraseña para registrarte.');
                return;
            }
            if (!validarEmail(email)) {
                mostrarNotificacion('Ingresa un correo válido.');
                return;
            }
            if (password !== passwordConfirm) {
                mostrarNotificacion('Las contraseñas no coinciden.');
                return;
            }
            if (!passwordEsValida(validarFortalezaPassword(password))) {
                mostrarNotificacion('La contraseña debe tener 8+ caracteres, con mayúscula, minúscula y número.');
                return;
            }
            try {
                await registrarUsuario(nombre, email, password);
            } catch (error) {
                mostrarNotificacion(error.message);
            }
        });

        const campoPasswordRegistro = document.getElementById('registerPassword');
        if (campoPasswordRegistro) {
            campoPasswordRegistro.addEventListener('input', function() {
                actualizarIndicadorFortaleza(this.value);
            });
        }
    }

    document.querySelectorAll('.boton-mostrar-password').forEach(function(boton) {
        boton.addEventListener('click', function() {
            const input = document.getElementById(this.dataset.target);
            if (!input) return;
            const mostrar = input.type === 'password';
            input.type = mostrar ? 'text' : 'password';
            this.textContent = mostrar ? 'Ocultar' : 'Mostrar';
            this.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarModal();
            cerrarCarrito();
        }
    });

    window.addEventListener('scroll', function() {
        const barraNav = document.querySelector('.barra-nav');
        if (barraNav) {
            if (window.scrollY > 50) {
                barraNav.style.borderBottomColor = 'rgba(201, 168, 76, 0.5)';
            } else {
                barraNav.style.borderBottomColor = 'rgba(201, 168, 76, 0.3)';
            }
        }
    });

    if (document.getElementById('perfilUsuario')) {
        renderizarPerfil();
        cargarHistorialPedidos();
    }
});

function renderizarPerfil() {
    const usuario = obtenerUsuario();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    const perfilUsuario = document.getElementById('perfilUsuario');
    const perfilHistorial = document.getElementById('perfilHistorial');

    if (!perfilUsuario || !perfilHistorial) return;

    const nombreSeguro = escaparHTML(usuario.nombre);
    const emailSeguro = escaparHTML(usuario.email);

    perfilUsuario.innerHTML = `
        <div class="perfil-card">
            <div class="perfil-avatar">${escaparHTML(usuario.nombre.charAt(0).toUpperCase())}</div>
            <div>
                <p class="perfil-tipo">Cuenta LUNOX</p>
                <h2>${nombreSeguro}</h2>
                <p>${emailSeguro}</p>
            </div>
        </div>
        <div class="perfil-resumen">
            <div>
                <p>Total de compras</p>
                <strong>${usuario.historial ? usuario.historial.length : 0}</strong>
            </div>
            <div>
                <p>Última actualización</p>
                <strong>${usuario.historial && usuario.historial.length ? usuario.historial[0].fecha : 'Aún no hay registro'}</strong>
            </div>
        </div>
    `;

    if (!usuario.historial || usuario.historial.length === 0) {
        perfilHistorial.innerHTML = '<p class="perfil-sin-historial">Aún no tienes movimientos en tu historial. Cuando realices una compra o cotización, la verás aquí.</p>';
        return;
    }

    perfilHistorial.innerHTML = usuario.historial.map(function(registro) {
        return `
            <article class="historial-card">
                <div class="historial-encabezado">
                    <div>
                        <p class="historial-metodo">${registro.metodo}</p>
                        <p class="historial-fecha">${registro.fecha}</p>
                    </div>
                    <strong>L. ${registro.total.toFixed(2)}</strong>
                </div>
                <ul class="historial-items">
                    ${registro.items.map(function(item) {
                        return `<li>${item.cantidad}× ${item.nombre} <span>L. ${item.subtotal.toFixed(2)}</span></li>`;
                    }).join('')}
                </ul>
            </article>
        `;
    }).join('');
}

async function cargarHistorialPedidos() {
    const usuario = obtenerUsuario();
    if (!usuario || !usuario.id) return;

    try {
        const datos = await solicitarAPI(API_PEDIDOS + '?usuario_id=' + encodeURIComponent(usuario.id), {
            method: 'GET'
        });
        usuario.historial = datos.pedidos.map(function(pedido) {
            return {
                fecha: pedido.fecha,
                metodo: 'Pedido ' + pedido.estado,
                total: Number(pedido.total),
                items: (pedido.items || []).map(function(item) {
                    return {
                        nombre: item.nombre,
                        cantidad: Number(item.cantidad),
                        subtotal: Number(item.subtotal)
                    };
                })
            };
        });
        guardarUsuario(usuario);
        renderizarPerfil();
    } catch (error) {
        mostrarNotificacion('No se pudo cargar el historial: ' + error.message);
    }
}
