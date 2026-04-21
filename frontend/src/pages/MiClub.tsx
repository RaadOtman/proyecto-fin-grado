import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiCheck, FiX, FiGrid } from "react-icons/fi";
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
          <h1 className="page-title">Mi club</h1>
          <p className="page-subtitle">Selecciona el club al que perteneces.</p>
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
                  </div>
                ) : (
                  <div className="club-detail-banner-placeholder">
                    <FiGrid size={32} />
                  </div>
                )}

                <div className="club-detail-content">
                  <div className="club-detail-header">
                    <div>
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

                  {previewClub.description && (
                    <p className="club-detail-desc">{previewClub.description}</p>
                  )}

                  {previewClub.maps_url && (
                    <a
                      href={previewClub.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="club-maps-btn"
                    >
                      <FiMapPin size={14} />
                      Ver en Google Maps
                    </a>
                  )}
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
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
