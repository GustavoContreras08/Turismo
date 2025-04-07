const paypal = require('@paypal/checkout-server-sdk');

const environment = new paypal.core.SandboxEnvironment(
    'AbW2_1CK2o-SE1-qQ_js2wWT4RzcBSWA0kx6owm04vzDdPIRNf3l2atVSln3WqSkQCA05ixipAt362oX', // Reemplaza con tu ID de cliente de PayPal
    'ECNvJt_3S4acba4UOFWHGrkxdqZZGXBC7nNuJlGlAGHZjraNTe8A70wwF4V-JRfEtQiQAwI7lohOt4Mq' // Reemplaza con tu clave secreta de PayPal
);

const client = new paypal.core.PayPalHttpClient(environment);

const express = require('express');
const app = express(); // <- ¡Esta línea es crucial!
const cors = require('cors'); // Si lo estás usando
const db = require('./db'); // Si tienes un archivo db.js para la conexión a la base de datos

app.use(cors()); // Si lo estás usando
app.use(express.json()); // Para analizar JSON en las solicitudes

const validateReserva = async (req, res, next) => {
    const { usuario_id, destino_id, fecha, estado } = req.body;

    if (!usuario_id || !destino_id || !fecha || !estado) {
        return res.status(400).send('Faltan datos de reserva');
    }

    if (estado !== 'pendiente' && estado !== 'confirmada' && estado !== 'cancelada') {
        return res.status(400).send('Estado de reserva inválido');
    }

    try {
        const [usuario] = await db.query('SELECT id FROM Usuarios WHERE id = ?', [usuario_id]);
        if (usuario.length === 0) {
            return res.status(400).send('Usuario no encontrado');
        }

        const [destino] = await db.query('SELECT id FROM Destinos WHERE id = ?', [destino_id]);
        if (destino.length === 0) {
            return res.status(400).send('Destino no encontrado');
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al validar reserva');
    }
};

const ERROR_CODIGOS = {
    USUARIO_NO_ENCONTRADO: 404,
    DESTINO_NO_ENCONTRADO: 404,
    RESERVA_NO_ENCONTRADA: 404,
    CONTENIDO_VR_NO_ENCONTRADO: 404,
    ANALISIS_NO_ENCONTRADO: 404,
    CORREO_O_CONTRASENA_INCORRECTOS: 401,
    TOKEN_INVALIDO: 401,
    FALTAN_DATOS: 400,
    ESTADO_RESERVA_INVALIDO: 400,
    ERROR_AL_CREAR_USUARIO: 500,
    ERROR_AL_OBTENER_USUARIO: 500,
    ERROR_AL_CREAR_DESTINO: 500,
    ERROR_AL_OBTENER_DESTINO: 500,
    ERROR_AL_CREAR_CONTENIDO_VR: 500,
    ERROR_AL_OBTENER_CONTENIDO_VR: 500,
    ERROR_AL_CREAR_RESERVA: 500,
    ERROR_AL_OBTENER_RESERVA: 500,
    ERROR_AL_CREAR_ANALISIS: 500,
    ERROR_AL_OBTENER_ANALISIS: 500,
    ERROR_AL_REGISTRAR_USUARIO: 500,
    ERROR_AL_INICIAR_SESION: 500,
    ERROR_AL_GENERAR_RECOMENDACIONES: 500,
    ERROR_AL_ACTUALIZAR_RESERVA: 500,
    ERROR_AL_PROCESAR_PAGO: 500,
};

app.get('/destinos/nombre/:nombre', async (req, res) => {
    console.log("Ruta Solicitada:", req.url);     // <- Agrega esto
    console.log("Parámetro Nombre:", req.params.nombre); // <- Y esto
    try {
        const { nombre } = req.params;
        const [rows] = await db.query('SELECT id FROM Destinos WHERE nombre = ?', [nombre]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Destino no encontrado' });
        }

        res.json(rows[0]); // Devolver sólo el ID (u otros datos necesarios)
    } catch (error) {
        console.error('Error al obtener el destino por nombre:', error);
        res.status(500).json({ error: 'Error al obtener el destino' });
    }
});

app.get('/destinos', async (req, res) => {
    try {
        const nombre = req.query.nombre;
        const tipo = req.query.tipo;
        const ubicacion = req.query.ubicacion;
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = parseInt(req.query.limite) || 10;
        const offset = (pagina - 1) * limite;

        let query = 'SELECT * FROM Destinos';
        let countQuery = 'SELECT COUNT(*) as total FROM Destinos';
        const params = [];
        const whereClauses = [];

        if (nombre) {
            whereClauses.push('nombre LIKE ?');
            params.push(`%${nombre}%`);
        }

        if (tipo) {
            whereClauses.push('tipo = ?');
            params.push(tipo);
        }

        if (ubicacion) {
            whereClauses.push('ubicacion = ?');
            params.push(ubicacion);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
            countQuery += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(limite, offset);

        console.log("SQL Query:", query);
        console.log("SQL Params:", params);

        const [rows] = await db.query(query, params);
        const [countResult] = await db.query(countQuery, params.slice(0, whereClauses.length));
        const total = countResult[0].total;

        res.json({
            destinos: rows,
            total
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener destinos');
    }
});

app.get('/destinos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                Destinos.*,
                IFNULL(
                    JSON_ARRAY(
                        GROUP_CONCAT(
                            JSON_OBJECT(
                                'dia_semana', Horarios.dia_semana,
                                'hora_inicio', TIME_FORMAT(Horarios.hora_inicio, '%H:%i'),
                                'hora_fin', TIME_FORMAT(Horarios.hora_fin, '%H:%i'),
                                'temporada', Horarios.temporada
                            )
                            ORDER BY Horarios.dia_semana SEPARATOR ',' 
                        )
                    ), 
                    '[]'
                ) AS horarios
            FROM Destinos
            LEFT JOIN Horarios ON Destinos.id = Horarios.destino_id
            WHERE Destinos.id = ?
            GROUP BY Destinos.id
        `;
        const [rows] = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).send('Destino no encontrado');
        }

        // Asegúrate de parsear los datos JSON
        const destino = rows[0];
        try {
            destino.horarios = JSON.parse(destino.horarios);  // Parseamos el JSON de horarios
        } catch (e) {
            console.error('Error parsing horarios:', e);
            destino.horarios = [];  // Si hay error, asignamos un array vacío
        }

        res.json(destino);  // Retornamos la respuesta como un objeto JSON
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener destino');
    }
});

app.post('/destinos', async (req, res) => {
    try {
        const { nombre, descripcion, ubicacion, imagenes, contenido_vr } = req.body;
        const [result] = await db.query('INSERT INTO Destinos (nombre, descripcion, ubicacion, imagenes, contenido_vr) VALUES (?, ?, ?, ?, ?)', [nombre, descripcion, ubicacion, imagenes, contenido_vr]);
        res.status(201).json({ id: result.insertId, message: 'Destino creado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear destino');
    }
});

app.get('/usuarios', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Usuarios');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener usuarios');
    }
});

app.get('/usuarios/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Usuarios WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener usuario');
    }
});

app.post('/usuarios', async (req, res) => {
    try {
        const { nombre, correo_electronico, contrasena, rol, preferencias } = req.body;
        const [result] = await db.query('INSERT INTO Usuarios (nombre, correo_electronico, contrasena, rol, preferencias) VALUES (?, ?, ?, ?, ?)', [nombre, correo_electronico, contrasena, rol, preferencias]);
        res.status(201).json({ id: result.insertId, message: 'Usuario creado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear usuario');
    }
});

app.get('/contenido_vr', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Contenido_VR');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener contenido VR');
    }
});

app.get('/contenido_vr/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Contenido_VR WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).send('Contenido VR no encontrado');
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener contenido VR');
    }
});

app.post('/contenido_vr', async (req, res) => {
    try {
        const { destino_id, tipo, url } = req.body;
        const [result] = await db.query('INSERT INTO Contenido_VR (destino_id, tipo, url) VALUES (?, ?, ?)', [destino_id, tipo, url]);
        res.status(201).json({ id: result.insertId, message: 'Contenido VR creado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear contenido VR');
    }
});

app.get('/reservas', async (req, res) => {
    try {
        let query = 'SELECT * FROM Reservas';
        const params = [];

        if (req.query.usuario_id) {
            query += ' WHERE usuario_id = ?';
            params.push(req.query.usuario_id);
        }

        if (req.query.destino_id) {
            query += params.length > 0 ? ' AND destino_id = ?' : ' WHERE destino_id = ?';
            params.push(req.query.destino_id);
        }

        if (req.query.estado) {
            query += params.length > 0 ? ' AND estado = ?' : ' WHERE estado = ?';
            params.push(req.query.estado);
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener reservas');
    }
});
app.get('/reservas/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Reservas WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).send('Reserva no encontrada');
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener reserva');
    }
});

app.post('/reservas/new', async (req, res) => {
    try {
        const { idDestino, fechaInicio, numeroVisitantes, nombreCliente, correoElectronico, telefono } = req.body;
        console.log('Metodo aplicado');

        // Validación de datos (ejemplo)
        if (!idDestino || !fechaInicio || !numeroVisitantes || !nombreCliente || !correoElectronico || !telefono) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const parsedNumeroVisitantes = parseInt(numeroVisitantes, 10);
        if (isNaN(parsedNumeroVisitantes) || parsedNumeroVisitantes <= 0) {
            return res.status(400).json({ error: 'Número de visitantes no válido.' });
        }

        // Guardar la información en la base de datos (Ejemplo)
        const [result] = await db.query(
            'INSERT INTO reservas (destino_id, usuario_id, fecha, numero_visitantes, nombre_cliente, correo_electronico, telefono, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [destino_id, usuario_id, fecha, parsedNumeroVisitantes, nombre_cliente, correo_electronico, telefono, estado]
        );

        res.status(201).json({ message: 'Reserva creada con éxito', reservaId: result.insertId });

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        res.status(500).json({ error: 'Error al crear la reserva' });
    }
});

app.put('/reservas/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        if (estado !== 'pendiente' && estado !== 'confirmada' && estado !== 'cancelada') {
            return res.status(400).send('Estado de reserva inválido');
        }

        const [result] = await db.query('UPDATE Reservas SET estado = ? WHERE id = ?', [estado, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).send('Reserva no encontrada');
        }

        res.json({ message: 'Estado de reserva actualizado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar reserva');
    }
});

app.get('/analisis', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Analisis');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener registros de análisis');
    }
});

app.get('/analisis/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Analisis WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).send('Registro de análisis no encontrado');
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener registro de análisis');
    }
});

app.post('/analisis', async (req, res) => {
    try {
        const { usuario_id, destino_id, fecha, tipo_interaccion } = req.body;
        const [result] = await db.query('INSERT INTO Analisis (usuario_id, destino_id, fecha, tipo_interaccion) VALUES (?, ?, ?, ?)', [usuario_id, destino_id, fecha, tipo_interaccion]);
        res.status(201).json({ id: result.insertId, message: 'Registro de análisis creado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear registro de análisis');
    }
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Registro de usuario
app.post('/registro', async (req, res) => {
    try {
        const { nombre, correo_electronico, contrasena, rol, preferencias } = req.body;
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const [result] = await db.query('INSERT INTO Usuarios (nombre, correo_electronico, contrasena, rol, preferencias) VALUES (?, ?, ?, ?, ?)', [nombre, correo_electronico, hashedPassword, rol, preferencias]);
        res.status(201).json({ id: result.insertId, message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar usuario');
    }
});

// Inicio de sesión
app.post('/inicio_sesion', async (req, res) => {
    try {
        const { correo_electronico, contrasena } = req.body;
        const [rows] = await db.query('SELECT * FROM Usuarios WHERE correo_electronico = ?', [correo_electronico]);
        if (rows.length === 0) {
            return res.status(401).send('Correo electrónico o contraseña incorrectos');
        }
        const user = rows[0];
        const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!passwordMatch) {
            return res.status(401).send('Correo electrónico o contraseña incorrectos');
        }
        const token = jwt.sign({ id: user.id, rol: user.rol }, 'tu_secreto', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al iniciar sesión');
    }
});

const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).send('Acceso no autorizado');
    }
    try {
        const decoded = jwt.verify(token, 'tu_secreto');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).send('Token inválido');
    }
};

app.get('/rutaprivada', authenticate, (req, res) => {
    res.send('Ruta privada');
});

app.get('/recomendaciones', authenticate, async (req, res) => {
    try {
        const [preferencias] = await db.query('SELECT preferencias from usuarios where id = ?', req.user.id);
        const [destinos] = await db.query('SELECT * from destinos ORDER BY id ASC limit 5');
        res.json(destinos);
    } catch (error) {
        console.error(error);
        res.status(500).send('error al generar recomendaciones');
    }
});

app.post('/reservas/:id/pagar_paypal', authenticate, async (req, res) => {
    try {
        const { cantidad } = req.body;
        const [reserva] = await db.query('SELECT * FROM Reservas WHERE id = ?', [req.params.id]);

        if (reserva.length === 0) {
            return res.status(404).send('Reserva no encontrada');
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'EUR', // Cambia a la moneda que necesites
                        value: cantidad,
                    },
                },
            ],
        });

        const order = await client.execute(request);
        res.json({ orderID: order.result.id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear pedido en PayPal');
    }
});

app.post('/reservas/:id/capturar_pago', authenticate, async (req, res) => {
    try {
        const { orderID } = req.body;

        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});

        const capture = await client.execute(request);

        if (capture.result.status === 'COMPLETED') {
            // Actualizar el estado de la reserva a "confirmada"
            await db.query('UPDATE Reservas SET estado = "confirmada" WHERE id = ?', [req.params.id]);
            res.send('Pago completado con éxito');
        } else {
            res.status(500).send('Error al capturar el pago');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al capturar el pago');
    }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack); // Registrar el error en la consola
    res.status(500).json({ error: 'Algo salió mal' }); // Devolver un mensaje de error genérico
});

const port = 3000;
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`); // Esta linea es importante
});