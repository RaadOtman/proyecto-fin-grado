import { useEffect, useMemo, useState } from "react";
import { createReservation, getAvailability } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiMapPin,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
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

// Devuelve la fecha de hoy en formato YYYY-MM-DD para el input de tipo date
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Reserve() {
  const navigate = useNavigate();
  const { isAuthenticated, clubId, clubName } = useAuth();

  // Estado de la fecha seleccionada, los datos de disponibilidad y mensajes
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{
    courtId: number;
    courtName: string;
    time: string;
  } | null>(null);

  // El mensaje de éxito desaparece solo después de 4 segundos
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  // El mensaje de error desaparece solo después de 5 segundos
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // Sacamos las pistas del objeto de disponibilidad
  const courts = useMemo(() => data?.courts || [], [data]);
  const freeSlots = useMemo(
    () => courts.reduce((total, court) => total + court.slots.filter((slot) => slot.status === "FREE").length, 0),
    [courts]
  );

  // Consulta la disponibilidad para la fecha seleccionada
  async function load() {
    setMsg("");
    setError("");
    setSelectedSlot(null);
    setLoading(true);

    try {
      if (!clubId) {
        setData(null);
        setError("Selecciona un club antes de consultar disponibilidad.");
        return;
      }
      const res = await getAvailability(date, clubId);
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Error cargando disponibilidad");
    } finally {
      setLoading(false);
    }
  }

  // Cargamos la disponibilidad al entrar en la página
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // Crea una reserva cuando el usuario hace clic en un slot libre
  async function reserve(court_id: number, start_time: string) {
    setMsg("");
    setError("");

    // Si no está autenticado lo mandamos a login
    if (!isAuthenticated) {
      setError("Debes iniciar sesión para reservar.");
      setTimeout(() => navigate("/login"), 700);
      return;
    }

    // Bloqueamos los botones mientras se procesa la petición (evita doble clic)
    setReserving(true);
    try {
      const r = await createReservation({ court_id, reservation_date: date, start_time });
      setMsg(`Reserva creada correctamente (ID ${r.reservationId})`);
      // Recargamos la disponibilidad para que el slot aparezca como ocupado
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo crear la reserva");
    } finally {
      setReserving(false);
    }
  }

  function confirmSelectedSlot() {
    if (!selectedSlot) return;
    reserve(selectedSlot.courtId, selectedSlot.time);
  }

  return (
    <motion.div
      className="reserve-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="section-panel reserve-panel">
        <div className="reserve-header">
          <div className="page-header">
            <span className="badge">Reserva guiada</span>
            <h1 className="page-title">Reservar pista</h1>
            <p className="page-subtitle">
              Elige club, fecha, pista y hora. Confirma solo cuando tengas el tramo seleccionado.
            </p>
          </div>

          <div className="reserve-summary">
            <div className="reserve-summary-item">
              <span>Club</span>
              <strong>{clubName || (clubId ? "Club seleccionado" : "Sin club seleccionado")}</strong>
            </div>
            <div className="reserve-summary-item">
              <span>Fecha</span>
              <strong>{date}</strong>
            </div>
            <div className="reserve-summary-item">
              <span>Disponibles</span>
              <strong>{data ? freeSlots : "..."}</strong>
            </div>
          </div>
        </div>

        <div className="reserve-flow" aria-label="Flujo de reserva">
          <div className={`reserve-flow-step ${clubId ? "is-complete" : "is-pending"}`}>
            <span><FiMapPin /></span>
            <div>
              <strong>Club</strong>
              <p>{clubName || (clubId ? "Club seleccionado" : "Selecciona tu club")}</p>
            </div>
          </div>
          <div className="reserve-flow-step is-complete">
            <span><FiCalendar /></span>
            <div>
              <strong>Fecha</strong>
              <p>{date}</p>
            </div>
          </div>
          <div className={`reserve-flow-step ${selectedSlot ? "is-complete" : "is-current"}`}>
            <span><FiGrid /></span>
            <div>
              <strong>Pista y hora</strong>
              <p>{selectedSlot ? `${selectedSlot.courtName} · ${selectedSlot.time}` : "Elige un tramo libre"}</p>
            </div>
          </div>
          <div className={`reserve-flow-step ${selectedSlot ? "is-current" : "is-pending"}`}>
            <span><FiCheckCircle /></span>
            <div>
              <strong>Confirmar</strong>
              <p>{selectedSlot ? "Listo para reservar" : "Pendiente"}</p>
            </div>
          </div>
        </div>

        <div className="page-toolbar reserve-toolbar">
          <div className="page-toolbar-left reserve-toolbar-left">
            <div className="date-field">
              <label htmlFor="reserve-date">Fecha</label>
              <input
                id="reserve-date"
                className="input"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                }}
              />
            </div>
            <button type="button" className="button" onClick={load} disabled={loading}>
              <FiRefreshCw />
              {loading ? "Actualizando..." : "Buscar disponibilidad"}
            </button>
          </div>

          {!clubId && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/mi-club")}
            >
              <FiMapPin />
              Elegir club
            </button>
          )}

          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate("/mis-reservas")}
          >
            <FiClock />
            Mis reservas
          </button>
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Mostramos skeleton cards mientras carga por primera vez */}
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
          <div className="reserve-empty-state">
            <FiGrid />
            <strong>No hay datos disponibles todavía</strong>
            <p>Prueba a buscar disponibilidad de nuevo o selecciona otra fecha.</p>
            <button type="button" className="button-secondary" onClick={load}>
              Reintentar
            </button>
          </div>
        ) : courts.length === 0 ? (
          <div className="reserve-empty-state">
            <FiShield />
            <strong>No hay pistas activas</strong>
            <p>El club no tiene pistas disponibles para mostrar en este momento.</p>
          </div>
        ) : (
          // Grid con una card por cada pista
          <>
            <div className="reserve-availability-header">
              <div>
                <span className="reserve-section-kicker">Disponibilidad</span>
                <h2>Pistas y horarios</h2>
              </div>
              <div className="reserve-legend">
                <span><i className="legend-dot free" /> Disponible</span>
                <span><i className="legend-dot busy" /> Ocupado</span>
                <span><i className="legend-dot selected" /> Seleccionado</span>
              </div>
            </div>

            <div className="reservation-grid reserve-courts-grid">
              {courts.map((court) => {
                const courtFreeSlots = court.slots.filter((slot) => slot.status === "FREE").length;
                return (
                  <div key={court.id} className="reservation-card reserve-court-card">
                    <div className="court-header">
                      <div>
                        <h3 className="court-name">{court.name}</h3>
                        <p className="reserve-court-meta">
                          {courtFreeSlots > 0 ? `${courtFreeSlots} horarios libres` : "Sin horarios libres"}
                        </p>
                      </div>
                      <span className="court-type">{court.type}</span>
                    </div>

                    {/* Los slots en verde están libres, los grises están ocupados */}
                    <div className="slots-grid reserve-slots-grid">
                      {court.slots.map((slot) => {
                        const isFree = slot.status === "FREE";
                        const isSelected =
                          selectedSlot?.courtId === court.id && selectedSlot.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() =>
                              setSelectedSlot({ courtId: court.id, courtName: court.name, time: slot.time })
                            }
                            disabled={!isFree || reserving}
                            className={`slot-btn ${isFree ? "slot-free" : "slot-busy slot-disabled"} ${
                              isSelected ? "slot-selected" : ""
                            }`}
                            title={isFree ? "Disponible" : "Ocupado"}
                            aria-pressed={isSelected}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="reserve-confirm-bar">
              <div>
                <span>Selección actual</span>
                <strong>
                  {selectedSlot
                    ? `${selectedSlot.courtName} · ${date} · ${selectedSlot.time}`
                    : "Elige un horario disponible para continuar"}
                </strong>
              </div>
              <button
                type="button"
                className="button"
                onClick={confirmSelectedSlot}
                disabled={!selectedSlot || reserving}
              >
                <FiCheckCircle />
                {reserving ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
