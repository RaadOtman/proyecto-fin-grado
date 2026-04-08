import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiShield, FiTrash2, FiRefreshCw, FiToggleLeft, FiToggleRight } from "react-icons/fi";
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
  email: string;
  phone: string | null;
  role: "user" | "admin";
  is_active: 0 | 1;
  created_at: string;
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

export default function AdminUsuarios() {
  const { userEmail } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

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
        (u.name || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  async function handleRoleChange(user: User) {
    const nextRole: User["role"] = user.role === "admin" ? "user" : "admin";
    if (!confirm(`¿Cambiar el rol de ${user.email} a '${ROLE_LABELS[nextRole]}'?`)) return;

    setBusy(user.id);
    setMsg("");
    setError("");
    try {
      await patchAdminUserRole(user.id, nextRole);
      setMsg(`Rol de ${user.email} actualizado a '${ROLE_LABELS[nextRole]}'`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cambiando rol");
    } finally {
      setBusy(null);
    }
  }

  async function handleToggleActive(user: User) {
    const next: 0 | 1 = user.is_active ? 0 : 1;
    const action = next ? "activar" : "desactivar";
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} la cuenta de ${user.email}?`)) return;

    setBusy(user.id);
    setMsg("");
    setError("");
    try {
      await patchAdminUserActive(user.id, next);
      setMsg(`Cuenta de ${user.email} ${next ? "activada" : "desactivada"}`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cambiando estado");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`¿Eliminar el usuario ${user.email}? Esta acción no se puede deshacer.`)) return;

    setBusy(user.id);
    setMsg("");
    setError("");
    try {
      await deleteAdminUser(user.id);
      setMsg(`Usuario ${user.email} eliminado`);
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
            Gestiona los usuarios registrados en el club
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
            {search ? "No hay usuarios que coincidan con la búsqueda." : "No hay usuarios registrados."}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre / Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const me = isMe(u);
                  const isBusy = busy === u.id;
                  return (
                    <tr key={u.id} className={u.is_active ? "" : "table-row-muted"}>
                      <td>
                        <div className="table-email">{u.name}</div>
                        <div className="table-sub">{u.email}</div>
                        {me && <span className="table-you">tú</span>}
                      </td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        <span
                          className={`badge ${u.role === "admin" ? "badge-admin" : "badge-neutral"}`}
                        >
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? "badge-active" : "badge-inactive"}`}>
                          {u.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="table-date">{formatDate(u.created_at)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button-secondary button-sm"
                            onClick={() => handleRoleChange(u)}
                            disabled={me || isBusy}
                            title={me ? "No puedes cambiar tu propio rol" : `Cambiar rol (actual: ${ROLE_LABELS[u.role]})`}
                          >
                            <FiShield size={12} />
                            Rol
                          </button>
                          <button
                            type="button"
                            className="button-secondary button-sm"
                            onClick={() => handleToggleActive(u)}
                            disabled={me || isBusy}
                            title={me ? "No puedes desactivar tu propia cuenta" : u.is_active ? "Desactivar cuenta" : "Activar cuenta"}
                          >
                            {u.is_active ? <FiToggleRight size={12} /> : <FiToggleLeft size={12} />}
                            {u.is_active ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            type="button"
                            className="btn-danger button-sm"
                            onClick={() => handleDelete(u)}
                            disabled={me || isBusy}
                            title={me ? "No puedes eliminarte a ti mismo" : undefined}
                          >
                            <FiTrash2 size={12} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
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
