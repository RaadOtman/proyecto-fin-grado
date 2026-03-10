import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Reserve from "./pages/Reserve";
import MyReservations from "./pages/MyReservations";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/reservar" element={<Reserve />} />
          <Route path="/mis-reservas" element={<MyReservations />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}