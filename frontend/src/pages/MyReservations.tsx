import { useEffect, useMemo, useState } from "react";
import { getMyReservations, cancelReservation } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

export default function MyReservations() {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail } = useAuth();

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
      <div className="section-panel">
        <div className="page-header-row">
          <div className="page-header">
            <span className="badge">Padex</span>
            <h1 className="page-title">Mis reservas</h1>
            <p className="page-subtitle">
              {userEmail ? `Usuario: ${userEmail}` : "Gestiona tus reservas activas"}
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="button"
              onClick={() => navigate("/reservar")}
            >
              Reservar pista
            </button>

            <button
              type="button"
              className="button-secondary"
              onClick={load}
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
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
          <div className="reservation-card">
            <p className="page-empty">Aún no tienes reservas creadas.</p>
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
          <div className="res-groups">
            {grouped.map(([date, list]) => (
              <section key={date} className="res-group">
                <div className="res-group-header">
                  <h2>{formatDate(date)}</h2>
                  <span className="badge">{list.length} reserva(s)</span>
                </div>

                <div className="reservation-grid">
                  {list
                    .slice()
                    .sort((a, b) => (a.start_time < b.start_time ? -1 : 1))
                    .map((r) => {
                      const past = isPast(r.reservation_date, r.start_time);

                      return (
                        <div key={r.id} className="reservation-card">
                          <div className="reservation-card-top">
                            <div>
                              <h3 className="res-card-court">{r.court_name}</h3>
                              <p className="res-card-datetime">
                                {formatDate(r.reservation_date)} · {r.start_time}–{r.end_time}
                              </p>
                            </div>

                            {/* Etiqueta que indica si la reserva es futura o ya pasó */}
                            <span className={`reservation-status ${past ? "past" : "active"}`}>
                              {past ? "Pasada" : "Activa"}
                            </span>
                          </div>

                          <div className="res-card-meta">
                            <span className="res-card-id">ID #{r.id}</span>

                            {/* Solo se puede cancelar si la reserva es futura */}
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => onCancel(r.id)}
                              disabled={past}
                              title={
                                past
                                  ? "No se puede cancelar una reserva pasada"
                                  : "Cancelar reserva"
                              }
                            >
                              Cancelar
                            </button>
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
