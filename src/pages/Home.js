import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDestinos } from '../services/destinos';
import debounce from 'lodash/debounce';

function Home() {
    const [destinos, setDestinos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const [destinosPorPagina] = useState(10);
    const [totalDestinos, setTotalDestinos] = useState(0);

    const buscarDestinos = useCallback((nombre, pagina, limite) => {
        getDestinos({busqueda: nombre, pagina, limite})
            .then((response) => {
                console.log("API Response:", response.data);
                setDestinos(response.data.destinos); // Accede a la propiedad 'destinos'
                setTotalDestinos(response.data.total);
            })
            .catch((error) => console.error('Error al obtener destinos:', error));
    }, []);

    const debouncedBuscarDestinos = useCallback(debounce(buscarDestinos, 300), [buscarDestinos]);

    useEffect(() => {
        debouncedBuscarDestinos(busqueda, paginaActual, destinosPorPagina);
    }, [busqueda, debouncedBuscarDestinos, paginaActual]);

    const cambiarPagina = (numeroDePagina) => setPaginaActual(numeroDePagina);

    const numeroDePaginas = Math.ceil(totalDestinos / destinosPorPagina);

    return (
        <div>
            <h1>Destinos disponibles</h1>
            <input
                type="text"
                placeholder="Buscar destino..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />
            <ul>
                {destinos.map((destino) => (
                    <li key={destino.id}>
                        <Link to={`/destinos/${destino.id}`}>{destino.nombre}</Link>
                    </li>
                ))}
            </ul>
            <div>
                {Array.from({ length: numeroDePaginas }, (_, i) => i + 1).map((numero) => (
                    <button key={numero} onClick={() => cambiarPagina(numero)}>
                        {numero}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Home;