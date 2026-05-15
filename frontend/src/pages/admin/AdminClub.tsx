import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiClock, FiImage, FiRefreshCw, FiSave, FiSettings } from "react-icons/fi";
import { getAdminClub, getAdminSettings, updateAdminClub, updateAdminSettings } from "../../lib/adminApiClient";
import Loader from "../../components/Loader";

type ClubForm = {
  name: string;
  city: string;
  address: string;
  description: string;
  image_url: string;
  logo_url: string;
  banner_url: string;
  status: "active" | "inactive" | "suspended";
};

type Club = ClubForm & {
  id: number;
  court_count: number | null;
  created_at: string;
};

type SettingsForm = {
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
};

const emptyForm: ClubForm = {
  name: "",
  city: "",
  address: "",
  description: "",
  image_url: "",
  logo_url: "",
  banner_url: "",
  status: "active",
};

const defaultSettings: SettingsForm = {
  schedule_mode: "continuous",
  opening_time: "09:00",
  closing_time: "22:00",
  opening_time_morning: "09:00",
  closing_time_morning: "14:00",
  opening_time_evening: "17:00",
  closing_time_evening: "23:00",
  slot_minutes: 90,
  max_days_ahead: 14,
  cancel_hours_limit: 12,
};

export default function AdminClub() {
  const [club, setClub] = useState<Club | null>(null);
  const [form, setForm] = useState<ClubForm>(emptyForm);
  const [settings, setSettings] = useState<SettingsForm>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const canSave = useMemo(() => {
    return form.name.trim().length > 0 && form.city.trim().length > 0 && !saving;
  }, [form.name, form.city, saving]);

  function applyClub(nextClub: Club) {
    setClub(nextClub);
    setForm({
      name: nextClub.name || "",
      city: nextClub.city || "",
      address: nextClub.address || "",
      description: nextClub.description || "",
      image_url: nextClub.image_url || "",
      logo_url: nextClub.logo_url || nextClub.image_url || "",
      banner_url: nextClub.banner_url || nextClub.image_url || "",
      status: nextClub.status || "active",
    });
  }

  function applySettings(nextSettings: Partial<SettingsForm>) {
    setSettings({
      ...defaultSettings,
      ...nextSettings,
      schedule_mode: nextSettings.schedule_mode === "split" ? "split" : "continuous",
      opening_time: nextSettings.opening_time || defaultSettings.opening_time,
      closing_time: nextSettings.closing_time || defaultSettings.closing_time,
      opening_time_morning: nextSettings.opening_time_morning || defaultSettings.opening_time_morning,
      closing_time_morning: nextSettings.closing_time_morning || defaultSettings.closing_time_morning,
      opening_time_evening: nextSettings.opening_time_evening || defaultSettings.opening_time_evening,
      closing_time_evening: nextSettings.closing_time_evening || defaultSettings.closing_time_evening,
      slot_minutes: Number(nextSettings.slot_minutes) || defaultSettings.slot_minutes,
      max_days_ahead: Number(nextSettings.max_days_ahead) || defaultSettings.max_days_ahead,
      cancel_hours_limit: Number(nextSettings.cancel_hours_limit) || defaultSettings.cancel_hours_limit,
    });
  }

  async function load() {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const [clubData, settingsData] = await Promise.all([getAdminClub(), getAdminSettings()]);
      applyClub(clubData.club);
      applySettings(settingsData.settings);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el club");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError("");
    setMsg("");
    try {
      const data = await updateAdminClub({
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim(),
        logo_url: form.logo_url.trim(),
        banner_url: form.banner_url.trim(),
        status: form.status,
      });
      applyClub(data.club);
      setMsg("Información del club guardada correctamente");
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar el club");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setError("");
    setMsg("");
    try {
      await updateAdminSettings(settings);
      const data = await getAdminSettings();
      applySettings(data.settings);
      setMsg("Configuración operativa guardada correctamente");
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar la configuración");
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Ajustes del club</h1>
          <p className="admin-page-subtitle">
            Actualiza la información principal visible y operativa de tu club.
          </p>
        </div>
        <button type="button" className="button-secondary" onClick={load} disabled={loading || saving}>
          <FiRefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader text="Cargando ajustes del club..." />
      ) : (
        <>
        <div className="admin-club-hero">
          {form.banner_url ? (
            <img src={form.banner_url} alt={form.name || "Banner del club"} />
          ) : (
            <div className="admin-club-hero-fallback">
              <FiImage />
            </div>
          )}
          <div className="admin-club-hero-overlay">
            <div className="admin-club-hero-logo">
              {form.logo_url ? (
                <img src={form.logo_url} alt={form.name || "Logo del club"} />
              ) : (
                <span>{(form.name || "P").slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <span className="badge badge-active">
                Club {form.status === "inactive" ? "inactivo" : form.status === "suspended" ? "suspendido" : "activo"}
              </span>
              <h2>{form.name || "Tu club"}</h2>
              <p>{form.city || "Configura la ciudad"} · {club?.court_count ?? 0} pistas</p>
            </div>
          </div>
        </div>

        <div className="admin-club-grid">
          <form className="admin-section admin-club-form" onSubmit={save}>
            <div className="admin-section-header">
              <div>
                <span className="admin-section-kicker">Identidad visual</span>
                <h2 className="admin-section-title">Información general</h2>
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label htmlFor="admin-club-name">Nombre del club</label>
                <input
                  id="admin-club-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-club-city">Ciudad</label>
                <input
                  id="admin-club-city"
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="admin-club-address">Dirección</label>
              <input
                id="admin-club-address"
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-club-logo">Logo del club</label>
              <input
                id="admin-club-logo"
                className="input"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="/clubs/logo.jpg o URL"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-club-banner">Banner o imagen principal</label>
              <input
                id="admin-club-banner"
                className="input"
                value={form.banner_url}
                onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                placeholder="/clubs/banner.jpg o URL"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-club-status">Estado del club</label>
              <select
                id="admin-club-status"
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ClubForm["status"] })}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="admin-club-description">Descripción</label>
              <textarea
                id="admin-club-description"
                className="input admin-club-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="page-header-actions">
              <button type="submit" className="button" disabled={!canSave}>
                <FiSave size={13} />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>

          <form className="admin-section admin-club-form" onSubmit={saveSettings}>
            <div className="admin-section-header">
              <div>
                <span className="admin-section-kicker">Operativa</span>
                <h2 className="admin-section-title admin-section-title--with-icon">
                  <FiSettings size={15} />
                  Horarios y reservas
                </h2>
              </div>
            </div>

            <div className="admin-segmented">
              <button
                type="button"
                className={settings.schedule_mode === "continuous" ? "is-active" : ""}
                onClick={() => setSettings({ ...settings, schedule_mode: "continuous" })}
              >
                Horario continuo
              </button>
              <button
                type="button"
                className={settings.schedule_mode === "split" ? "is-active" : ""}
                onClick={() => setSettings({ ...settings, schedule_mode: "split" })}
              >
                Horario partido
              </button>
            </div>

            {settings.schedule_mode === "continuous" ? (
              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="opening-time">Hora apertura</label>
                  <input
                    id="opening-time"
                    className="input"
                    type="time"
                    value={settings.opening_time}
                    onChange={(e) => setSettings({ ...settings, opening_time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="closing-time">Hora cierre</label>
                  <input
                    id="closing-time"
                    className="input"
                    type="time"
                    value={settings.closing_time}
                    onChange={(e) => setSettings({ ...settings, closing_time: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="admin-split-schedule">
                <div className="admin-schedule-band">
                  <strong>Mañana</strong>
                  <div className="form-grid-two">
                    <div className="form-group">
                      <label htmlFor="morning-open">Apertura</label>
                      <input
                        id="morning-open"
                        className="input"
                        type="time"
                        value={settings.opening_time_morning}
                        onChange={(e) => setSettings({ ...settings, opening_time_morning: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="morning-close">Cierre</label>
                      <input
                        id="morning-close"
                        className="input"
                        type="time"
                        value={settings.closing_time_morning}
                        onChange={(e) => setSettings({ ...settings, closing_time_morning: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="admin-schedule-band">
                  <strong>Tarde</strong>
                  <div className="form-grid-two">
                    <div className="form-group">
                      <label htmlFor="evening-open">Apertura</label>
                      <input
                        id="evening-open"
                        className="input"
                        type="time"
                        value={settings.opening_time_evening}
                        onChange={(e) => setSettings({ ...settings, opening_time_evening: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="evening-close">Cierre</label>
                      <input
                        id="evening-close"
                        className="input"
                        type="time"
                        value={settings.closing_time_evening}
                        onChange={(e) => setSettings({ ...settings, closing_time_evening: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-grid-three">
              <div className="form-group">
                <label htmlFor="slot-minutes">Duración slot</label>
                <select
                  id="slot-minutes"
                  className="input"
                  value={settings.slot_minutes}
                  onChange={(e) => setSettings({ ...settings, slot_minutes: Number(e.target.value) })}
                >
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="max-days">Días reserva</label>
                <input
                  id="max-days"
                  className="input"
                  type="number"
                  min={1}
                  max={90}
                  value={settings.max_days_ahead}
                  onChange={(e) => setSettings({ ...settings, max_days_ahead: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cancel-hours">Cancelación</label>
                <input
                  id="cancel-hours"
                  className="input"
                  type="number"
                  min={0}
                  max={168}
                  value={settings.cancel_hours_limit}
                  onChange={(e) => setSettings({ ...settings, cancel_hours_limit: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="page-header-actions">
              <button type="submit" className="button" disabled={savingSettings}>
                <FiClock size={13} />
                {savingSettings ? "Guardando..." : "Guardar operativa"}
              </button>
            </div>
          </form>

          <aside className="admin-section admin-club-summary">
            <div className="admin-section-header">
              <div>
                <span className="admin-section-kicker">Resumen</span>
                <h2 className="admin-section-title">Estado actual</h2>
              </div>
            </div>

            <div className="admin-club-logo">
              {form.logo_url ? (
                <img src={form.logo_url} alt={form.name || "Club"} />
              ) : (
                <span>{(form.name || "P").slice(0, 1).toUpperCase()}</span>
              )}
            </div>

            <div className="admin-club-summary-list">
              <div>
                <span>Club</span>
                <strong>{form.name || "Sin nombre"}</strong>
              </div>
              <div>
                <span>Ciudad</span>
                <strong>{form.city || "Sin ciudad"}</strong>
              </div>
              <div>
                <span>Pistas</span>
                <strong>{club?.court_count ?? 0}</strong>
              </div>
              <div>
                <span>Estado</span>
                <strong className="admin-club-status">
                  <FiCheck size={13} />
                  {form.status === "inactive" ? "Inactivo" : form.status === "suspended" ? "Suspendido" : "Activo"}
                </strong>
              </div>
              <div>
                <span>Horario</span>
                <strong>{settings.schedule_mode === "split" ? "Partido" : "Continuo"}</strong>
              </div>
              <div>
                <span>Slot</span>
                <strong>{settings.slot_minutes} min</strong>
              </div>
            </div>
          </aside>
        </div>
        </>
      )}
    </div>
  );
}
