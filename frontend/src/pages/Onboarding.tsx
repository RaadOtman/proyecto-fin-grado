import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiCheck, FiClock, FiGrid, FiHome, FiMapPin } from "react-icons/fi";
import {
  completeOnboarding,
  createOnboardingClub,
  createOnboardingCourts,
  getOnboardingStatus,
  updateOnboardingSettings,
} from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

type Step = 0 | 1 | 2 | 3;

const steps = [
  { label: "Club", icon: <FiHome /> },
  { label: "Pistas", icon: <FiGrid /> },
  { label: "Horarios", icon: <FiClock /> },
  { label: "Confirmar", icon: <FiCheck /> },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { login, updateClub } = useAuth();

  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [clubName, setClubName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [courtCount, setCourtCount] = useState(4);
  const [courtType, setCourtType] = useState<"Interior" | "Exterior">("Exterior");

  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [slotMinutes, setSlotMinutes] = useState(90);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await getOnboardingStatus();
        const onboarding = data.onboarding;

        if (onboarding?.complete) {
          navigate("/admin/dashboard", { replace: true });
          return;
        }

        if (data.user?.role !== "admin" || onboarding?.needsClubSelection) {
          navigate("/mi-club", { replace: true });
          return;
        }

        if (onboarding?.current_step === "courts") setStep(1);
        if (onboarding?.current_step === "settings") setStep(2);
        if (onboarding?.current_step === "complete") setStep(3);
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar el onboarding");
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, [navigate]);

  const canContinue = useMemo(() => {
    if (step === 0) return clubName.trim().length > 0 && city.trim().length > 0;
    if (step === 1) return courtCount >= 1 && courtCount <= 20;
    if (step === 2) return openingTime < closingTime && [60, 90, 120].includes(slotMinutes);
    return true;
  }, [step, clubName, city, courtCount, openingTime, closingTime, slotMinutes]);

  async function saveClub() {
    if (!clubName.trim() || !city.trim()) {
      setError("Completa nombre del club y ciudad para continuar.");
      return;
    }

    setSaving(true);
    setError("");
    setMsg("");
    try {
      const data = await createOnboardingClub({
        name: clubName.trim(),
        city: city.trim(),
        address: address.trim(),
        description: description.trim(),
      });

      if (data.user) {
        login(data.user.email, data.user.role, data.user.id, data.user.club_id);
        updateClub(data.user.club_id, data.user.club_name || clubName.trim());
      }

      const status = await getOnboardingStatus();
      if (status.user?.club_id) {
        updateClub(status.user.club_id, status.user.club_name || clubName.trim());
      }

      setMsg("Club creado correctamente");
      setStep(status.onboarding?.current_step === "settings" ? 2 : 1);
    } catch (e: any) {
      setError(e?.message || "No se pudo crear el club");
    } finally {
      setSaving(false);
    }
  }

  async function saveCourts() {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      await createOnboardingCourts({ count: courtCount, type: courtType });
      setMsg("Pistas configuradas");
      setStep(2);
    } catch (e: any) {
      setError(e?.message || "No se pudieron crear las pistas");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      await updateOnboardingSettings({
        opening_time: openingTime,
        closing_time: closingTime,
        slot_minutes: slotMinutes,
      });
      setMsg("Horarios guardados");
      setStep(3);
    } catch (e: any) {
      setError(e?.message || "No se pudieron guardar los horarios");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const data = await completeOnboarding();
      if (data.user) {
        login(data.user.email, data.user.role, data.user.id, data.user.club_id);
        updateClub(data.user.club_id, data.user.club_name || null);
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (e: any) {
      setError(e?.message || "No se pudo completar el onboarding");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (step === 0) return saveClub();
    if (step === 1) return saveCourts();
    if (step === 2) return saveSettings();
    return finish();
  }

  if (loading) {
    return (
      <div className="onboarding-page">
        <Loader text="Preparando tu espacio..." />
      </div>
    );
  }

  return (
    <motion.div
      className="onboarding-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="onboarding-shell">
        <aside className="onboarding-aside">
          <span className="badge">PADEX SaaS</span>
          <h1>Configura tu club</h1>
          <p>
            Crea el espacio operativo inicial para empezar a gestionar pistas,
            horarios y reservas desde el panel.
          </p>

          <div className="onboarding-steps">
            {steps.map((item, index) => (
              <div
                key={item.label}
                className={`onboarding-step${index === step ? " is-current" : ""}${index < step ? " is-done" : ""}`}
              >
                <span>{item.icon}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>
        </aside>

        <section className="onboarding-card">
          {step === 0 && (
            <div className="onboarding-form">
              <div>
                <span className="onboarding-kicker">Paso 1</span>
                <h2>Datos del club</h2>
                <p>Información básica para identificar tu espacio en PADEX.</p>
              </div>

              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="club-name">Nombre del club</label>
                  <input
                    id="club-name"
                    className="input"
                    value={clubName}
                    onChange={(e) => {
                      setClubName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Ej. PADEX Madrid Norte"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="club-city">Ciudad</label>
                  <input
                    id="club-city"
                    className="input"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Madrid"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="club-address">Dirección</label>
                <input
                  id="club-address"
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="form-group">
                <label htmlFor="club-description">Descripción</label>
                <textarea
                  id="club-description"
                  className="input onboarding-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-form">
              <div>
                <span className="onboarding-kicker">Paso 2</span>
                <h2>Pistas iniciales</h2>
                <p>Podrás editar nombres, estados y detalles desde el admin.</p>
              </div>

              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="court-count">Número de pistas</label>
                  <input
                    id="court-count"
                    className="input"
                    type="number"
                    min={1}
                    max={20}
                    value={courtCount}
                    onChange={(e) => setCourtCount(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="court-type">Tipo principal</label>
                  <select
                    id="court-type"
                    className="input"
                    value={courtType}
                    onChange={(e) => setCourtType(e.target.value as "Interior" | "Exterior")}
                  >
                    <option value="Exterior">Exterior</option>
                    <option value="Interior">Interior</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-form">
              <div>
                <span className="onboarding-kicker">Paso 3</span>
                <h2>Horarios y tramos</h2>
                <p>Define una primera regla simple de disponibilidad.</p>
              </div>

              <div className="form-grid-three">
                <div className="form-group">
                  <label htmlFor="opening-time">Apertura</label>
                  <input
                    id="opening-time"
                    className="input"
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="closing-time">Cierre</label>
                  <input
                    id="closing-time"
                    className="input"
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="slot-minutes">Duración</label>
                  <select
                    id="slot-minutes"
                    className="input"
                    value={slotMinutes}
                    onChange={(e) => setSlotMinutes(Number(e.target.value))}
                  >
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-confirm">
              <div className="onboarding-confirm-icon">
                <FiCheck />
              </div>
              <span className="onboarding-kicker">Listo</span>
              <h2>Tu club ya tiene lo básico</h2>
              <p>
                Hemos creado el club, sus pistas iniciales y la configuración de horarios.
              </p>
              <div className="onboarding-summary">
                <span><FiMapPin /> {city || "Club configurado"}</span>
                <span><FiGrid /> {courtCount} pistas</span>
                <span><FiClock /> {openingTime} - {closingTime}</span>
              </div>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {!canContinue && step === 0 && !error && (
            <div className="alert alert-error">Nombre del club y ciudad son obligatorios.</div>
          )}
          {msg && <div className="alert alert-success">{msg}</div>}

          <div className="onboarding-actions">
            {step > 0 && step < 3 && (
              <button
                type="button"
                className="button-secondary"
                onClick={() => setStep((step - 1) as Step)}
                disabled={saving}
              >
                Volver
              </button>
            )}
            <button
              type="button"
              className="button"
              onClick={next}
              disabled={!canContinue || saving}
            >
              {saving ? "Guardando..." : step === 3 ? "Entrar al panel" : "Continuar"}
              <FiArrowRight />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
