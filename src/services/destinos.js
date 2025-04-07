import axios from 'axios';

const API_URL = 'http://localhost:3000'; // URL de tu API

export const getDestinos = ({ busqueda, tipo, ubicacion, paginaActual, destinosPorPagina }) => {
    return axios.get(`${API_URL}/destinos`, {
        params: {
            nombre: busqueda || undefined,   // Si no hay búsqueda, no se envía
            tipo: tipo || undefined,        // Si no hay tipo, no se envía
            ubicacion: ubicacion || undefined, // Si no hay ubicación, no se envía
            pagina: paginaActual,
            limite: destinosPorPagina
        }
    });
};

export const getDestinoPorId = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/destinos/${id}`);
        return response.data;  // Retornamos los datos del destino
    } catch (error) {
        console.error('Error al obtener el destino:', error);
        throw error;  // Lanzamos el error para que pueda ser manejado en el componente
    }
};

export const getDestinoPorNombre = (nombre) => {
    return axios.get(`${API_URL}/destinos/nombre/${nombre}`); // Correcto
};

// ... otros servicios para destinos