// src/pages/Reserve.tsx
import { useEffect, useState } from "react";
import { getAvailability, reserveCourt } from "../lib/apiClient";

type Slot = {
  time: string;
  status: "FREE" | "OCCUPIED";
};

type Court = {
  id: number;
  name: string;
  type: string;
  slots: Slot[];
};

type AvailabilityResponse = {
  date: string;
  timeSlots: string[];
  courts: Court[];
};

export default function Reserve() {
  const [date, setDate] = useState("2025-11-20");
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar disponibilidad
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const data = await getAvailability(date);
        setAvailability(data);
      } catch (err: any) {
        setError(err.message ?? "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [date]);

  // Evento de reservar pista
  async function handleReserve(courtId: number, time: string) {
    try {
      setSuccess(null);
      setError(null);

      const res = await reserveCourt(courtId, date, time);

      setSuccess(
        `Reserva completada: Pista ${courtId}, ${date} a las ${time}`
      );

      // Volvemos a cargar disponibilidad actualizada
      const data = await getAvailability(date);
      setAvailability(data);
    } catch (err: any) {
      setError(err.message ?? "Error al reservar");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: 20 }}>Reservar pista</h1>

      {/* Selector de fecha */}
      <label style={{ fontWeight: 500 }}>
        Selecciona fecha:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            marginLeft: 12,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />
      </label>

      <div style={{ height: 20 }} />

      {/* Mensajes */}
      {loading && <p>Cargando disponibilidad...</p>}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {success && <p style={{ color: "green", fontWeight: "bold" }}>{success}</p>}

      {/* Lista de pistas */}
      {availability && (
        <div>
          <h2 style={{ marginTop: 0 }}>
            Disponibilidad para {availability.date}
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginTop: 20,
            }}
          >
            {availability.courts.map((court) => (
              <div
                key={court.id}
                style={{
                  background: "#ffffff",
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  {court.name} — {court.type}
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {court.slots.map((slot) => (
                    <div
                      key={slot.time}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px",
                        background:
                          slot.status === "OCCUPIED" ? "#fee2e2" : "#dcfce7",
                        borderRadius: 999,
                      }}
                    >
                      <span
                        style={{
                          color:
                            slot.status === "OCCUPIED"
                              ? "#b91c1c"
                              : "#166534",
                        }}
                      >
                        {slot.time}
                      </span>

                      {slot.status === "FREE" && (
                        <button
                          onClick={() =>
                            handleReserve(court.id, slot.time)
                          }
                          style={{
                            padding: "4px 10px",
                            borderRadius: 8,
                            background: "#059669",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Reservar
                        </button>
                      )}

                      {slot.status === "OCCUPIED" && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#b91c1c",
                            fontWeight: 600,
                          }}
                        >
                          Ocupada
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!availability && !loading && !error && (
        <p>No hay datos disponibles.</p>
      )}
    </div>
  );
}