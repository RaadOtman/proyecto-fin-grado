import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiCheck, FiEdit2, FiPlus, FiRefreshCw, FiTool, FiTrash2, FiX } from "react-icons/fi";
import {
  getAdminCourts,
  createAdminCourt,
  updateAdminCourt,
  patchAdminCourtStatus,
  deleteAdminCourt,
} from "../../lib/adminApiClient";
import Loader from "../../components/Loader";

type CourtStatus = "active" | "inactive" | "maintenance";
type CourtType = "Interior" | "Exterior";

type Court = {
  id: number;
  name: string;
  type: CourtType;
  surface: string | null;
  status: CourtStatus;
  capacity: number;
  base_price: number | null;
  notes: string | null;
};

type CourtForm = {
  name: string;
  type: CourtType;
  surface: string;
  capacity: number;
  base_price: string;
  notes: string;
};

const emptyForm: CourtForm = {
  name: "",
  type: "Exterior",
  surface: "",
  capacity: 4,
  base_price: "",
  notes: "",
};

const STATUS_LABELS: Record<CourtStatus, string> = {
  active: "Activa",
  inactive: "Inactiva",
  maintenance: "Mantenimiento",
};

const STATUS_BADGE: Record<CourtStatus, string> = {
  active: "badge badge-active",
  inactive: "badge badge-neutral",
  maintenance: "badge badge-warning",
};

function toPayload(form: CourtForm) {
  return {
    name: form.name.trim(),
    type: form.type,
    surface: form.surface.trim(),
    capacity: form.capacity,
    base_price: form.base_price.trim() === "" ? null : Number(form.base_price),
    notes: form.notes.trim(),
  };
}

export default function AdminPistas() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CourtForm>(emptyForm);
  const [filterStatus, setFilterStatus] = useState<CourtStatus | "all">("all");
  const [filterType, setFilterType] = useState<CourtType | "all">("all");

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

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: courts.length,
      active: courts.filter((court) => court.status === "active").length,
      maintenance: courts.filter((court) => court.status === "maintenance").length,
      inactive: courts.filter((court) => court.status === "inactive").length,
    };
  }, [courts]);

  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      const byStatus = filterStatus === "all" || court.status === filterStatus;
      const byType = filterType === "all" || court.type === filterType;
      return byStatus && byType;
    });
  }, [courts, filterStatus, filterType]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMsg("");
    setError("");
  }

  function startEdit(court: Court) {
    setEditingId(court.id);
    setForm({
      name: court.name,
      type: court.type,
      surface: court.surface || "",
      capacity: court.capacity,
      base_price: court.base_price == null ? "" : String(court.base_price),
      notes: court.notes || "",
    });
    setMsg("");
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setBusy(editingId ?? -1);
    setMsg("");
    setError("");
    try {
      const payload = toPayload(form);
      if (editingId) {
        await updateAdminCourt(editingId, payload);
        setMsg("Pista actualizada correctamente");
      } else {
        await createAdminCourt(payload);
        setMsg("Pista creada correctamente");
      }
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar la pista");
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(court: Court, status: CourtStatus) {
    setBusy(court.id);
    setMsg("");
    setError("");
    try {
      await patchAdminCourtStatus(court.id, status);
      setMsg(`"${court.name}" marcada como ${STATUS_LABELS[status].toLowerCase()}`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cambiando estado");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(court: Court) {
    if (!confirm(`¿Eliminar la pista "${court.name}"? Si tiene reservas futuras, el backend lo impedirá.`)) return;
    setBusy(court.id);
    setMsg("");
    setError("");
    try {
      await deleteAdminCourt(court.id);
      setMsg(`Pista "${court.name}" eliminada correctamente`);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo eliminar. Si tiene reservas futuras, desactívala o ponla en mantenimiento.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pistas</h1>
          <p className="admin-page-subtitle">
            Gestiona inventario, estados operativos y datos internos de las pistas.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="button-secondary" onClick={load} disabled={loading}>
            <FiRefreshCw size={13} />
            Actualizar
          </button>
          <button type="button" className="button" onClick={startCreate}>
            <FiPlus size={14} />
            Nueva pista
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="court-ops-grid">
        <form className="admin-section court-admin-form" onSubmit={save}>
          <div className="admin-section-header">
            <div>
              <span className="admin-section-kicker">{editingId ? "Edición" : "Alta de pista"}</span>
              <h2 className="admin-section-title">{editingId ? "Editar pista" : "Nueva pista"}</h2>
            </div>
            {editingId && (
              <button type="button" className="button-secondary button-sm" onClick={startCreate}>
                <FiX size={12} />
                Cancelar
              </button>
            )}
          </div>

          <div className="form-grid-two">
            <div className="form-group">
              <label htmlFor="court-name">Nombre</label>
              <input
                id="court-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Pista central"
              />
            </div>
            <div className="form-group">
              <label htmlFor="court-type">Tipo</label>
              <select
                id="court-type"
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CourtType })}
              >
                <option value="Exterior">Outdoor / Exterior</option>
                <option value="Interior">Indoor / Interior</option>
              </select>
            </div>
          </div>

          <div className="form-grid-three">
            <div className="form-group">
              <label htmlFor="court-surface">Superficie</label>
              <input
                id="court-surface"
                className="input"
                value={form.surface}
                onChange={(e) => setForm({ ...form, surface: e.target.value })}
                placeholder="Cristal, muro, césped..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="court-capacity">Capacidad</label>
              <input
                id="court-capacity"
                className="input"
                type="number"
                min={1}
                max={20}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="court-price">Precio base</label>
              <input
                id="court-price"
                className="input"
                type="number"
                min={0}
                step="0.01"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                placeholder="Futuro"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="court-notes">Notas internas</label>
            <textarea
              id="court-notes"
              className="input court-notes-textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Detalles de mantenimiento, iluminación, observaciones..."
            />
          </div>

          <button type="submit" className="button" disabled={!form.name.trim() || busy === (editingId ?? -1)}>
            <FiCheck size={13} />
            {busy === (editingId ?? -1) ? "Guardando..." : editingId ? "Guardar cambios" : "Crear pista"}
          </button>
        </form>

        <section className="admin-section court-ops-panel">
          <div className="admin-section-header">
            <div>
              <span className="admin-section-kicker">Operativa</span>
              <h2 className="admin-section-title">Inventario del club</h2>
            </div>
          </div>

          <div className="court-stat-grid">
            <div><strong>{stats.total}</strong><span>Total</span></div>
            <div><strong>{stats.active}</strong><span>Activas</span></div>
            <div><strong>{stats.maintenance}</strong><span>Mantenimiento</span></div>
            <div><strong>{stats.inactive}</strong><span>Inactivas</span></div>
          </div>

          <div className="admin-filters court-filters">
            <div className="form-group">
              <label htmlFor="filter-status">Estado</label>
              <select id="filter-status" className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CourtStatus | "all")}>
                <option value="all">Todos</option>
                <option value="active">Activas</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="inactive">Inactivas</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="filter-type">Tipo</label>
              <select id="filter-type" className="input" value={filterType} onChange={(e) => setFilterType(e.target.value as CourtType | "all")}>
                <option value="all">Todos</option>
                <option value="Exterior">Outdoor / Exterior</option>
                <option value="Interior">Indoor / Interior</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <span className="admin-section-kicker">Pistas</span>
            <h2 className="admin-section-title">Listado operativo</h2>
          </div>
          <span className="admin-count">{filteredCourts.length} pista{filteredCourts.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <Loader text="Cargando pistas..." />
        ) : filteredCourts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiActivity size={20} /></div>
            <p className="empty-state-title">Sin pistas para este filtro</p>
            <p className="empty-state-desc">Ajusta los filtros o crea una nueva pista para empezar a operar.</p>
          </div>
        ) : (
          <div className="court-card-grid">
            {filteredCourts.map((court) => {
              const isBusy = busy === court.id;
              return (
                <article key={court.id} className="court-admin-card">
                  <div className="court-admin-card-top">
                    <div>
                      <h3>{court.name}</h3>
                      <p>{court.type} · {court.surface || "Superficie sin definir"}</p>
                    </div>
                    <span className={STATUS_BADGE[court.status]}>{STATUS_LABELS[court.status]}</span>
                  </div>

                  <div className="court-admin-meta">
                    <span>{court.capacity} jugadores</span>
                    <span>{court.base_price == null ? "Sin precio" : `${Number(court.base_price).toFixed(2)} EUR`}</span>
                  </div>

                  {court.notes && <p className="court-admin-notes">{court.notes}</p>}

                  <div className="court-admin-actions">
                    <button type="button" className="button-secondary button-sm" onClick={() => startEdit(court)} disabled={isBusy}>
                      <FiEdit2 size={12} />
                      Editar
                    </button>
                    <button type="button" className="button-secondary button-sm status-btn-activate" onClick={() => setStatus(court, "active")} disabled={isBusy || court.status === "active"}>
                      Activar
                    </button>
                    <button type="button" className="button-secondary button-sm" onClick={() => setStatus(court, "maintenance")} disabled={isBusy || court.status === "maintenance"}>
                      <FiTool size={12} />
                      Mant.
                    </button>
                    <button type="button" className="button-secondary button-sm" onClick={() => setStatus(court, "inactive")} disabled={isBusy || court.status === "inactive"}>
                      Desactivar
                    </button>
                    <button type="button" className="btn-danger button-sm" onClick={() => handleDelete(court)} disabled={isBusy}>
                      <FiTrash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
