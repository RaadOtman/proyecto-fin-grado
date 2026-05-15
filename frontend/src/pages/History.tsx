import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiClock, FiFilter, FiMapPin, FiRefreshCw } from "react-icons/fi";
import Loader from "../components/Loader";
import { getReservationHistory } from "../lib/apiClient";

type HistoryItem = {
  id: number;
  club_id: number;
  club_name: string;
  court_id: number;
  court_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
};

function formatLongDate(dateISO: string) {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  if (status === "cancelled") return "Cancelada";
  if (status === "pending") return "Pendiente";
  return "Finalizada";
}

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getReservationHistory();
      setItems(data.reservations || []);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const clubs = useMemo(() => {
    return Array.from(new Map(items.map((item) => [item.club_id, item.club_name])).entries());
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const okClub = !clubFilter || String(item.club_id) === clubFilter;
      const okStatus = !statusFilter || item.status === statusFilter;
      return okClub && okStatus;
    });
  }, [items, clubFilter, statusFilter]);

  return (
    <motion.div
      className="history-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="page-header-row">
        <div>
          <span className="badge">Histórico</span>
          <h1 className="page-title">Historial de partidos</h1>
          <p className="page-subtitle">
            Consulta tus reservas finalizadas y canceladas en todos tus clubes.
          </p>
        </div>
        <button type="button" className="button-secondary" onClick={load} disabled={loading}>
          <FiRefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="section-panel history-filters">
        <div className="admin-section-header">
          <div>
            <span className="admin-section-kicker">Filtros</span>
            <h2 className="admin-section-title">
              <FiFilter size={15} />
              Buscar partidas
            </h2>
          </div>
        </div>
        <div className="form-grid-two">
          <div className="form-group">
            <label htmlFor="history-club">Club</label>
            <select id="history-club" className="input" value={clubFilter} onChange={(e) => setClubFilter(e.target.value)}>
              <option value="">Todos los clubes</option>
              {clubs.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="history-status">Estado</label>
            <select id="history-status" className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="confirmed">Finalizadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader text="Cargando historial..." />
      ) : filtered.length === 0 ? (
        <div className="section-panel empty-state">
          <div className="empty-state-icon">
            <FiCalendar size={20} />
          </div>
          <p className="empty-state-title">Sin partidos en el historial</p>
          <p className="empty-state-desc">Tus reservas pasadas y canceladas aparecerán aquí.</p>
        </div>
      ) : (
        <div className="history-timeline">
          {filtered.map((item) => (
            <article key={item.id} className="section-panel history-card">
              <div className="history-card-date">
                <FiCalendar />
                <span>{formatLongDate(item.reservation_date)}</span>
              </div>
              <div className="history-card-main">
                <h2>{item.court_name}</h2>
                <p>
                  <FiMapPin />
                  {item.club_name}
                </p>
              </div>
              <div className="history-card-meta">
                <span><FiClock /> {item.start_time}-{item.end_time}</span>
                <span className={`badge ${item.status === "cancelled" ? "badge-cancelled" : "badge-neutral"}`}>
                  {statusLabel(item.status)}
                </span>
                <span className="table-date">ID #{item.id}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </motion.div>
  );
}
