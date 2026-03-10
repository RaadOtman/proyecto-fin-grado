import { useEffect, useMemo, useState } from "react";
import { getMyReservations, cancelReservation } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Loader from "../components/Loader";
import SkeletonCard from "../components/Skeletoncard";

type ResItem = {
  id: number;
  courtId: number;
  date: string;
  time: string;
};

function isPast(dateISO: string, timeHHMM: string) {
  const dt = new Date(`${dateISO}T${timeHHMM}:00`);
  return dt.getTime() < Date.now();
}

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

  const grouped = useMemo(() => {
    const map = new Map<string, ResItem[]>();

    items.forEach((r) => {
      const key = r.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

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

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem("padel_token")) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <motion.div
        className="my-reservations-page"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className="section-panel" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            Mis reservas
          </h1>
          <p className="page-subtitle">
            Debes iniciar sesión para ver y gestionar tus reservas.
          </p>

          <div style={{ marginTop: 16 }}>
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <span className="badge">Padex</span>
            <h1 className="page-title" style={{ fontSize: 30, marginTop: 12 }}>
              Mis reservas
            </h1>
            <p className="page-subtitle">
              {userEmail ? `Usuario: ${userEmail}` : "Gestiona tus reservas activas"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

        {loading && items.length === 0 ? (
          <div style={{ marginTop: 16 }}>
            <Loader text="Cargando reservas..." />
            <div className="skeleton-grid" style={{ marginTop: 16 }}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="reservation-card" style={{ marginTop: 14 }}>
            <p style={{ marginTop: 0, marginBottom: 12 }}>
              Aún no tienes reservas creadas.
            </p>

            <button
              type="button"
              className="button"
              onClick={() => navigate("/reservar")}
            >
              Crear mi primera reserva
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
            {grouped.map(([date, list]) => (
              <section key={date} className="section-panel" style={{ padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 18 }}>
                    {formatDate(date)}
                  </h2>
                  <span className="badge">{list.length} reserva(s)</span>
                </div>

                <div className="reservation-grid">
                  {list
                    .slice()
                    .sort((a, b) => (a.time < b.time ? -1 : 1))
                    .map((r) => {
                      const past = isPast(r.date, r.time);

                      return (
                        <div key={r.id} className="reservation-card">
                          <div className="reservation-card-top">
                            <div>
                              <h3 style={{ margin: 0, fontSize: 16 }}>
                                Pista {r.courtId}
                              </h3>
                              <p
                                style={{
                                  margin: "6px 0 0",
                                  color: "var(--text-soft)",
                                  fontSize: 13,
                                }}
                              >
                                {formatDate(r.date)} · {r.time}
                              </p>
                            </div>

                            <span
                              className={`reservation-status ${
                                past ? "past" : "active"
                              }`}
                            >
                              {past ? "Pasada" : "Activa"}
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: 14,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                              ID #{r.id}
                            </span>

                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => onCancel(r.id)}
                              disabled={past}
                              style={{
                                opacity: past ? 0.5 : 1,
                                cursor: past ? "not-allowed" : "pointer",
                              }}
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