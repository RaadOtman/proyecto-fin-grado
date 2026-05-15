import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiExternalLink, FiMapPin, FiRefreshCw, FiSave, FiUser } from "react-icons/fi";
import Loader from "../components/Loader";
import { getMyProfile, updateMyProfile } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

type ProfileUser = {
  id: number;
  name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  game_level: "principiante" | "intermedio" | "avanzado" | null;
  preferred_side: "derecha" | "reves" | "indiferente" | null;
  avatar_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  bio: string | null;
  role: "user" | "admin";
  club_id: number | null;
  club_name: string | null;
};

type UserClub = {
  club_id: number;
  club_name: string;
  role_in_club: string;
  status: string;
  joined_at: string;
  is_active_club: 0 | 1;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  user: "Jugador",
};

const CLUB_ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  member: "Miembro",
};

export default function Profile() {
  const navigate = useNavigate();
  const { updateClub } = useAuth();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [clubs, setClubs] = useState<UserClub[]>([]);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gameLevel, setGameLevel] = useState<"" | "principiante" | "intermedio" | "avanzado">("");
  const [preferredSide, setPreferredSide] = useState<"" | "derecha" | "reves" | "indiferente">("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await getMyProfile();
      const nextUser = data.user as ProfileUser;
      setUser(nextUser);
      setClubs(data.clubs || []);
      setName(nextUser.name || "");
      setLastName(nextUser.last_name || "");
      setPhone(nextUser.phone || "");
      setGameLevel(nextUser.game_level || "");
      setPreferredSide(nextUser.preferred_side || "");
      setAvatarUrl(nextUser.avatar_url || "");
      setInstagramUrl(nextUser.instagram_url || "");
      setLinkedinUrl(nextUser.linkedin_url || "");
      setWebsiteUrl(nextUser.website_url || "");
      setBio(nextUser.bio || "");
      updateClub(nextUser.club_id ?? null, nextUser.club_name ?? null);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar tu perfil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const canSave = useMemo(() => {
    const hasPhone = user?.role !== "user" || phone.replace(/[\s().-]/g, "").length >= 7;
    return name.trim().length >= 2 && hasPhone && !saving;
  }, [name, phone, user?.role, saving]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError("");
    setMsg("");
    try {
      const data = await updateMyProfile({
        name: name.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        gameLevel,
        preferredSide,
        avatarUrl: avatarUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        bio: bio.trim(),
      });
      setUser(data.user);
      setMsg("Perfil actualizado correctamente");
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar tu perfil");
    } finally {
      setSaving(false);
    }
  }

  const activeClub = clubs.find((club) => club.is_active_club === 1) || null;

  return (
    <motion.div
      className="profile-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="page-header-row">
        <div>
          <span className="badge">Cuenta personal</span>
          <h1 className="page-title">Mi perfil</h1>
          <p className="page-subtitle">
            Mantén actualizados tus datos personales y tu información deportiva.
          </p>
        </div>
        <button type="button" className="button-secondary" onClick={loadProfile} disabled={loading}>
          <FiRefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader text="Cargando perfil..." />
      ) : (
        <div className="profile-grid">
          <form className="section-panel profile-form" onSubmit={onSubmit}>
            <div className="profile-card-preview">
              <div className="profile-avatar-preview">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name || "Avatar"} />
                ) : (
                  <FiUser size={28} />
                )}
              </div>
              <div>
                <span className="admin-section-kicker">Perfil jugador</span>
                <h2>{[name, lastName].filter(Boolean).join(" ") || "Tu nombre"}</h2>
                <p>{user?.email}</p>
              </div>
            </div>

            <div className="admin-section-header">
              <div>
                <span className="admin-section-kicker">Datos personales</span>
                <h2 className="admin-section-title">
                  <FiUser size={16} />
                  Información de cuenta
                </h2>
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label htmlFor="profile-name">Nombre</label>
                <input
                  id="profile-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="given-name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-last-name">Apellidos</label>
                <input
                  id="profile-last-name"
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="+34 600 000 000"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  className="input"
                  value={user?.email || ""}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-phone">Teléfono</label>
                <input
                  id="profile-phone"
                  className="input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Opcional"
                  autoComplete="tel"
                />
                {user?.role === "user" && !phone && (
                  <span className="field-warning">Añade tu teléfono para que el club pueda gestionar avisos de reserva.</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profile-avatar">Foto o avatar</label>
              <input
                id="profile-avatar"
                className="input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label htmlFor="profile-level">Nivel de juego</label>
                <select
                  id="profile-level"
                  className="input"
                  value={gameLevel}
                  onChange={(e) => setGameLevel(e.target.value as typeof gameLevel)}
                >
                  <option value="">Sin indicar</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="profile-side">Lado preferido</label>
                <select
                  id="profile-side"
                  className="input"
                  value={preferredSide}
                  onChange={(e) => setPreferredSide(e.target.value as typeof preferredSide)}
                >
                  <option value="">Sin indicar</option>
                  <option value="derecha">Derecha</option>
                  <option value="reves">Revés</option>
                  <option value="indiferente">Indiferente</option>
                </select>
              </div>
            </div>

            <div className="form-grid-three">
              <div className="form-group">
                <label htmlFor="profile-instagram">Instagram</label>
                <input
                  id="profile-instagram"
                  className="input"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-linkedin">LinkedIn</label>
                <input
                  id="profile-linkedin"
                  className="input"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-website">Web personal</label>
                <input
                  id="profile-website"
                  className="input"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                className="input profile-bio-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntale al club algo útil sobre tu juego, disponibilidad o preferencias."
              />
            </div>

            <div className="profile-readonly-grid">
              <div>
                <span>Rol</span>
                <strong>{ROLE_LABELS[user?.role || "user"] || user?.role}</strong>
              </div>
              <div>
                <span>Club activo</span>
                <strong>{user?.club_name || "Sin club activo"}</strong>
              </div>
            </div>

            <div className="page-header-actions">
              <button type="submit" className="button" disabled={!canSave}>
                <FiSave size={13} />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>

          <aside className="section-panel profile-clubs-panel">
            <div className="admin-section-header">
              <div>
                <span className="admin-section-kicker">Mis clubes</span>
                <h2 className="admin-section-title">
                  <FiMapPin size={16} />
                  Clubes asociados
                </h2>
              </div>
            </div>

            {clubs.length === 0 ? (
              <div className="empty-state profile-empty-state">
                <div className="empty-state-icon">
                  <FiMapPin size={18} />
                </div>
                <p className="empty-state-title">Sin clubes asociados</p>
                <p className="empty-state-desc">
                  Selecciona un club para poder consultar disponibilidad y reservar pistas.
                </p>
                <button type="button" className="button" onClick={() => navigate("/mi-club")}>
                  Elegir club
                </button>
              </div>
            ) : (
              <>
                <div className="profile-active-club">
                  <span className="profile-active-dot" />
                  <div>
                    <span>Club activo</span>
                    <strong>{activeClub?.club_name || user?.club_name || "Sin club activo"}</strong>
                  </div>
                </div>

                <div className="profile-club-list">
                  {clubs.map((club) => (
                    <div key={club.club_id} className="profile-club-item">
                      <div>
                        <strong>{club.club_name}</strong>
                        <span>{CLUB_ROLE_LABELS[club.role_in_club] || club.role_in_club}</span>
                      </div>
                      <span className={`badge ${club.status === "active" ? "badge-active" : "badge-neutral"}`}>
                        {club.is_active_club ? "Activo" : club.status === "active" ? "Asociado" : club.status}
                      </span>
                    </div>
                  ))}
                </div>

                <button type="button" className="button-secondary" onClick={() => navigate("/mi-club")}>
                  Cambiar club activo
                </button>
              </>
            )}

            {(instagramUrl || linkedinUrl || websiteUrl) && (
              <div className="profile-social-preview">
                {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer"><FiExternalLink /> Instagram</a>}
                {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"><FiExternalLink /> LinkedIn</a>}
                {websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer"><FiExternalLink /> Web</a>}
              </div>
            )}
          </aside>
        </div>
      )}
    </motion.div>
  );
}
