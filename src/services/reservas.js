import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Asegúrate de que esto coincida con tu backend

export const crearReserva = (reservaData) => {
    return axios.post(`${API_URL}/reservas/new`, reservaData);
};

// Puedes agregar más funciones aquí si necesitas otras operaciones con reservas