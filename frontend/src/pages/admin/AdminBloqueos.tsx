import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiEdit2, FiLock, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiX } from "react-icons/fi";
import {
  AdminBlockInput,
  createAdminBlock,
  deleteAdminBlock,
  getAdminBlocks,
  getAdminCourts,
  updateAdminBlock,
} from "../../lib/adminApiClient";
import Loader from "../../components/Loader";

type Court = { id: number; name: string };

type Block = AdminBlockInput & {
  id: number;
  court_name: string | null;
  created_at: string;
};

const defaultForm: AdminBlockInput = {
  court_id: null,
  block_date: new Date().toISOString().split("T")[0],
  start_time: "09:00",
  end_time: "10:30",
  reason: "",
  block_type: "maintenance",
  is_active: 1,
};

const TYPE_LABELS: Record<Block["block_type"], string> = {
  maintenance: "Mantenimiento",
  event: "Evento",
  closure: "Cierre",
  internal: "Interno",
};

const TYPE_BADGES: Record<Block["block_type"], string> = {
  maintenance: "badge badge-warning",
  event: "badge",
  closure: "badge badge-cancelled",
  internal: "badge badge-neutral",
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBloqueos() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [form, setForm] = useState<AdminBlockInput>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const canSave = useMemo(() => {
    return form.block_date && form.start_time < form.end_time && form.reason.trim().length > 0 && !saving;
  }, [form, saving]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [blocksData, courtsData] = await Promise.all([
        getAdminBlocks({ is_active: 1 }),
        getAdminCourts(),
      ]);
      setBlocks(blocksData.blocks || []);
      setCourts(courtsData.courts || []);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los bloqueos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(defaultForm);
  }

  function startEdit(block: Block) {
    setEditingId(block.id);
    setForm({
      court_id: block.court_id,
      block_date: block.block_date,
      start_time: block.start_time,
      end_time: block.end_time,
      reason: block.reason,
      block_type: block.block_type,
      is_active: block.is_active,
    });
    setMsg("");
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const payload = { ...form, reason: form.reason.trim() };
      if (editingId) {
        await updateAdminBlock(editingId, payload);
        setMsg("Bloqueo actualizado correctamente");
      } else {
        await createAdminBlock(payload);
        setMsg("Bloqueo creado correctamente");
      }
      resetForm();
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar el bloqueo");
    } finally {
      setSaving(false);
    }
  }

  async function remove(block: Block) {
    if (!confirm(`¿Desactivar el bloqueo "${block.reason}"?`)) return;
    setBusy(block.id);
    setError("");
    setMsg("");
    try {
      await deleteAdminBlock(block.id);
      setMsg("Bloqueo desactivado");
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo desactivar el bloqueo");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Bloqueos</h1>
          <p className="admin-page-subtitle">
            Reserva franjas para mantenimiento, eventos, cierres puntuales o uso interno.
          </p>
        </div>
        <button type="button" className="button-secondary" onClick={load} disabled={loading}>
          <FiRefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-blocks-grid">
        <form className="admin-section admin-block-form" onSubmit={save}>
          <div className="admin-section-header">
            <div>
              <span className="admin-section-kicker">{editingId ? "Editar" : "Nuevo bloqueo"}</span>
              <h2 className="admin-section-title admin-section-title--with-icon">
                <FiLock size={15} />
                {editingId ? "Actualizar bloqueo" : "Crear bloqueo"}
              </h2>
            </div>
          </div>

          <div className="form-grid-two">
            <div className="form-group">
              <label htmlFor="block-court">Pista</label>
              <select
                id="block-court"
                className="input"
                value={form.court_id ?? ""}
                onChange={(e) => setForm({ ...form, court_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Todas las pistas</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="block-type">Tipo</label>
              <select
                id="block-type"
                className="input"
                value={form.block_type}
                onChange={(e) => setForm({ ...form, block_type: e.target.value as Block["block_type"] })}
              >
                <option value="maintenance">Mantenimiento</option>
                <option value="event">Evento privado</option>
                <option value="closure">Cierre puntual</option>
                <option value="internal">Reserva interna</option>
              </select>
            </div>
          </div>

          <div className="form-grid-three">
            <div className="form-group">
              <label htmlFor="block-date">Fecha</label>
              <input
                id="block-date"
                className="input"
                type="date"
                value={form.block_date}
                onChange={(e) => setForm({ ...form, block_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="block-start">Inicio</label>
              <input
                id="block-start"
                className="input"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="block-end">Fin</label>
              <input
                id="block-end"
                className="input"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="block-reason">Motivo</label>
            <input
              id="block-reason"
              className="input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ej. Mantenimiento de cristal, clase escuela, evento privado..."
            />
          </div>

          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              checked={form.is_active === 1}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
            />
            Bloqueo activo
          </label>

          <div className="page-header-actions">
            {editingId && (
              <button type="button" className="button-secondary" onClick={resetForm}>
                <FiX size={13} />
                Cancelar
              </button>
            )}
            <button type="submit" className="button" disabled={!canSave}>
              {editingId ? <FiSave size={13} /> : <FiPlus size={13} />}
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear bloqueo"}
            </button>
          </div>
        </form>

        <section className="admin-section">
          <div className="admin-section-header">
            <div>
              <span className="admin-section-kicker">Agenda bloqueada</span>
              <h2 className="admin-section-title">Bloqueos activos</h2>
            </div>
            <span className="admin-count">{blocks.length} activo{blocks.length !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <Loader text="Cargando bloqueos..." />
          ) : blocks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiCalendar size={20} />
              </div>
              <p className="empty-state-title">Sin bloqueos activos</p>
              <p className="empty-state-desc">Crea un bloqueo para ocultar franjas de disponibilidad.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Pista</th>
                    <th>Tipo</th>
                    <th>Motivo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.id}>
                      <td className="table-date">{formatDate(block.block_date)}</td>
                      <td><span className="time-chip">{block.start_time} - {block.end_time}</span></td>
                      <td>{block.court_name || "Todas"}</td>
                      <td><span className={TYPE_BADGES[block.block_type]}>{TYPE_LABELS[block.block_type]}</span></td>
                      <td className="table-email">{block.reason}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="button-secondary button-sm" onClick={() => startEdit(block)}>
                            <FiEdit2 size={12} />
                            Editar
                          </button>
                          <button type="button" className="btn-danger button-sm" onClick={() => remove(block)} disabled={busy === block.id}>
                            <FiTrash2 size={12} />
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
