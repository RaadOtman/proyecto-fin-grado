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

// ─── Club ─────────────────────────────────────────────────────

export async function getAdminClub() {
  const res = await fetch(`${API_BASE_URL}/admin/club`, {
    credentials: "include",
  });
  return readJson(res);
}

export async function updateAdminClub(data: {
  name: string;
  city: string;
  address: string;
  description: string;
  image_url: string;
  logo_url: string;
  banner_url: string;
  whatsapp_url: string;
  status: "active" | "inactive" | "suspended";
}) {
  const res = await fetch(`${API_BASE_URL}/admin/club`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

export async function getAdminSettings() {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    credentials: "include",
  });
  return readJson(res);
}

export async function updateAdminSettings(data: {
  schedule_mode: "continuous" | "split";
  opening_time: string;
  closing_time: string;
  opening_time_morning: string;
  closing_time_morning: string;
  opening_time_evening: string;
  closing_time_evening: string;
  slot_minutes: number;
  max_days_ahead: number;
  cancel_hours_limit: number;
}) {
  const res = await fetch(`${API_BASE_URL}/admin/settings`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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

// ─── Bloqueos ─────────────────────────────────────────────────

export type AdminBlockInput = {
  court_id: number | null;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  block_type: "maintenance" | "event" | "closure" | "internal";
  is_active: 0 | 1;
};

export async function getAdminBlocks(filters?: { block_date?: string; court_id?: number; is_active?: 0 | 1 }) {
  const params = new URLSearchParams();
  if (filters?.block_date) params.set("block_date", filters.block_date);
  if (filters?.court_id) params.set("court_id", String(filters.court_id));
  if (filters?.is_active !== undefined) params.set("is_active", String(filters.is_active));

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/admin/blocks${query}`, {
    credentials: "include",
  });
  return readJson(res);
}

export async function createAdminBlock(data: AdminBlockInput) {
  const res = await fetch(`${API_BASE_URL}/admin/blocks`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

export async function updateAdminBlock(id: number, data: AdminBlockInput) {
  const res = await fetch(`${API_BASE_URL}/admin/blocks/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

export async function deleteAdminBlock(id: number) {
  const res = await fetch(`${API_BASE_URL}/admin/blocks/${id}`, {
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
  surface: string;
  capacity: number;
  base_price: number | null;
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
  data: { name: string; type: string; surface: string; capacity: number; base_price: number | null; notes: string }
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
