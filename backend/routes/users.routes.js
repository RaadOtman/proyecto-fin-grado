const express = require("express");
const jwt     = require("jsonwebtoken");
const pool    = require("../db");
const auth    = require("../middleware/auth");

const router = express.Router();

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeProfile(body) {
  const name = cleanText(body?.name);
  const lastName = cleanText(body?.lastName ?? body?.last_name);
  const phone = cleanText(body?.phone);
  const gameLevel = cleanText(body?.gameLevel ?? body?.game_level);
  const preferredSide = cleanText(body?.preferredSide ?? body?.preferred_side);
  const avatarUrl = cleanText(body?.avatarUrl ?? body?.avatar_url);
  const instagramUrl = cleanText(body?.instagramUrl ?? body?.instagram_url);
  const linkedinUrl = cleanText(body?.linkedinUrl ?? body?.linkedin_url);
  const websiteUrl = cleanText(body?.websiteUrl ?? body?.website_url);
  const bio = cleanText(body?.bio);
  return { name, lastName, phone, gameLevel, preferredSide, avatarUrl, instagramUrl, linkedinUrl, websiteUrl, bio };
}

function isValidPhone(phone) {
  if (!phone) return false;
  const compact = String(phone).replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(compact);
}

function isValidUrlOrEmpty(url) {
  if (!url) return true;
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(url);
}

// ── GET /users/me ─────────────────────────────────────────────
// Devuelve el perfil personal del usuario autenticado.
router.get("/me", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id,
              u.name,
              u.last_name,
              u.email,
              u.phone,
              u.game_level,
              u.preferred_side,
              u.avatar_url,
              u.instagram_url,
              u.linkedin_url,
              u.website_url,
              u.bio,
              u.role,
              u.club_id,
              c.name AS club_name
       FROM users u
       LEFT JOIN clubs c ON c.id = u.club_id
       WHERE u.id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const [clubs] = await pool.query(
      `SELECT uc.club_id,
              c.name AS club_name,
              uc.role_in_club,
              uc.status,
              uc.joined_at,
              CASE WHEN uc.club_id = ? THEN 1 ELSE 0 END AS is_active_club
       FROM user_clubs uc
       JOIN clubs c ON c.id = uc.club_id
       WHERE uc.user_id = ?
       ORDER BY is_active_club DESC, uc.joined_at DESC`,
      [rows[0].club_id || 0, req.user.id]
    );

    return res.json({ ok: true, user: rows[0], clubs });
  } catch (e) {
    console.error("GET /users/me ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo perfil" });
  }
});

// ── PUT /users/me ─────────────────────────────────────────────
// Actualiza solo datos personales del usuario autenticado.
router.put("/me", auth, async (req, res) => {
  try {
    const { name, lastName, phone, gameLevel, preferredSide, avatarUrl, instagramUrl, linkedinUrl, websiteUrl, bio } = normalizeProfile(req.body);

    if (!name || name.length < 2) {
      return res.status(400).json({ ok: false, error: "El nombre debe tener al menos 2 caracteres" });
    }
    if (req.user.role === "user" && !isValidPhone(phone)) {
      return res.status(400).json({ ok: false, error: "El teléfono es obligatorio para jugadores" });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ ok: false, error: "El teléfono no tiene un formato válido" });
    }

    const allowedLevels = [null, "principiante", "intermedio", "avanzado"];
    const allowedSides = [null, "derecha", "reves", "indiferente"];
    if (!allowedLevels.includes(gameLevel)) {
      return res.status(400).json({ ok: false, error: "Nivel de juego inválido" });
    }
    if (!allowedSides.includes(preferredSide)) {
      return res.status(400).json({ ok: false, error: "Lado preferido inválido" });
    }
    if (![avatarUrl, instagramUrl, linkedinUrl, websiteUrl].every(isValidUrlOrEmpty)) {
      return res.status(400).json({ ok: false, error: "Las URLs deben empezar por http:// o https://" });
    }

    await pool.query(
      `UPDATE users
       SET name = ?,
           last_name = ?,
           phone = ?,
           game_level = ?,
           preferred_side = ?,
           avatar_url = ?,
           instagram_url = ?,
           linkedin_url = ?,
           website_url = ?,
           bio = ?
       WHERE id = ?`,
      [name, lastName, phone, gameLevel, preferredSide, avatarUrl, instagramUrl, linkedinUrl, websiteUrl, bio, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT u.id,
              u.name,
              u.last_name,
              u.email,
              u.phone,
              u.game_level,
              u.preferred_side,
              u.avatar_url,
              u.instagram_url,
              u.linkedin_url,
              u.website_url,
              u.bio,
              u.role,
              u.club_id,
              c.name AS club_name
       FROM users u
       LEFT JOIN clubs c ON c.id = u.club_id
       WHERE u.id = ?
       LIMIT 1`,
      [req.user.id]
    );

    return res.json({ ok: true, user: rows[0], message: "Perfil actualizado" });
  } catch (e) {
    console.error("PUT /users/me ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error actualizando perfil" });
  }
});

// ── PATCH /users/:id/club ─────────────────────────────────────
// Actualiza el club al que pertenece el usuario
// body: { clubId }  — enviar null para desasociar el club
// Solo el propio usuario puede cambiar su club
router.patch("/:id/club", auth, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const id     = Number(req.params.id);
    const clubId = req.body?.clubId != null ? Number(req.body.clubId) : null;

    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    // Un usuario no puede modificar el club de otra persona
    if (id !== req.user.id) {
      return res.status(403).json({ ok: false, error: "No autorizado" });
    }

    if (req.user.role !== "user") {
      return res.status(403).json({ ok: false, error: "Solo los jugadores pueden seleccionar club desde esta ruta" });
    }

    await conn.beginTransaction();

    // Si envían un clubId, comprobamos que ese club exista en la base de datos
    if (clubId !== null) {
      const [clubs] = await conn.query(
        "SELECT id, name FROM clubs WHERE id = ? AND name != 'PADEX Club' LIMIT 1",
        [clubId]
      );
      if (clubs.length === 0) {
        await conn.rollback();
        return res.status(404).json({ ok: false, error: "Club no encontrado" });
      }

      await conn.query(
        `INSERT INTO user_clubs (user_id, club_id, role_in_club, status, joined_at, created_at)
         VALUES (?, ?, 'member', 'active', NOW(), NOW())
         ON DUPLICATE KEY UPDATE status = 'active', role_in_club = IF(role_in_club = 'admin', 'admin', 'member')`,
        [id, clubId]
      );
    }

    // users.club_id sigue siendo el club activo/principal por compatibilidad con reservas y JWT.
    await conn.query("UPDATE users SET club_id = ? WHERE id = ?", [clubId, id]);

    // Devolvemos los datos actualizados del usuario
    const [rows] = await conn.query(
      `SELECT u.id, u.name, u.email, u.role, u.club_id, c.name AS club_name
       FROM users u
       LEFT JOIN clubs c ON c.id = u.club_id
       WHERE u.id = ?
       LIMIT 1`,
      [id]
    );

    const [clubs] = await conn.query(
      `SELECT uc.club_id,
              c.name AS club_name,
              uc.role_in_club,
              uc.status,
              uc.joined_at
       FROM user_clubs uc
       JOIN clubs c ON c.id = uc.club_id
       WHERE uc.user_id = ?
       ORDER BY uc.joined_at DESC`,
      [id]
    );

    await conn.commit();

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, club_id: user.club_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("padel_token", token, {
      httpOnly: true,
      secure:   isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true, user, clubs });
  } catch (e) {
    await conn.rollback();
    console.error("PATCH /users/:id/club ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error actualizando club" });
  } finally {
    conn.release();
  }
});

module.exports = router;
