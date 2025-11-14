import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Reserve from './pages/Reserve';
import MyReservations from './pages/MyReservations';
import BackendStatus from './components/BackendStatus';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reservar" element={<Reserve />} />
          <Route path="/mis-reservas" element={<MyReservations />} />
          <Route path="/debug-backend" element={<BackendStatus />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
