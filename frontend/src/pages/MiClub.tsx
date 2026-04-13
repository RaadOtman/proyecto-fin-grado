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

// Variante de animación reutilizable para que los elementos aparezcan suavemente
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// Convierte una URL normal de Google Maps a una URL de embed para el iframe
// Si ya es embed la deja como está
function toEmbedUrl(url: string): string {
  if (url.includes("/maps/embed") || url.includes("output=embed")) return url;
  if (url.includes("google.com/maps") || url.includes("maps.google.com")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}output=embed`;
  }
  return url;
}

export default function MiClub() {
  // Sacamos del contexto el id del usuario y su club actual guardado
  const { userId, clubId, updateClub } = useAuth();

  const [clubs,    setClubs   ] = useState<Club[]>([]);
  const [loading,  setLoading ] = useState(true);
  const [saving,   setSaving  ] = useState(false);
  const [error,    setError   ] = useState("");
  const [msg,      setMsg     ] = useState("");
  // Este estado guarda el club que el usuario tiene marcado en la UI (no el guardado todavía)
  const [selected, setSelected] = useState<number | "">(clubId ?? "");

  // Cargamos la lista de clubes al entrar en la página
  useEffect(() => {
    getClubs()
      .then((d) => setClubs(d.clubs || []))
      .catch(() => setError("No se pudieron cargar los clubs."))
      .finally(() => setLoading(false));
  }, []);

  // Si el club del usuario cambia desde fuera (por ejemplo después de guardar), actualizamos la selección
  useEffect(() => {
    setSelected(clubId ?? "");
  }, [clubId]);

  // El club que se muestra en el panel de detalle es el que está seleccionado en la UI
  const previewClub = selected !== "" ? (clubs.find((c) => c.id === selected) ?? null) : null;
  // Hay cambios pendientes si la selección actual es diferente a la guardada en el backend
  const hasChanged  = selected !== (clubId ?? "");

  // Llama al backend para guardar el club seleccionado y actualiza el contexto
  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      await patchUserClub(userId, selected === "" ? null : Number(selected));
      updateClub(selected === "" ? null : Number(selected));
      setMsg("Club actualizado correctamente.");
    } catch (e: any) {
      setError(e?.message || "Error al guardar el club.");
    } finally {
      setSaving(false);
    }
  }

  // Descarta los cambios y vuelve al club guardado
  function handleCancel() {
    setSelected(clubId ?? "");
    setMsg("");
    setError("");
  }

  // Marca un club como seleccionado en la UI (aún no se guarda)
  function handleSelect(id: number | "") {
    setMsg("");
    setError("");
    setSelected(id);
  }

  return (
    <motion.div
      className="club-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
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
              {/* Opción para desvincular el club actual */}
              <button
                type="button"
                className={`club-card club-card-none${selected === "" ? " club-card-selected" : ""}`}
                onClick={() => handleSelect("")}
              >
                <FiX size={20} />
                <span>Sin club</span>
              </button>

              {/* Una card por cada club disponible */}
              {clubs.map((club) => {
                const isSelected = selected === club.id;
                return (
                  <button
                    key={club.id}
                    type="button"
                    className={`club-card${isSelected ? " club-card-selected" : ""}`}
                    onClick={() => handleSelect(club.id)}
                  >
                    {club.image_url ? (
                      <img
                        src={club.image_url}
                        alt={club.name}
                        className="club-card-image"
                      />
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

                        {/* El check verde aparece solo si este club está seleccionado */}
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

            {/* La barra de guardar solo aparece si hay cambios sin guardar */}
            <AnimatePresence>
              {hasChanged && (
                <motion.div
                  className="club-save-bar"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    className="button"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <FiCheck size={14} />
                    {saving ? "Guardando..." : "Guardar selección"}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <FiX size={14} />
                    Cancelar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Detalle del club seleccionado ── */}
          {/* AnimatePresence con mode="wait" hace que el antiguo desaparezca antes de que entre el nuevo */}
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
                  <img
                    src={previewClub.image_url}
                    alt={previewClub.name}
                    className="club-detail-banner"
                  />
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

                {/* Mapa embebido de Google Maps usando la URL del club */}
                <div className="club-map">
                  {previewClub.maps_url ? (
                    <iframe
                      src={toEmbedUrl(previewClub.maps_url)}
                      title={`Mapa de ${previewClub.name}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  ) : (
                    <div className="club-map-fallback">Ubicación no disponible</div>
                  )}
                </div>
              </motion.div>
            ) : (
              // Si no hay club seleccionado mostramos un estado vacío con instrucciones
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
