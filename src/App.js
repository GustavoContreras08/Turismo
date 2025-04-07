import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import DestinoDetalle from './pages/DestinoDetalle';
import NuevaReserva from './pages/NuevaReserva';

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="destinos/:id"element={<DestinoDetalle />} />
        <Route path="/reservas/nuevo/:nombreDestino" element={<NuevaReserva />} />
        /* otras rutas */
      </Routes>
    </Router>
  );
}

export default App;