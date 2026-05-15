import { useEffect, useMemo, useState } from "react";
import { getMyReservations, cancelReservation } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiEye,
  FiList,
  FiRefreshCw,
  FiRotateCcw,
  FiXCircle,
} from "react-icons/fi";
import Loader from "../components/Loader";
import SkeletonCard from "../components/SkeletonCard";

type ResItem = {
  id: number;
  court_id: number;
  court_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
};

// Comprueba si una reserva ya ha pasado comparando su fecha y hora con el momento actual
function isPast(dateISO: string, timeHHMM: string) {
  const dt = new Date(`${dateISO}T${timeHHMM}:00`);
  return dt.getTime() < Date.now();
}

// Formatea una fecha ISO a formato español (dd/mm/aaaa)
function formatDate(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString("es-ES");
}

function formatLongDate(dateISO: string) {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function reservationDateTime(r: ResItem) {
  return new Date(`${r.reservation_date}T${r.start_time}:00`).getTime();
}

function getVisualStatus(r: ResItem) {
  const status = String(r.status || "").toLowerCase();
  if (status === "cancelled" || status === "cancelada") return "cancelled";
  if (isPast(r.reservation_date, r.start_time)) return "past";
  if (status === "pending" || status === "pendiente") return "pending";
  return "confirmed";
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
  past: "Finalizada",
};

export default function MyReservations() {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, clubName } = useAuth();

  const [items, setItems] = useState<ResItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Agrupamos las reservas por fecha para mostrarlas por secciones
  const grouped = useMemo(() => {
    const map = new Map<string, ResItem[]>();

    items.forEach((r) => {
      const key = r.reservation_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    // Ordenamos de más reciente a más antigua
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  const upcoming = useMemo(
    () =>
      items
        .filter((r) => getVisualStatus(r) === "confirmed" || getVisualStatus(r) === "pending")
        .sort((a, b) => reservationDateTime(a) - reservationDateTime(b)),
    [items]
  );

  const nextReservation = upcoming[0] || null;
  const finishedCount = items.filter((r) => getVisualStatus(r) === "past").length;

  // Carga las reservas del usuario desde el backend
  async function load() {
    setMsg("");
    setError("");
    setLoading(true);

    try {
      const res = await getMyReservations();
      setItems(res.reservations || []);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar tus reservas");
    } finally {
      setLoading(false);
    }
  }

  // Cancela una reserva por su ID y recarga la lista
  async function onCancel(id: number) {
    setMsg("");
    setError("");

    try {
      await cancelReservation(id);
      setMsg("Reserva cancelada correctamente");
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo cancelar la reserva");
    }
  }

  // Solo cargamos si el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Si no hay sesión, mostramos un aviso en vez de la lista
  if (!isAuthenticated) {
    return (
      <motion.div
        className="my-reservations-page"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className="section-panel">
          <div className="page-header">
            <h1 className="page-title">Mis reservas</h1>
            <p className="page-subtitle">
              Debes iniciar sesión para ver y gestionar tus reservas.
            </p>
          </div>

          <div>
            <button
              type="button"
              className="button"
              onClick={() => navigate("/login")}
            >
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="my-reservations-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="section-panel my-reservations-panel">
        <div className="page-header-row">
          <div className="page-header">
            <span className="badge">Actividad del jugador</span>
            <h1 className="page-title">Mis reservas</h1>
            <p className="page-subtitle">
              {userEmail
                ? `Gestiona tus reservas, próximas partidas e historial de actividad.`
                : "Gestiona tus reservas activas"}
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="button"
              onClick={() => navigate("/reservar")}
            >
              <FiCalendar />
              Reservar pista
            </button>

            <button
              type="button"
              className="button-secondary"
              onClick={load}
              disabled={loading}
            >
              <FiRefreshCw />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="my-reservations-overview">
          <article className="my-next-card">
            <div className="my-next-card-top">
              <span className="my-section-kicker">Próxima reserva</span>
              <span className={`reservation-status ${nextReservation ? "confirmed" : "empty"}`}>
                {nextReservation ? "Confirmada" : "Sin reserva"}
              </span>
            </div>
            {nextReservation ? (
              <>
                <h2>{nextReservation.court_name}</h2>
                <p>
                  {formatLongDate(nextReservation.reservation_date)} · {nextReservation.start_time}
                  -{nextReservation.end_time}
                </p>
                <div className="my-next-meta">
                  <span><FiClock /> {nextReservation.start_time}</span>
                  <span><FiList /> ID #{nextReservation.id}</span>
                  <span>{clubName || "Club PADEX"}</span>
                </div>
              </>
            ) : (
              <>
                <h2>Sin reservas próximas</h2>
                <p>Reserva una pista y tu próxima partida aparecerá destacada aquí.</p>
              </>
            )}
            <div className="my-next-actions">
              <button type="button" className="button" onClick={() => navigate("/reservar")}>
                <FiRotateCcw />
                Reservar otra vez
              </button>
              <button type="button" className="button-secondary" onClick={load} disabled={loading}>
                <FiRefreshCw />
                Actualizar
              </button>
            </div>
          </article>

          <div className="my-reservation-stats">
            <div className="my-stat-card">
              <span>Activas</span>
              <strong>{upcoming.length}</strong>
            </div>
            <div className="my-stat-card">
              <span>Finalizadas</span>
              <strong>{finishedCount}</strong>
            </div>
            <div className="my-stat-card">
              <span>Total</span>
              <strong>{items.length}</strong>
            </div>
          </div>
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Skeleton mientras carga la primera vez */}
        {loading && items.length === 0 ? (
          <div className="page-loading">
            <Loader text="Cargando reservas..." />
            <div className="skeleton-grid">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : items.length === 0 ? (
          // Si no hay reservas mostramos un mensaje y botón para crear la primera
          <div className="my-reservations-empty">
            <FiCalendar />
            <h2>Aún no tienes reservas</h2>
            <p>Cuando reserves una pista, verás aquí tus próximas partidas y el historial del club.</p>
            <button
              type="button"
              className="button"
              onClick={() => navigate("/reservar")}
            >
              Crear mi primera reserva
            </button>
          </div>
        ) : (
          // Mostramos las reservas agrupadas por fecha
          <div className="res-groups my-timeline">
            {grouped.map(([date, list]) => (
              <section key={date} className="res-group">
                <div className="res-group-header">
                  <div>
                    <span className="my-section-kicker">Día de reserva</span>
                    <h2>{formatLongDate(date)}</h2>
                  </div>
                  <span className="badge">{list.length} reserva(s)</span>
                </div>

                <div className="reservation-grid my-reservation-grid">
                  {list
                    .slice()
                    .sort((a, b) => (a.start_time < b.start_time ? -1 : 1))
                    .map((r) => {
                      const visualStatus = getVisualStatus(r);
                      const isCancelable = visualStatus === "confirmed" || visualStatus === "pending";

                      return (
                        <div key={r.id} className={`reservation-card my-reservation-card is-${visualStatus}`}>
                          <div className="reservation-card-top">
                            <div>
                              <h3 className="res-card-court">{r.court_name}</h3>
                              <p className="res-card-datetime">
                                {formatDate(r.reservation_date)} · {r.start_time}–{r.end_time}
                              </p>
                            </div>

                            <span className={`reservation-status ${visualStatus}`}>
                              {STATUS_LABEL[visualStatus]}
                            </span>
                          </div>

                          <div className="my-reservation-details">
                            <div>
                              <span>Hora</span>
                              <strong>{r.start_time}-{r.end_time}</strong>
                            </div>
                            <div>
                              <span>Club</span>
                              <strong>{clubName || "PADEX"}</strong>
                            </div>
                            <div>
                              <span>Estado</span>
                              <strong>{STATUS_LABEL[visualStatus]}</strong>
                            </div>
                          </div>

                          <div className="res-card-meta">
                            <span className="res-card-id">ID #{r.id}</span>

                            <div className="my-reservation-actions">
                              <button
                                type="button"
                                className="button-secondary button-sm"
                                onClick={() => navigate("/reservar")}
                              >
                                <FiEye />
                                Ver disponibilidad
                              </button>
                              <button
                                type="button"
                                className="btn-danger button-sm"
                                onClick={() => onCancel(r.id)}
                                disabled={!isCancelable}
                                title={
                                  !isCancelable
                                    ? "No se puede cancelar una reserva finalizada"
                                    : "Cancelar reserva"
                                }
                              >
                                <FiXCircle />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
