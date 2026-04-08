import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiUsers, FiCalendar, FiBarChart2 } from "react-icons/fi";
import { getAdminStats } from "../../lib/adminApiClient";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminStats();
        setStats(data.stats);
        setTodayReservations(data.todayReservations || []);
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
      <motion.div className="admin-page-header" variants={fadeUp} initial="hidden" animate="show">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">{todayFormatted()}</p>
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
              />
            </motion.div>

            <motion.div variants={fadeUp} className="motion-list-item">
              <StatCard
                icon={<FiCalendar size={16} />}
                value={stats.reservationsToday}
                label="Reservas hoy"
                accent="green"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="motion-list-item">
              <StatCard
                icon={<FiBarChart2 size={16} />}
                value={stats.reservationsTotal}
                label="Reservas totales"
                accent="blue"
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
              <h2 className="admin-section-title">Reservas de hoy</h2>
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
              <div className="table-wrap">
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
