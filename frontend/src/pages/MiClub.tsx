import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiActivity,
  FiCalendar,
  FiCheck,
  FiClock,
  FiExternalLink,
  FiGrid,
  FiMapPin,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getClubs, patchUserClub } from "../lib/apiClient";
import Loader from "../components/Loader";

type Club = {
  id: number;
  name: string;
  city: string;
  description: string | null;
  image_url: string | null;
  maps_url: string | null;
  whatsapp_url: string | null;
  court_count: number | null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function getImageUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const slash = path.startsWith("/") ? "" : "/";
  return `${window.location.origin}${slash}${path}`;
}

function toEmbedUrl(url: string): string {
  if (url.includes("/maps/embed") || url.includes("output=embed")) return url;
  if (url.includes("google.com/maps") || url.includes("maps.google.com")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}output=embed`;
  }
  return url;
}

export default function MiClub() {
  const { userId, clubId, updateClub } = useAuth();
  const navigate = useNavigate();

  const [clubs,    setClubs   ] = useState<Club[]>([]);
  const [loading,  setLoading ] = useState(true);
  const [saving,   setSaving  ] = useState(false);
  const [error,    setError   ] = useState("");
  const [selected, setSelected] = useState<number | "">(clubId ?? "");
  const [msg,      setMsg     ] = useState("");

  useEffect(() => {
    getClubs()
      .then((d) => setClubs(d.clubs ?? []))
      .catch(() => setError("No se pudieron cargar los clubs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelected(clubId ?? "");
  }, [clubId]);

  const previewClub = selected !== ""
    ? (clubs.find((c: Club) => c.id === selected) ?? null)
    : null;

  const hasChanged = selected !== (clubId ?? "");

  function handleSelect(id: number | "") {
    setMsg("");
    setError("");
    setSelected(id);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const newClubId   = selected === "" ? null : Number(selected);
      const newClubName = previewClub?.name ?? null;
      await patchUserClub(userId, newClubId);
      updateClub(newClubId, newClubName);
      setMsg("Club actualizado correctamente.");
    } catch {
      setError("No se pudo guardar el club. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setSelected(clubId ?? "");
    setMsg("");
    setError("");
  }

  return (
    <motion.div
      className="club-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="page-header-row">
        <div>
          <span className="badge">Ficha del club</span>
          <h1 className="page-title">Mi club</h1>
          <p className="page-subtitle">
            Gestiona tu club de referencia y accede rápido a disponibilidad y reservas.
          </p>
        </div>
      </div>

      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader text="Cargando clubs..." />
      ) : (
        <>
          {/* ── Grid de selección ── */}
          <div className="section-panel club-selector-panel">
            <p className="club-selector-label">
              {clubs.length} club{clubs.length !== 1 ? "s" : ""} disponibles — haz clic para seleccionar
            </p>

            <div className="club-grid">
              <button
                type="button"
                className={`club-card club-card-none${selected === "" ? " club-card-selected" : ""}`}
                onClick={() => handleSelect("")}
              >
                <FiX size={20} />
                <span>Sin club</span>
              </button>

              {clubs.map((club: Club) => {
                const isSelected = selected === club.id;
                return (
                  <button
                    key={club.id}
                    type="button"
                    className={`club-card${isSelected ? " club-card-selected" : ""}`}
                    onClick={() => handleSelect(club.id)}
                  >
                    {club.image_url ? (
                      <div className="club-card-img-wrap">
                        <img
                          src={getImageUrl(club.image_url)}
                          alt={club.name}
                          className="club-card-image"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="club-card-image-placeholder">
                        <FiGrid size={22} />
                      </div>
                    )}

                    <div className="club-card-body">
                      <div className="club-card-top">
                        <div>
                          <p className="club-card-name">{club.name}</p>
                          <p className="club-card-city">
                            <FiMapPin size={11} />
                            {club.city}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="club-card-check">
                            <FiCheck size={11} />
                          </span>
                        )}
                      </div>
                      {club.court_count != null && (
                        <span className="badge badge-neutral club-card-badge">
                          {club.court_count} pistas
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {hasChanged && (
                <motion.div
                  className="club-save-bar"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  <button type="button" className="button" onClick={handleSave} disabled={saving}>
                    <FiCheck size={14} />
                    {saving ? "Guardando..." : "Guardar selección"}
                  </button>
                  <button type="button" className="button-secondary" onClick={handleCancel} disabled={saving}>
                    <FiX size={14} />
                    Cancelar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Detalle del club seleccionado ── */}
          <AnimatePresence mode="wait">
            {previewClub ? (
              <motion.div
                key={previewClub.id}
                className="section-panel club-detail"
                variants={fadeUp}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {previewClub.image_url ? (
                  <div className="club-detail-banner-wrap">
                    <img
                      src={getImageUrl(previewClub.image_url)}
                      alt={previewClub.name}
                      className="club-detail-banner"
                    />
                    <div className="club-profile-hero-content">
                      <span className="club-status-pill">
                        <span className="club-status-dot" />
                        Club operativo
                      </span>
                      <h2>{previewClub.name}</h2>
                      <p>
                        <FiMapPin size={14} />
                        {previewClub.city}
                      </p>
                      <div className="club-profile-actions">
                        <button type="button" className="button" onClick={() => navigate("/reservar")}>
                          <FiCalendar />
                          Reservar pista
                        </button>
                        <button type="button" className="button-secondary" onClick={() => navigate("/reservar")}>
                          <FiClock />
                          Ver disponibilidad
                        </button>
                        {previewClub.whatsapp_url && (
                          <a
                            className="button-secondary"
                            href={previewClub.whatsapp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FiExternalLink />
                            Contactar por WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="club-detail-banner-placeholder club-profile-hero-placeholder">
                    <span className="club-status-pill">
                      <span className="club-status-dot" />
                      Club operativo
                    </span>
                    <FiGrid size={34} />
                    <h2>{previewClub.name}</h2>
                    <p>
                      <FiMapPin size={14} />
                      {previewClub.city}
                    </p>
                    <div className="club-profile-actions">
                      <button type="button" className="button" onClick={() => navigate("/reservar")}>
                        <FiCalendar />
                        Reservar pista
                      </button>
                      <button type="button" className="button-secondary" onClick={() => navigate("/reservar")}>
                        <FiClock />
                        Ver disponibilidad
                      </button>
                      {previewClub.whatsapp_url && (
                        <a
                          className="button-secondary"
                          href={previewClub.whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiExternalLink />
                          Contactar por WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="club-detail-content">
                  <div className="club-detail-header">
                    <div>
                      <span className="club-detail-kicker">Resumen del club</span>
                      <h2 className="club-detail-name">{previewClub.name}</h2>
                      <p className="club-detail-city">
                        <FiMapPin size={13} />
                        {previewClub.city}
                      </p>
                    </div>
                    {previewClub.court_count != null && (
                      <span className="badge">{previewClub.court_count} pistas</span>
                    )}
                  </div>

                  <div className="club-info-grid">
                    <article className="club-info-card">
                      <FiGrid />
                      <span>Pistas disponibles</span>
                      <strong>{previewClub.court_count ?? "Pendiente"}</strong>
                    </article>
                    <article className="club-info-card">
                      <FiClock />
                      <span>Horarios</span>
                      <strong>Según disponibilidad</strong>
                    </article>
                    <article className="club-info-card">
                      <FiActivity />
                      <span>Tipo de pistas</span>
                      <strong>Pádel club</strong>
                    </article>
                    <article className="club-info-card">
                      <FiMapPin />
                      <span>Ubicación</span>
                      <strong>{previewClub.city}</strong>
                    </article>
                  </div>

                  {previewClub.description && (
                    <p className="club-detail-desc">{previewClub.description}</p>
                  )}

                  <div className="club-detail-actions">
                    <button type="button" className="button" onClick={() => navigate("/reservar")}>
                      <FiCalendar />
                      Reservar pista
                    </button>
                    {previewClub.maps_url && (
                      <a
                        href={previewClub.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="club-maps-btn"
                      >
                        <FiExternalLink size={14} />
                        Ver ubicación
                      </a>
                    )}
                    {previewClub.whatsapp_url && (
                      <a
                        href={previewClub.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="club-maps-btn"
                      >
                        <FiExternalLink size={14} />
                        Contactar por WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {previewClub.maps_url && (
                  <div className="club-map">
                    <iframe
                      src={toEmbedUrl(previewClub.maps_url)}
                      title={`Mapa de ${previewClub.name}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="section-panel club-empty-state"
                variants={fadeUp}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <div className="club-empty-icon">
                  <FiGrid size={22} />
                </div>
                <p className="club-empty-title">Selecciona tu club para comenzar</p>
                <p className="club-empty-desc">
                  Elige uno de los clubs disponibles en la lista de arriba y guarda tu selección.
                </p>
                <button type="button" className="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Seleccionar club
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
