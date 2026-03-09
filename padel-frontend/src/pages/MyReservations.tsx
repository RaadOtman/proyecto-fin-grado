import { useEffect, useMemo, useState } from "react";
import { cancelReservation, getMyReservations } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

export default function MyReservations() {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail } = useAuth();

  const [items, setItems] = useState<ResItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, ResItem[]>();
    items.forEach((r) => {
      const key = r.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    // ordenar por fecha desc
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const res = await getMyReservations();
      setItems(res.reservations || []);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Error cargando tus reservas"}`);
    } finally {
      setLoading(false);
    }
  }

  async function onCancel(id: number) {
    setMsg("");
    try {
      await cancelReservation(id);
      setMsg("✅ Reserva cancelada");
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "No se pudo cancelar"}`);
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem("padel_token")) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <h1>Mis reservas</h1>
        <p>🔐 Debes iniciar sesión para ver tus reservas.</p>
        <button onClick={() => navigate("/login")}>Ir a Login</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Mis reservas</h1>
          <p style={{ marginTop: 0, opacity: 0.75 }}>
            👤 {userEmail || "usuario"} · aquí puedes ver y cancelar tus reservas.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/reservar")}>🎾 Reservar</button>
          <button onClick={load} disabled={loading}>
            {loading ? "Actualizando..." : "🔄 Actualizar"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {msg}
        </div>
      )}

      {loading && !items.length ? (
        <p style={{ marginTop: 14, opacity: 0.7 }}>Cargando...</p>
      ) : items.length === 0 ? (
        <div style={{ marginTop: 14, opacity: 0.85 }}>
          <p>📭 Aún no tienes reservas.</p>
          <button onClick={() => navigate("/reservar")}>Crear mi primera reserva</button>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
          {grouped.map(([date, list]) => (
            <section key={date} style={styles.section}>
              <div style={styles.sectionHead}>
                <div style={{ fontWeight: 900 }}>📅 {date}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{list.length} reserva(s)</div>
              </div>

              <div style={styles.grid}>
                {list
                  .slice()
                  .sort((a, b) => (a.time < b.time ? -1 : 1))
                  .map((r) => {
                    const past = isPast(r.date, r.time);
                    return (
                      <div key={r.id} style={{ ...styles.card, ...(past ? styles.cardPast : {}) }}>
                        <div style={styles.cardTop}>
                          <div style={{ fontWeight: 900, fontSize: 14 }}>
                            🎾 Pista {r.courtId}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>
                            ⏰ {r.time}
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                          <span
                            style={{
                              ...styles.badge,
                              background: past ? "rgba(148,163,184,0.18)" : "rgba(34,197,94,0.18)",
                              borderColor: past ? "rgba(148,163,184,0.25)" : "rgba(34,197,94,0.25)",
                            }}
                          >
                            {past ? "⏳ Pasada" : "✅ Activa"}
                          </span>

                          <button
                            onClick={() => onCancel(r.id)}
                            disabled={past}
                            style={{
                              ...styles.btn,
                              opacity: past ? 0.45 : 1,
                              cursor: past ? "not-allowed" : "pointer",
                            }}
                            title={past ? "No se puede cancelar una reserva pasada" : "Cancelar reserva"}
                          >
                            🗑️ Cancelar
                          </button>
                        </div>

                        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>
                          ID: {r.id}
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
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
  },
  cardPast: {
    filter: "grayscale(0.3)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  badge: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
  },
  btn: {
    borderRadius: 12,
    padding: "8px 10px",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(239,68,68,0.14)",
    color: "white",
  },
};