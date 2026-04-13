import { useEffect, useState } from "react";
import { createReservation, getAvailability } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

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

type AvailabilityData = {
  date: string;
  timeSlots: string[];
  courts: Court[];
};

export default function CalendarioReservas() {
  const { isAuthenticated } = useAuth();
  const [fecha, setFecha] = useState("");
  const [datos, setDatos] = useState<AvailabilityData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];
    setFecha(hoy);
  }, []);

  useEffect(() => {
    if (fecha) {
      cargarDisponibilidad(fecha);
    }
  }, [fecha]);

  async function cargarDisponibilidad(fechaSeleccionada: string) {
    try {
      setCargando(true);
      setMensaje("");
      setError("");

      const response = await getAvailability(fechaSeleccionada);
      setDatos(response);
    } catch (err) {
      const mensajeError =
        err instanceof Error ? err.message : "Error al cargar disponibilidad";
      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  }

  async function reservar(courtId: number, time: string) {
    try {
      setMensaje("");
      setError("");

      if (!isAuthenticated) {
        setError("Tienes que iniciar sesión para reservar");
        return;
      }

      await createReservation({
        courtId,
        date: fecha,
        time,
      });

      setMensaje("Reserva creada correctamente");
      await cargarDisponibilidad(fecha);
    } catch (err) {
      const mensajeError =
        err instanceof Error ? err.message : "Error al crear la reserva";
      setError(mensajeError);
    }
  }

  return (
    <section>
      <h2>Reservar pista</h2>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="fecha">Fecha: </label>
        <input
          id="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {cargando && <p>Cargando disponibilidad...</p>}
      {mensaje && <p>{mensaje}</p>}
      {error && <p>{error}</p>}

      {datos?.courts?.map((court) => (
        <div
          key={court.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <h3>{court.name}</h3>
          <p>{court.type}</p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            {court.slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => reservar(court.id, slot.time)}
                disabled={slot.status === "OCCUPIED"}
                style={{
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: slot.status === "OCCUPIED" ? "not-allowed" : "pointer",
                  backgroundColor:
                    slot.status === "OCCUPIED" ? "#9ca3af" : "#2563eb",
                  color: "white",
                }}
              >
                {slot.time} - {slot.status === "OCCUPIED" ? "Ocupada" : "Libre"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}