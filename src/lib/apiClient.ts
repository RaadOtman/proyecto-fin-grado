// src/lib/apiClient.ts
import { API_BASE_URL } from "../config/api";

async function readJson(res: Response) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  return data;
}

// -------- PUBLIC --------

export async function getAvailability(date: string) {
  const res = await fetch(`${API_BASE_URL}/availability?date=${date}`);
  return readJson(res);
}

export async function getCourts() {
  const res = await fetch(`${API_BASE_URL}/courts`);
  return readJson(res);
}

// -------- AUTH --------

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return readJson(res);
}

export async function registerUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return readJson(res);
}

export async function logoutUser() {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  return readJson(res);
}

// -------- RESERVATIONS (PROTEGIDO) --------

export async function createReservation(input: {
  court_id: number;
  reservation_date: string;
  start_time: string;
}) {
  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return readJson(res);
}

export async function getMyReservations() {
  const res = await fetch(`${API_BASE_URL}/reservations/my`, {
    credentials: "include",
  });

  return readJson(res);
}

export async function cancelReservation(id: number) {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return readJson(res);
}

// -------- CLUBS --------

export async function getClubs() {
  const res = await fetch(`${API_BASE_URL}/clubs`);
  return readJson(res);
}

export async function getClub(id: number) {
  const res = await fetch(`${API_BASE_URL}/clubs/${id}`);
  return readJson(res);
}

export async function patchUserClub(userId: number, clubId: number | null) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/club`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clubId }),
  });
  return readJson(res);
}