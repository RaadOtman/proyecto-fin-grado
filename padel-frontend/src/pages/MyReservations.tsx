// src/pages/MyReservations.tsx
import { useEffect, useState } from "react";
import { getReservations, cancelReservation } from "../lib/apiClient";

type Reservation = {
  id: number;
  courtId: number;
  date: string;
  time: string;
};

type ReservationsResponse = {
  count: number;
  reservations: Reservation[];
};

export default function MyReservations() {
  const [dateFilter, setDateFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReservationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadReservations(date?: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await getReservations(date);
      setData(res);
    } catch (err: any) {
      setError(err.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // Cargar al entrar
  useEffect(() => {
    loadReservations();
  }, []);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadReservations(dateFilter || undefined);
  }

  async function handleCancel(id: number) {
    try {
      setError(null);
      setSuccess(null);
      const res = await cancelReservation(id);
      setSuccess(res.message ?? `Reserva ${id} cancelada`);

      // Recargar lista con el mismo filtro
      await loadReservations(dateFilter || undefined);
    } catch (err: any) {
      setError(err.message ?? "Error al cancelar");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: 16 }}>Mis reservas (modo demo)</h1>

      <form
        onSubmit={handleFilterSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <label style={{ fontSize: 14 }}>
          Filtrar por fecha:
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              marginLeft: 8,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Aplicar
        </button>
      </form>

      {loading && <p>Cargando reservas...</p>}
      {error && (
        <p style={{ color: "red", fontWeight: "bold", marginBottom: 8 }}>
          Error: {error}
        </p>
      )}
      {success && (
        <p style={{ color: "green", fontWeight: "bold", marginBottom: 8 }}>
          {success}
        </p>
      )}

      {data && (
        <div>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Total reservas encontradas: <strong>{data.count}</strong>
          </p>

          {data.count === 0 && (
            <p style={{ marginTop: 8 }}>
              No hay reservas todavía. Prueba a crear alguna desde{" "}
              <strong>Reservar pista</strong>.
            </p>
          )}

          {data.count > 0 && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {data.reservations.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <div>
                    <div>
                      <strong>Reserva #{r.id}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: "#4b5563" }}>
                      Pista {r.courtId} · {r.date} a las {r.time}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#2563eb",
                        background: "#eff6ff",
                        borderRadius: 999,
                        padding: "4px 10px",
                      }}
                    >
                      Confirmada
                    </span>
                    <button
                      onClick={() => handleCancel(r.id)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "#ef4444",
                        color: "white",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && <p>No hay datos cargados.</p>}
    </div>
  );
}