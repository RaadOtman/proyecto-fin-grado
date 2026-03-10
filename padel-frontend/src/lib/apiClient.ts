// src/lib/apiClient.ts
import { API_BASE_URL } from "../config/api";

function getToken() {
  return localStorage.getItem("padel_token");
}

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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return readJson(res);
}

export async function registerUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return readJson(res);
}

// -------- RESERVATIONS (PROTEGIDO) --------

export async function createReservation(input: {
  courtId: number;
  date: string;
  time: string;
}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  return readJson(res);
}

export async function getMyReservations() {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/reservations/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return readJson(res);
}

export async function cancelReservation(id: number) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return readJson(res);
}