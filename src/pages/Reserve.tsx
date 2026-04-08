import { useEffect, useMemo, useState } from "react";
import { createReservation, getAvailability } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Loader from "../components/Loader";
import SkeletonCard from "../components/SkeletonCard";

type Availability = {
  date: string;
  timeSlots: string[];
  courts: {
    id: number;
    name: string;
    type: string;
    slots: { time: string; status: "FREE" | "OCCUPIED" }[];
  }[];
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Reserve() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const courts = useMemo(() => data?.courts || [], [data]);

  async function load() {
    setMsg("");
    setError("");
    setLoading(true);

    try {
      const res = await getAvailability(date);
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Error cargando disponibilidad");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reserve(court_id: number, start_time: string) {
    setMsg("");
    setError("");

    if (!isAuthenticated) {
      setError("Debes iniciar sesión para reservar.");
      setTimeout(() => navigate("/login"), 700);
      return;
    }

    try {
      const r = await createReservation({ court_id, reservation_date: date, start_time });
      setMsg(`Reserva creada correctamente (ID ${r.reservationId})`);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo crear la reserva");
    }
  }

  return (
    <motion.div
      className="reserve-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="section-panel">
        <div className="page-header">
          <h1 className="page-title">Reservar pista</h1>
          <p className="page-subtitle">Selecciona una fecha y elige un tramo libre.</p>
        </div>

        <div className="page-toolbar">
          <div className="page-toolbar-left">
            <div className="date-field">
              <label htmlFor="reserve-date">Fecha</label>
              <input
                id="reserve-date"
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <button type="button" className="button" onClick={load} disabled={loading}>
              {loading ? "Cargando..." : "Buscar"}
            </button>
          </div>

          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate("/mis-reservas")}
          >
            Mis reservas
          </button>
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {loading && !data ? (
          <div className="page-loading">
            <Loader text="Cargando disponibilidad..." />
            <div className="skeleton-grid">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : !data ? (
          <p className="page-empty">No hay datos disponibles todavía.</p>
        ) : (
          <div className="reservation-grid">
            {courts.map((court) => (
              <div key={court.id} className="reservation-card">
                <div className="court-header">
                  <h3 className="court-name">{court.name}</h3>
                  <span className="court-type">{court.type}</span>
                </div>

                <div className="slots-grid">
                  {court.slots.map((slot) => {
                    const isFree = slot.status === "FREE";
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => reserve(court.id, slot.time)}
                        disabled={!isFree}
                        className={`slot-btn ${isFree ? "slot-free" : "slot-busy slot-disabled"}`}
                        title={isFree ? "Disponible" : "Ocupado"}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}