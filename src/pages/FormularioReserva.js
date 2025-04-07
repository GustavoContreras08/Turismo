import React, { useState } from 'react';

function FormularioReserva() {
    const [fechaInicio, setFechaInicio] = useState('');
    const [numeroVisitantes, setNumeroVisitantes] = useState(1);
    const [nombre, setNombre] = useState('');
    const [correoElectronico, setCorreoElectronico] = useState('');
    const [telefono, setTelefono] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault(); // Evita la recarga de la página

        idDestino: parseInt(idDestino, 10), // Convierte el id a número
        fechaInicio,
        numeroVisitantes: parseInt(numeroVisitantes, 10), // Convierte a número
        nombre,
        correoElectronico,
        telefono,
        estado: 'pendiente', // Añadir estado: 'pendiente'
        // Aquí iría el código para enviar los datos al servidor (lo veremos después)

        console.log('Datos a enviar:', { fechaInicio, numeroVisitantes, nombre, correoElectronico, telefono });

        // Resetea el formulario (opcional)
        setFechaInicio('');
        setNumeroVisitantes(1);
        setNombre('');
        setCorreoElectronico('');
        setTelefono('');
    };

    return (
        <div>
            <h2>Realizar Reserva</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="fechaInicio">Fecha de Inicio:</label>
                    <input
                        type="date"
                        id="fechaInicio"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="numeroVisitantes">Número de Visitantes:</label>
                    <input
                        type="number"
                        id="numeroVisitantes"
                        value={numeroVisitantes}
                        onChange={(e) => setNumeroVisitantes(parseInt(e.target.value, 10))}
                        min="1"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="nombre">Nombre:</label>
                    <input
                        type="text"
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="correoElectronico">Correo Electrónico:</label>
                    <input
                        type="email"
                        id="correoElectronico"
                        value={correoElectronico}
                        onChange={(e) => setCorreoElectronico(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="telefono">Teléfono:</label>
                    <input
                        type="tel"
                        id="telefono"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">Proceder al Checkout</button> 
            </form>
        </div>
    );
}

export default FormularioReserva;   