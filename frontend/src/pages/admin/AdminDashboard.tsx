import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiUsers, FiCalendar, FiBarChart2, FiActivity, FiClock, FiGrid } from "react-icons/fi";
import { getAdminCourts, getAdminStats } from "../../lib/adminApiClient";
import Loader from "../../components/Loader";
import StatCard from "../../components/admin/StatCard";

type Stats = {
  usersTotal: number;
  reservationsToday: number;
  reservationsTotal: number;
};

type TodayReservation = {
  id: number;
  court_id: number;
  court_name: string;
  start_time: string;
  email: string;
  user_name: string;
};

function todayFormatted() {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayReservations, setTodayReservations] = useState<TodayReservation[]>([]);
  const [activeCourts, setActiveCourts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const estimatedOccupancy = stats
    ? stats.reservationsToday > 0
      ? Math.min(100, Math.round((stats.reservationsToday / Math.max(stats.reservationsTotal, 1)) * 100))
      : 0
    : 0;

  useEffect(() => {
    async function load() {
      try {
        const [data, courtsData] = await Promise.all([getAdminStats(), getAdminCourts()]);
        setStats(data.stats);
        setTodayReservations(data.todayReservations || []);
        setActiveCourts(
          (courtsData.courts || []).filter((court: { status?: string }) => court.status === "active").length
        );
      } catch (e: any) {
        setError(e?.message || "Error cargando estadísticas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="admin-page">
      <motion.div className="admin-page-header admin-dashboard-hero" variants={fadeUp} initial="hidden" animate="show">
        <div>
          <span className="admin-hero-kicker">Panel del club</span>
          <h1 className="admin-page-title">Centro de control</h1>
          <p className="admin-page-subtitle">
            Vista operativa para reservas, usuarios y actividad diaria del club.
          </p>
          <div className="admin-hero-meta">
            <span><FiClock size={13} /> {todayFormatted()}</span>
            <span><FiActivity size={13} /> Operación activa</span>
          </div>
        </div>
        <div className="admin-hero-card">
          <span>Reservas hoy</span>
          <strong>{stats?.reservationsToday ?? "..."}</strong>
          <p>{todayReservations.length} en agenda visible</p>
        </div>
      </motion.div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader text="Cargando datos del club..." />
      ) : stats ? (
        <>
          <motion.div
            className="stat-grid"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="motion-list-item">
              <StatCard
                icon={<FiUsers size={16} />}
                value={stats.usersTotal}
                label="Usuarios registrados"
                accent="default"
                trend={{ value: "Base de clientes", direction: "neutral" }}
              />
            </motion.div>

            <motion.div variants={fadeUp} className="motion-list-item">
              <StatCard
                icon={<FiCalendar size={16} />}
                value={stats.reservationsToday}
                label="Reservas hoy"
                accent="green"
                trend={{ value: todayReservations.length ? "Con actividad" : "Sin agenda hoy", direction: todayReservations.length ? "up" : "neutral" }}
              />
            </motion.div>

            <motion.div variants={fadeUp} className="motion-list-item">
              <StatCard
                icon={<FiGrid size={16} />}
                value={activeCourts}
                label="Pistas activas"
                accent="blue"
                trend={{ value: "Inventario disponible", direction: activeCourts > 0 ? "up" : "neutral" }}
              />
            </motion.div>

            <motion.div variants={fadeUp} className="motion-list-item">
              <StatCard
                icon={<FiBarChart2 size={16} />}
                value={`${estimatedOccupancy}%`}
                label="Ocupación estimada"
                accent="amber"
                trend={{ value: "Basado en actividad diaria", direction: estimatedOccupancy > 0 ? "up" : "neutral" }}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="admin-section"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.26 }}
          >
            <div className="admin-section-header">
              <div>
                <span className="admin-section-kicker">Agenda operativa</span>
                <h2 className="admin-section-title">Reservas de hoy</h2>
              </div>
              <span className="badge">
                {todayReservations.length} reserva{todayReservations.length !== 1 ? "s" : ""}
              </span>
            </div>

            {todayReservations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FiCalendar size={20} />
                </div>
                <p className="empty-state-title">Sin reservas hoy</p>
                <p className="empty-state-desc">
                  No hay reservas confirmadas para el día de hoy.
                </p>
              </div>
            ) : (
              <div className="table-wrap admin-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Pista</th>
                      <th>Hora</th>
                      <th>Usuario</th>
                      <th>ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayReservations.map((r) => (
                      <tr key={r.id}>
                        <td className="table-email">{r.court_name}</td>
                        <td>
                          <span className="time-chip">{r.start_time}</span>
                        </td>
                        <td>
                          <div className="table-email">{r.user_name}</div>
                          <div className="table-sub">{r.email}</div>
                        </td>
                        <td className="table-id">#{r.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
