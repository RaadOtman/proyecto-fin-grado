import { useEffect, useMemo, useState } from "react";
import { createReservation, getAvailability } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Loader from "../components/Loader";
import SkeletonCard from "../components/Skeletoncard";

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

  async function reserve(courtId: number, time: string) {
    setMsg("");
    setError("");

    if (!isAuthenticated || !localStorage.getItem("padel_token")) {
      setError("Debes iniciar sesión para reservar.");
      setTimeout(() => navigate("/login"), 700);
      return;
    }

    try {
      const r = await createReservation({ courtId, date, time });
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
        <div style={{ marginBottom: 18 }}>
          <span className="badge">Padex</span>
          <h1 className="page-title" style={{ fontSize: 30, marginTop: 12 }}>
            Reservar pista
          </h1>
          <p className="page-subtitle">
            Selecciona una fecha y elige un tramo libre.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "end",
            marginBottom: 16,
          }}
        >
          <div style={{ minWidth: 220 }}>
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
            {loading ? "Cargando..." : "Buscar disponibilidad"}
          </button>

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
          <div style={{ marginTop: 16 }}>
            <Loader text="Cargando disponibilidad..." />
            <div className="skeleton-grid" style={{ marginTop: 16 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : !data ? (
          <p className="page-subtitle" style={{ marginTop: 14 }}>
            No hay datos disponibles todavía.
          </p>
        ) : (
          <div className="reservation-grid" style={{ marginTop: 16 }}>
            {courts.map((court) => (
              <div key={court.id} className="reservation-card">
                <div className="reservation-card-top">
                  <div>
                    <h3 style={{ margin: 0 }}>{court.name}</h3>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "var(--text-soft)",
                        fontSize: 13,
                      }}
                    >
                      {court.type}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 14,
                  }}
                >
                  {court.slots.map((slot) => {
                    const isFree = slot.status === "FREE";

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => reserve(court.id, slot.time)}
                        disabled={!isFree}
                        className={`slot-btn ${isFree ? "slot-free" : "slot-busy"} ${
                          !isFree ? "slot-disabled" : ""
                        }`}
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