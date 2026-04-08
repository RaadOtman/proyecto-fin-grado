import { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiCheck, FiX, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import {
  getAdminCourts,
  createAdminCourt,
  updateAdminCourt,
  patchAdminCourtStatus,
  deleteAdminCourt,
} from "../../lib/adminApiClient";
import Loader from "../../components/Loader";

type Court = {
  id: number;
  name: string;
  type: "Interior" | "Exterior";
  status: "active" | "inactive" | "maintenance";
  capacity: number;
  notes: string | null;
};

type EditState = {
  name: string;
  type: "Interior" | "Exterior";
  capacity: number;
  notes: string;
};

const STATUS_LABELS: Record<Court["status"], string> = {
  active:      "Activa",
  inactive:    "Inactiva",
  maintenance: "Mantenimiento",
};

const STATUS_NEXT: Record<Court["status"], Court["status"]> = {
  active:      "inactive",
  inactive:    "active",
  maintenance: "active",
};

const STATUS_BADGE: Record<Court["status"], string> = {
  active:      "badge",
  inactive:    "badge badge-neutral",
  maintenance: "badge badge-warning",
};

export default function AdminPistas() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  // ID de la pista en edición inline (null = ninguna)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: "", type: "Exterior", capacity: 4, notes: "",
  });

  // Formulario de nueva pista
  const [showNew, setShowNew] = useState(false);
  const [newCourt, setNewCourt] = useState<EditState>({
    name: "", type: "Exterior", capacity: 4, notes: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminCourts();
      setCourts(data.courts || []);
    } catch (e: any) {
      setError(e?.message || "Error cargando pistas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Edición inline ──────────────────────────────────────────

  function startEdit(court: Court) {
    setEditingId(court.id);
    setEditState({
      name:     court.name,
      type:     court.type,
      capacity: court.capacity,
      notes:    court.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    if (!editState.name.trim()) return;
    setBusy(id);
    setMsg("");
    setError("");
    try {
      await updateAdminCourt(id, {
        name:     editState.name.trim(),
        type:     editState.type,
        capacity: editState.capacity,
        notes:    editState.notes.trim(),
      });
      setMsg("Pista actualizada correctamente");
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error actualizando pista");
    } finally {
      setBusy(null);
    }
  }

  // ── Cambio de estado ────────────────────────────────────────

  async function handleStatusChange(court: Court) {
    const next = STATUS_NEXT[court.status];
    const label = STATUS_LABELS[next].toLowerCase();
    if (!confirm(`¿Cambiar "${court.name}" a estado ${label}?`)) return;

    setBusy(court.id);
    setMsg("");
    setError("");
    try {
      await patchAdminCourtStatus(court.id, next);
      setMsg(`"${court.name}" marcada como ${label}`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cambiando estado");
    } finally {
      setBusy(null);
    }
  }

  // ── Eliminar pista ──────────────────────────────────────────

  async function handleDelete(court: Court) {
    if (!confirm(`¿Eliminar la pista "${court.name}"? Esta acción no se puede deshacer.`)) return;

    setBusy(court.id);
    setMsg("");
    setError("");
    try {
      await deleteAdminCourt(court.id);
      setMsg(`Pista "${court.name}" eliminada correctamente`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error eliminando pista");
    } finally {
      setBusy(null);
    }
  }

  // ── Crear nueva pista ───────────────────────────────────────

  async function handleCreate() {
    if (!newCourt.name.trim()) return;
    setBusy(-1);
    setMsg("");
    setError("");
    try {
      await createAdminCourt({
        name:     newCourt.name.trim(),
        type:     newCourt.type,
        capacity: newCourt.capacity,
        notes:    newCourt.notes.trim(),
      });
      setMsg(`Pista "${newCourt.name.trim()}" creada correctamente`);
      setNewCourt({ name: "", type: "Exterior", capacity: 4, notes: "" });
      setShowNew(false);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error creando pista");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-page">
      {/* Cabecera */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pistas</h1>
          <p className="admin-page-subtitle">
            Gestiona las pistas del club — nombre, tipo, aforo y estado
          </p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={load}
            disabled={loading}
          >
            <FiRefreshCw size={13} />
            Actualizar
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setShowNew((v) => !v)}
          >
            <FiPlus size={14} />
            Nueva pista
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Formulario nueva pista */}
      {showNew && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Nueva pista</h2>
          </div>
          <div className="court-form">
            <div className="form-group">
              <label htmlFor="new-name">Nombre</label>
              <input
                id="new-name"
                type="text"
                className="input"
                placeholder="Ej. Pista 5"
                value={newCourt.name}
                onChange={(e) => setNewCourt({ ...newCourt, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-type">Tipo</label>
              <select
                id="new-type"
                className="input"
                value={newCourt.type}
                onChange={(e) =>
                  setNewCourt({ ...newCourt, type: e.target.value as "Interior" | "Exterior" })
                }
              >
                <option value="Exterior">Exterior</option>
                <option value="Interior">Interior</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="new-capacity">Aforo</label>
              <input
                id="new-capacity"
                type="number"
                className="input"
                min={1}
                max={10}
                value={newCourt.capacity}
                onChange={(e) =>
                  setNewCourt({ ...newCourt, capacity: Number(e.target.value) })
                }
              />
            </div>
            <div className="form-group court-form-notes">
              <label htmlFor="new-notes">Notas</label>
              <input
                id="new-notes"
                type="text"
                className="input"
                placeholder="Opcional"
                value={newCourt.notes}
                onChange={(e) => setNewCourt({ ...newCourt, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="table-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="button"
              onClick={handleCreate}
              disabled={!newCourt.name.trim() || busy === -1}
            >
              <FiCheck size={13} />
              Crear pista
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setShowNew(false)}
            >
              <FiX size={13} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de pistas */}
      <div className="admin-section">
        {loading ? (
          <Loader text="Cargando pistas..." />
        ) : courts.length === 0 ? (
          <p className="admin-empty">No hay pistas registradas.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Aforo</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {courts.map((court) => {
                  const isEditing = editingId === court.id;
                  const isBusy = busy === court.id;

                  return (
                    <tr key={court.id}>
                      {isEditing ? (
                        <>
                          <td>
                            <input
                              className="input input-inline"
                              value={editState.name}
                              onChange={(e) =>
                                setEditState({ ...editState, name: e.target.value })
                              }
                              autoFocus
                            />
                          </td>
                          <td>
                            <select
                              className="input input-inline"
                              value={editState.type}
                              onChange={(e) =>
                                setEditState({
                                  ...editState,
                                  type: e.target.value as "Interior" | "Exterior",
                                })
                              }
                            >
                              <option value="Exterior">Exterior</option>
                              <option value="Interior">Interior</option>
                            </select>
                          </td>
                          <td>
                            <input
                              className="input input-inline"
                              type="number"
                              min={1}
                              max={10}
                              value={editState.capacity}
                              onChange={(e) =>
                                setEditState({
                                  ...editState,
                                  capacity: Number(e.target.value),
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input input-inline"
                              value={editState.notes}
                              placeholder="Sin notas"
                              onChange={(e) =>
                                setEditState({ ...editState, notes: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <span className={STATUS_BADGE[court.status]}>
                              {STATUS_LABELS[court.status]}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="button button-sm"
                                onClick={() => saveEdit(court.id)}
                                disabled={!editState.name.trim() || isBusy}
                              >
                                <FiCheck size={12} />
                                Guardar
                              </button>
                              <button
                                type="button"
                                className="button-secondary button-sm"
                                onClick={cancelEdit}
                              >
                                <FiX size={12} />
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="table-email">{court.name}</td>
                          <td>{court.type}</td>
                          <td>{court.capacity} jug.</td>
                          <td className="table-date">{court.notes ?? "—"}</td>
                          <td>
                            <span className={STATUS_BADGE[court.status]}>
                              {STATUS_LABELS[court.status]}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="button-secondary button-sm"
                                onClick={() => startEdit(court)}
                                disabled={isBusy}
                              >
                                <FiEdit2 size={12} />
                                Editar
                              </button>
                              <button
                                type="button"
                                className={`button-secondary button-sm ${
                                  court.status !== "active" ? "status-btn-activate" : ""
                                }`}
                                onClick={() => handleStatusChange(court)}
                                disabled={isBusy}
                              >
                                {court.status === "active" ? "Desactivar" : "Activar"}
                              </button>
                              <button
                                type="button"
                                className="btn-danger button-sm"
                                onClick={() => handleDelete(court)}
                                disabled={isBusy}
                                title="Eliminar pista"
                              >
                                <FiTrash2 size={12} />
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </>
                      )}
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
