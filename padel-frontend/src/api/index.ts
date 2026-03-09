import { API_BASE_URL } from "../config/api";

export type AvailabilityResponse = {
  date: string;
  timeSlots: string[];
  courts: {
    id: number;
    name: string;
    type: string;
    slots: {
      time: string;
      status: "FREE" | "OCCUPIED";
    }[];
  }[];
};

export type Reservation = {
  id: number;
  courtId: number;
  date: string;
  time: string;
  userEmail: string;
};

export async function getAvailability(date: string): Promise<AvailabilityResponse> {
  const res = await fetch(
    `${API_BASE_URL}/availability?date=${encodeURIComponent(date)}`
  );
  if (!res.ok) throw new Error("Error obteniendo disponibilidad");
  return res.json();
}

export async function createReservation(payload: {
  courtId: number;
  date: string;
  time: string;
  userEmail: string;
}) {
  const res = await fetch(`${API_BASE_URL}/reserve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error creando reserva");
  return data;
}

export async function getMyReservations(userEmail: string) {
  const res = await fetch(
    `${API_BASE_URL}/reservations?userEmail=${encodeURIComponent(userEmail)}`
  );
  if (!res.ok) throw new Error("Error cargando reservas");
  return res.json();
}

export async function cancelReservation(id: number) {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error cancelando reserva");
  return res.json();
}