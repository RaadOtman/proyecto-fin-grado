// Todas las llamadas al backend que solo usa el panel de administración.
// Separado de apiClient.ts para mantener cada sección independiente.
import { API_BASE_URL } from "../config/api";

async function readJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any)?.error || `HTTP ${res.status}`);
  }
  return data;
}

// ─── Stats / Dashboard ────────────────────────────────────────

export async function getAdminStats() {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    credentials: "include",
  });
  return readJson(res);
}

// ─── Usuarios ────────────────────────────────────────────────

export async function getAdminUsers() {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    credentials: "include",
  });
  return readJson(res);
}

export async function patchAdminUserActive(id: number, is_active: 0 | 1) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}/active`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active }),
  });
  return readJson(res);
}

export async function patchAdminUserRole(id: number, role: "user" | "admin") {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return readJson(res);
}

export async function deleteAdminUser(id: number) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return readJson(res);
}

// ─── Reservas ────────────────────────────────────────────────

export async function getAdminReservations(filters?: { reservation_date?: string; court_id?: number; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.reservation_date) params.set("reservation_date", filters.reservation_date);
  if (filters?.court_id) params.set("court_id", String(filters.court_id));
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/admin/reservations${query}`, {
    credentials: "include",
  });
  return readJson(res);
}

export async function deleteAdminReservation(id: number) {
  const res = await fetch(`${API_BASE_URL}/admin/reservations/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return readJson(res);
}

// ─── Pistas ───────────────────────────────────────────────────

export async function getAdminCourts() {
  const res = await fetch(`${API_BASE_URL}/admin/courts`, {
    credentials: "include",
  });
  return readJson(res);
}

export async function createAdminCourt(data: {
  name: string;
  type: string;
  capacity: number;
  notes: string;
}) {
  const res = await fetch(`${API_BASE_URL}/admin/courts`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

export async function updateAdminCourt(
  id: number,
  data: { name: string; type: string; capacity: number; notes: string }
) {
  const res = await fetch(`${API_BASE_URL}/admin/courts/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

export async function patchAdminCourtStatus(
  id: number,
  status: "active" | "inactive" | "maintenance"
) {
  const res = await fetch(`${API_BASE_URL}/admin/courts/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return readJson(res);
}

export async function deleteAdminCourt(id: number) {
  const res = await fetch(`${API_BASE_URL}/admin/courts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return readJson(res);
}
