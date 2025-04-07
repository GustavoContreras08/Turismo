import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDestinoPorId } from '../services/destinos';

function DestinoDetalle() {
    const { id } = useParams();
    const [destino, setDestino] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDestino = async () => {
            try {
                const destinoData = await getDestinoPorId(id);
                
                // Asegurarse de que los datos contengan las propiedades esperadas
                if (destinoData) {
                    setDestino(destinoData);
                } else {
                    setError('Destino no encontrado');
                }
            } catch (err) {
                setError('Error al cargar el destino. Intente nuevamente.');
                console.error('Error al obtener el destino:', err);
            }
        };
        
        fetchDestino();
    }, [id]);

    if (error) {
        return <div>{error}</div>;
    }

    if (!destino) {
        return <div>Cargando...</div>;
    }

    // Validar si 'imagenes' y 'horarios' están presentes en el objeto destino
    const { nombre, descripcion, horarios, imagenes, contenido_vr } = destino;

    // Si las propiedades son undefined o vacías, mostrar valores por defecto
    const imagenesArray = Array.isArray(imagenes) ? imagenes : [];
    const horariosArray = Array.isArray(horarios) ? horarios : [];
    const contenidoVrArray = Array.isArray(contenido_vr) ? contenido_vr : [];

    return (
        <div>
            <h1>{nombre || 'Destino sin nombre'}</h1>
            <p>{descripcion || 'Descripción no disponible'}</p>
            <p>Precio: ${destino.precio}</p>
            <p>Disponible Desde: {destino.disponible_desde}</p>
            <p>Disponible Hasta: {destino.disponible_hasta}</p>
            <p>Duración Estimada: {destino.duracion_estimada}</p>

            {horariosArray.length > 0 && (
                <div>
                    <h2>Horarios de visita</h2>
                    <ul>
                        {horariosArray.map((horario, index) => (
                            <li key={index}>
                                {horario.dia_semana}: {horario.hora_inicio} - {horario.hora_fin} ({horario.temporada})
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h2>Imágenes</h2>
                {imagenesArray.length > 0 ? (
                    imagenesArray.map((imagen, index) => (
                        <img key={index} src={imagen} alt={nombre} />
                    ))
                ) : (
                    <p>No hay imágenes disponibles.</p>
                )}
            </div>

            <div>
                <h2>Contenido VR</h2>
                {contenidoVrArray.length > 0 ? (
                    contenidoVrArray.map((contenido, index) => (
                        <div key={index}>
                            <img src={contenido} alt={`Contenido VR - ${index}`} />
                        </div>
                    ))
                ) : (
                    <p>No hay contenido VR disponible.</p>
                )}
            </div>

                        <Link to={`/reservas/nuevo/${destino.nombre}`}>
                <button>Iniciar Reserva</button>
            </Link>

        </div>
    );
}

export default DestinoDetalle;
