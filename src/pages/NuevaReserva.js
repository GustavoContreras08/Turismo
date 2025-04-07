 import React, { useState, useEffect } from 'react';
 import API_URL from '../services/reservas'; // Importa API_URL
 import axios from 'axios';
 import { useParams, useNavigate } from 'react-router-dom';
 import { crearReserva } from '../services/reservas';
 import { getDestinoPorNombre } from '../services/destinos'; // Importa esta nueva función

 function NuevaReserva() {
        const API_URL = 'http://localhost:3000'; // Define API_URL aquí
     const { nombreDestino } = useParams();
     const [destino, setDestino] = useState(null);
     const [fechaInicio, setFechaInicio] = useState('');
     const [numeroVisitantes, setNumeroVisitantes] = useState(1);
     const [nombreCliente, setNombreCliente] = useState('');
     const [correoElectronico, setCorreoElectronico] = useState('');
     const [telefono, setTelefono] = useState('');

     const usuarioId = 1; //cambiar una vez implementada las sesiones

     useEffect(() => {
        getDestinoPorNombre(nombreDestino).then(destino=>{
            if (destino){
                setDestino(destino);
            }
        });
     },[nombreDestino]);

     const handleSubmit = async (event) => {
         event.preventDefault();

         if (!destino){
            alert("No hay destino.");
            return;
         }

         const reservaData = {
             destino_id: destino.id,  // Usar el ID real
             usuario_id: usuarioId,
             fechaInicio,
             numeroVisitantes: parseInt(numeroVisitantes, 10),
             nombreCliente,
             correoElectronico,
             telefono,
            estado: 'pendiente', // Añadir estado: 'pendiente'
         };

         try {
            const response = await axios.post(`${API_URL}/reservas/new`, reservaData); // <-- ¡Revisa esto!
             console.log('Respuesta del servidor:', response.data);
             alert('Reserva creada con éxito!');
         } catch (error) {
             console.error('Error al crear la reserva:', error);
             alert('Error al crear la reserva. Intente nuevamente.');
         }
     };

    return (
        <div>
            <h1>Realizar Reserva para el Destino: {nombreDestino}</h1>
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
                    <label htmlFor="nombreCliente">Nombre:</label>
                    <input
                        type="text"
                        id="nombreCliente"
                        value={nombreCliente}
                        onChange={(e) => setNombreCliente(e.target.value)}
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

                <button type="submit">Continuar al Pago</button>
            </form>
        </div>
    );
}

export default NuevaReserva;