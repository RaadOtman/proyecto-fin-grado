// src/lib/apiClient.ts
import { API_BASE_URL } from "../config/api";

export async function getAvailability(date: string) {
  const res = await fetch(`${API_BASE_URL}/availability?date=${date}`);
  if (!res.ok) {
    throw new Error(`Error al obtener disponibilidad: ${res.status}`);
  }
  return res.json();
}

export async function getCourts() {
  const res = await fetch(`${API_BASE_URL}/courts`);
  if (!res.ok) {
    throw new Error(`Error al obtener pistas: ${res.status}`);
  }
  return res.json();
}

// NUEVO: obtener reservas (puedes pasar fecha opcional)
export async function getReservations(date?: string) {
  const url = date
    ? `${API_BASE_URL}/reservations?date=${encodeURIComponent(date)}`
    : `${API_BASE_URL}/reservations`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al obtener reservas: ${res.status}`);
  }
  return res.json();
}
export async function cancelReservation(id: number) {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Error al cancelar: ${res.status}`);
  }

  return res.json();
}
// NUEVO: ya lo tenías, pero lo dejo aquí por si acaso
export async function reserveCourt(
  courtId: number,
  date: string,
  time: string
) {
  const res = await fetch(`${API_BASE_URL}/reserve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courtId, date, time }),
  });

  if (!res.ok) {
    throw new Error(`Error al reservar: ${res.status}`);
  }

  return res.json();
}