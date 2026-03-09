import { useEffect, useMemo, useState } from "react";
import { createReservation, getAvailability } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

  const courts = useMemo(() => data?.courts || [], [data]);

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const res = await getAvailability(date);
      setData(res);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Error cargando disponibilidad"}`);
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

    if (!isAuthenticated || !localStorage.getItem("padel_token")) {
      setMsg("🔐 Debes iniciar sesión para reservar.");
      setTimeout(() => navigate("/login"), 600);
      return;
    }

    try {
      const r = await createReservation({ courtId, date, time });
      setMsg(`✅ Reserva creada (ID ${r.reservationId})`);
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Error reservando"}`);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 6 }}>Reservar pista</h1>
      <p style={{ marginTop: 0, opacity: 0.75 }}>
        Selecciona fecha y elige un tramo libre.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={load} disabled={loading}>
          {loading ? "Cargando..." : "Buscar disponibilidad"}
        </button>
        <button onClick={() => navigate("/mis-reservas")}>📋 Mis reservas</button>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 12,
          }}
        >
          {msg}
        </div>
      )}

      {!data ? (
        <p style={{ opacity: 0.7 }}>No hay datos aún.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {courts.map((court) => (
            <div
              key={court.id}
              style={{
                borderRadius: 16,
                padding: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    🎾 {court.name}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    {court.type} · {court.slots.length} tramos
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {court.slots.map((s) => (
                  <button
                    key={s.time}
                    onClick={() => reserve(court.id, s.time)}
                    disabled={s.status !== "FREE"}
                    title={s.status}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.14)",
                      cursor: s.status === "FREE" ? "pointer" : "not-allowed",
                      opacity: s.status === "FREE" ? 1 : 0.45,
                      background:
                        s.status === "FREE"
                          ? "rgba(34,197,94,0.18)"
                          : "rgba(239,68,68,0.14)",
                      color: "white",
                      fontWeight: 900,
                      fontSize: 12,
                    }}
                  >
                    {s.status === "FREE" ? "✅" : "⛔"} {s.time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}