import { Fragment, useEffect, useMemo, useState } from "react";
import { FiExternalLink, FiEye, FiSearch, FiShield, FiTrash2, FiRefreshCw, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import {
  getAdminUsers,
  patchAdminUserRole,
  patchAdminUserActive,
  deleteAdminUser,
} from "../../lib/adminApiClient";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";

type User = {
  id: number;
  name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  game_level: string | null;
  preferred_side: string | null;
  avatar_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  bio: string | null;
  role: "user" | "admin";
  role_in_club: "member" | "staff" | "admin";
  club_status: "active" | "pending" | "blocked";
  is_active: 0 | 1;
  joined_at: string;
  created_at: string;
  reservations_count: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ROLE_LABELS: Record<User["role"], string> = {
  admin: "Admin",
  user: "Usuario",
};

const CLUB_ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  member: "Miembro",
};

const CLUB_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  blocked: "Bloqueado",
};

export default function AdminUsuarios() {
  const { userEmail } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminUsers();
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e?.message || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Filtro client-side por nombre o email
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  async function handleRoleChange(user: User) {
    const nextRole: User["role"] = user.role_in_club === "admin" ? "user" : "admin";
    if (!confirm(`¿Cambiar el rol de ${user.email} a ${ROLE_LABELS[nextRole]} en este club?`)) return;

    setBusy(user.id);
    setMsg("");
    setError("");
    try {
      await patchAdminUserRole(user.id, nextRole);
      setMsg(`Rol de ${user.email} actualizado en este club`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cambiando rol");
    } finally {
      setBusy(null);
    }
  }

  async function handleToggleActive(user: User) {
    const next: 0 | 1 = user.club_status === "active" ? 0 : 1;
    const action = next ? "activar" : "bloquear";
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.email} en este club?`)) return;

    setBusy(user.id);
    setMsg("");
    setError("");
    try {
      await patchAdminUserActive(user.id, next);
      setMsg(`Relación de ${user.email} ${next ? "activada" : "bloqueada"}`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cambiando estado");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`¿Retirar a ${user.email} de este club? Su cuenta global no se eliminará.`)) return;

    setBusy(user.id);
    setMsg("");
    setError("");
    try {
      await deleteAdminUser(user.id);
      setMsg(`Usuario ${user.email} retirado del club`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error eliminando usuario");
    } finally {
      setBusy(null);
    }
  }

  const isMe = (u: User) => u.email === userEmail;

  return (
    <div className="admin-page">
      {/* Cabecera */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Usuarios</h1>
          <p className="admin-page-subtitle">
            Gestiona miembros, perfiles deportivos y permisos dentro de este club.
          </p>
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={load}
          disabled={loading}
        >
          <FiRefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-section">
        {/* Barra de búsqueda + contador */}
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <FiSearch size={14} className="admin-search-icon" />
            <input
              type="text"
              className="input admin-search-input"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="admin-count">
            {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tabla */}
        {loading ? (
          <Loader text="Cargando usuarios..." />
        ) : filtered.length === 0 ? (
          <p className="admin-empty">
            {search ? "No hay usuarios que coincidan con la búsqueda." : "Todavía no hay usuarios asociados a este club."}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Perfil</th>
                  <th>Relación</th>
                  <th>Reservas</th>
                  <th>Alta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const me = isMe(u);
                  const isBusy = busy === u.id;
                  const activeInClub = u.club_status === "active";
                  const fullName = [u.name, u.last_name].filter(Boolean).join(" ").trim() || u.email;
                  return (
                    <Fragment key={u.id}>
                      <tr className={activeInClub ? "" : "table-row-muted"}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar">
                              {u.avatar_url ? <img src={u.avatar_url} alt={fullName} /> : <span>{fullName.slice(0, 1).toUpperCase()}</span>}
                            </div>
                            <div>
                              <div className="table-email">{fullName}</div>
                              <div className="table-sub">{u.email}</div>
                              {me && <span className="table-you">tú</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="user-profile-stack">
                            <span>{u.phone || "Sin teléfono"}</span>
                            <span>
                              {[u.game_level, u.preferred_side && `Lado ${u.preferred_side}`]
                                .filter(Boolean)
                                .join(" · ") || "Perfil deportivo pendiente"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="user-badge-stack">
                            <span className={`badge ${u.role_in_club === "admin" ? "badge-admin" : "badge-neutral"}`}>
                              {CLUB_ROLE_LABELS[u.role_in_club] || u.role_in_club}
                            </span>
                            <span className={`badge ${activeInClub ? "badge-active" : "badge-inactive"}`}>
                              {CLUB_STATUS_LABELS[u.club_status] || u.club_status}
                            </span>
                          </div>
                        </td>
                        <td className="table-date">{Number(u.reservations_count || 0)}</td>
                        <td className="table-date">{formatDate(u.joined_at || u.created_at)}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="button-secondary button-sm"
                              onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                            >
                              <FiEye size={12} />
                              Detalle
                            </button>
                            <button
                              type="button"
                              className="button-secondary button-sm"
                              onClick={() => handleRoleChange(u)}
                              disabled={me || isBusy}
                              title={me ? "No puedes cambiar tu propio rol" : "Cambiar rol en este club"}
                            >
                              <FiShield size={12} />
                              Rol
                            </button>
                            <button
                              type="button"
                              className="button-secondary button-sm"
                              onClick={() => handleToggleActive(u)}
                              disabled={me || isBusy}
                              title={me ? "No puedes bloquearte a ti mismo" : activeInClub ? "Bloquear en el club" : "Activar en el club"}
                            >
                              {activeInClub ? <FiToggleRight size={12} /> : <FiToggleLeft size={12} />}
                              {activeInClub ? "Bloquear" : "Activar"}
                            </button>
                            <button
                              type="button"
                              className="btn-danger button-sm"
                              onClick={() => handleDelete(u)}
                              disabled={me || isBusy}
                              title={me ? "No puedes retirarte a ti mismo" : undefined}
                            >
                              <FiTrash2 size={12} />
                              Retirar
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === u.id && (
                        <tr className="user-detail-row">
                          <td colSpan={6}>
                            <div className="user-detail-panel">
                              <span><strong>Email</strong>{u.email}</span>
                              <span><strong>Teléfono</strong>{u.phone || "No indicado"}</span>
                              <span><strong>Nivel</strong>{u.game_level || "No indicado"}</span>
                              <span><strong>Lado</strong>{u.preferred_side || "No indicado"}</span>
                              <span><strong>Rol global</strong>{ROLE_LABELS[u.role]}</span>
                              <span><strong>Alta en PADEX</strong>{formatDate(u.created_at)}</span>
                              <span><strong>Bio</strong>{u.bio || "No indicada"}</span>
                              <span>
                                <strong>Redes</strong>
                                <div className="admin-user-links">
                                  {u.instagram_url && <a href={u.instagram_url} target="_blank" rel="noopener noreferrer"><FiExternalLink /> Instagram</a>}
                                  {u.linkedin_url && <a href={u.linkedin_url} target="_blank" rel="noopener noreferrer"><FiExternalLink /> LinkedIn</a>}
                                  {u.website_url && <a href={u.website_url} target="_blank" rel="noopener noreferrer"><FiExternalLink /> Web</a>}
                                  {!u.instagram_url && !u.linkedin_url && !u.website_url && "Sin redes"}
                                </div>
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
