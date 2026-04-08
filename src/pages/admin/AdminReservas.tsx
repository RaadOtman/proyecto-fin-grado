import { useEffect, useMemo, useState } from "react";
import { FiFilter, FiTrash2, FiRefreshCw, FiX, FiCalendar } from "react-icons/fi";
import {
  getAdminReservations,
  deleteAdminReservation,
  getAdminCourts,
} from "../../lib/adminApiClient";
import Loader from "../../components/Loader";

type Reservation = {
  id: number;
  court_id: number;
  court_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
  email: string;
  user_name: string;
};

type Court = { id: number; name: string };

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isPast(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() < Date.now();
}

function StatusBadge({ r }: { r: Reservation }) {
  if (r.status === "cancelled") {
    return <span className="badge badge-cancelled">Cancelada</span>;
  }
  if (isPast(r.reservation_date, r.start_time)) {
    return <span className="badge badge-past">Pasada</span>;
  }
  return <span className="badge">Activa</span>;
}

export default function AdminReservas() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const [filterDate, setFilterDate] = useState(todayISO);
  const [filterCourt, setFilterCourt] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState("confirmed");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminReservations({
        reservation_date: filterDate || undefined,
        court_id: filterCourt !== "" ? filterCourt : undefined,
        status: filterStatus || undefined,
      });
      setReservations(data.reservations || []);
    } catch (e: any) {
      setError(e?.message || "Error cargando reservas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAdminCourts()
      .then((d) => setCourts(d.courts || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, filterCourt, filterStatus]);

  function clearFilters() {
    setFilterDate("");
    setFilterCourt("");
    setFilterStatus("confirmed");
  }

  const hasFilters = filterDate !== "" || filterCourt !== "" || filterStatus !== "confirmed";

  const { upcoming, past } = useMemo(() => {
    const upcoming: Reservation[] = [];
    const past: Reservation[] = [];
    reservations.forEach((r) => {
      if (isPast(r.reservation_date, r.start_time)) past.push(r);
      else upcoming.push(r);
    });
    return { upcoming, past };
  }, [reservations]);

  async function handleCancel(r: Reservation) {
    if (
      !confirm(
        `¿Cancelar la reserva de ${r.user_name} el ${formatDate(r.reservation_date)} a las ${r.start_time}?`
      )
    )
      return;

    setBusy(r.id);
    setMsg("");
    setError("");
    try {
      await deleteAdminReservation(r.id);
      setMsg("Reserva cancelada correctamente");
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cancelando reserva");
    } finally {
      setBusy(null);
    }
  }

  function ReservationRow({ r, muted }: { r: Reservation; muted?: boolean }) {
    return (
      <tr className={muted ? "table-row-muted" : ""}>
        <td>
          <div className="table-email">{r.user_name}</div>
          <div className="table-sub">{r.email}</div>
        </td>
        <td>{r.court_name}</td>
        <td className="table-date">{formatDate(r.reservation_date)}</td>
        <td>
          <span className="time-chip">{r.start_time}</span>
        </td>
        <td>
          <StatusBadge r={r} />
        </td>
        <td>
          {r.status !== "cancelled" && (
            <button
              type="button"
              className="btn-danger button-sm"
              onClick={() => handleCancel(r)}
              disabled={busy === r.id}
              title={muted ? "Eliminar del historial" : "Cancelar reserva"}
            >
              <FiTrash2 size={12} />
              {muted ? "Eliminar" : "Cancelar"}
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Reservas</h1>
          <p className="admin-page-subtitle">
            Consulta y gestiona todas las reservas del club
          </p>
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={load}
          disabled={loading}
        >
          <FiRefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title admin-section-title--with-icon">
            <FiFilter size={14} />
            Filtros
          </h2>
          {hasFilters && (
            <button
              type="button"
              className="button-secondary button-sm"
              onClick={clearFilters}
            >
              <FiX size={12} />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="admin-filters">
          <div className="form-group">
            <label htmlFor="filter-date">Fecha</label>
            <input
              id="filter-date"
              type="date"
              className="input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="filter-court">Pista</label>
            <select
              id="filter-court"
              className="input"
              value={filterCourt}
              onChange={(e) =>
                setFilterCourt(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Todas las pistas</option>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filter-status">Estado</label>
            <select
              id="filter-status"
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="confirmed">Activas</option>
              <option value="cancelled">Canceladas</option>
              <option value="">Todas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Resultados</h2>
          <span className="admin-count">
            {reservations.length} reserva{reservations.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <Loader text="Cargando reservas..." />
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FiCalendar size={20} />
            </div>
            <p className="empty-state-title">Sin resultados</p>
            <p className="empty-state-desc">
              No hay reservas para los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Pista</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((r) => (
                  <ReservationRow key={r.id} r={r} />
                ))}
                {past.map((r) => (
                  <ReservationRow key={r.id} r={r} muted />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
