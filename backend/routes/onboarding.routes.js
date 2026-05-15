const express = require("express");
const jwt     = require("jsonwebtoken");
const pool    = require("../db");
const auth    = require("../middleware/auth");
const requireClubContext = require("../middleware/requireClubContext");

const router = express.Router();

const DEFAULT_CLUB_NAME = "PADEX Club";

function issueSessionCookie(res, user) {
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
}

async function getUserWithClub(userId) {
  const [rows] = await pool.query(
    `SELECT u.id,
            u.name,
            u.email,
            u.role,
            u.club_id,
            c.name AS club_name
     FROM   users u
     LEFT JOIN clubs c ON c.id = u.club_id
     WHERE  u.id = ?
     LIMIT  1`,
    [userId]
  );
  return rows[0] || null;
}

async function getOnboardingState(user) {
  const hasClub = Boolean(user?.club_id);
  const isPlaceholderClub = !hasClub || user.club_name === DEFAULT_CLUB_NAME;
  const isAdmin = user?.role === "admin";

  let courtsCount = 0;
  let hasSettings = false;

  if (hasClub) {
    const [[courtStats]] = await pool.query(
      "SELECT COUNT(*) AS courtsCount FROM courts WHERE club_id = ?",
      [user.club_id]
    );
    courtsCount = courtStats?.courtsCount || 0;

    const [settingsRows] = await pool.query(
      "SELECT id FROM club_settings WHERE club_id = ? LIMIT 1",
      [user.club_id]
    );
    hasSettings = settingsRows.length > 0;
  }

  const complete = isAdmin && hasClub && !isPlaceholderClub && courtsCount > 0 && hasSettings;
  const needsOnboarding = isAdmin && !complete;
  const needsClubSelection = !isAdmin && (!hasClub || isPlaceholderClub);

  return {
    complete,
    needs_onboarding: needsOnboarding,
    needsOnboarding,
    needs_club_selection: needsClubSelection,
    needsClubSelection,
    role: user.role,
    current_step: !isAdmin
      ? "club-selection"
      : !hasClub || isPlaceholderClub
        ? "club"
        : courtsCount === 0
          ? "courts"
          : !hasSettings
            ? "settings"
            : "complete",
    club: hasClub
      ? { id: user.club_id, name: user.club_name, is_placeholder: isPlaceholderClub }
      : null,
    courts_count: courtsCount,
    has_settings: hasSettings,
  };
}

router.get("/status", auth, async (req, res) => {
  try {
    const user = await getUserWithClub(req.user.id);
    if (!user) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const onboarding = await getOnboardingState(user);
    return res.json({ ok: true, onboarding, user });
  } catch (e) {
    console.error("ONBOARDING STATUS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo onboarding" });
  }
});

router.post("/club", auth, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const name        = String(req.body?.name || "").trim();
    const city        = String(req.body?.city || "").trim();
    const address     = String(req.body?.address || "").trim() || null;
    const description = String(req.body?.description || "").trim() || null;

    if (!name || !city) {
      return res.status(400).json({ ok: false, error: "Nombre y ciudad son obligatorios" });
    }

    await conn.beginTransaction();

    const [[user]] = await conn.query(
      `SELECT u.id, u.name, u.email, u.role, u.club_id, c.name AS club_name
       FROM users u
       LEFT JOIN clubs c ON c.id = u.club_id
       WHERE u.id = ?
       LIMIT 1
       FOR UPDATE`,
      [req.user.id]
    );

    if (!user) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }
    if (user.role !== "admin") {
      await conn.rollback();
      return res.status(403).json({ ok: false, error: "Solo una cuenta de club puede crear un club" });
    }

    if (user.club_id && user.club_name !== DEFAULT_CLUB_NAME) {
      const existingUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        club_id: user.club_id,
        club_name: user.club_name,
      };
      issueSessionCookie(res, existingUser);
      await conn.commit();
      return res.json({
        ok: true,
        clubId: user.club_id,
        message: "El usuario ya tiene un club configurado",
        user: existingUser,
      });
    }

    const [clubResult] = await conn.query(
      `INSERT INTO clubs (name, city, address, description, image_url, maps_url, court_count)
       VALUES (?, ?, ?, ?, NULL, NULL, 0)`,
      [name, city, address, description]
    );

    const clubId = clubResult.insertId;

    await conn.query("UPDATE users SET club_id = ? WHERE id = ?", [clubId, user.id]);

    await conn.query(
      `INSERT INTO club_settings
         (club_id, club_name, opening_time, closing_time, slot_minutes, max_days_ahead, cancel_hours_limit)
       VALUES (?, ?, '09:00:00', '22:00:00', 90, 14, 12)`,
      [clubId, name]
    );

    await conn.commit();

    const updatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: "admin",
      club_id: clubId,
      club_name: name,
    };
    issueSessionCookie(res, updatedUser);

    return res.status(201).json({
      ok: true,
      clubId,
      user: updatedUser,
      message: "Club creado",
    });
  } catch (e) {
    await conn.rollback();
    console.error("ONBOARDING CREATE CLUB ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error creando el club" });
  } finally {
    conn.release();
  }
});

router.post("/courts", auth, requireClubContext, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Solo una cuenta de club puede crear pistas" });
    }

    const clubId = req.user.club_id;
    const count = Math.min(Math.max(Number(req.body?.count) || 1, 1), 20);
    const type = String(req.body?.type || "Exterior").trim();

    if (!["Interior", "Exterior"].includes(type)) {
      return res.status(400).json({ ok: false, error: "Tipo de pista inválido" });
    }

    const [[existing]] = await pool.query(
      "SELECT COUNT(*) AS total FROM courts WHERE club_id = ?",
      [clubId]
    );

    if (existing.total > 0) {
      return res.json({
        ok: true,
        created: 0,
        courts_count: existing.total,
        message: "El club ya tiene pistas configuradas",
      });
    }

    const values = Array.from({ length: count }, (_, i) => [
      clubId,
      `Pista ${i + 1}`,
      type,
      4,
      null,
    ]);

    await pool.query(
      "INSERT INTO courts (club_id, name, type, capacity, notes) VALUES ?",
      [values]
    );

    await pool.query(
      "UPDATE clubs SET court_count = ? WHERE id = ?",
      [count, clubId]
    );

    return res.status(201).json({
      ok: true,
      created: count,
      courts_count: count,
      message: "Pistas creadas",
    });
  } catch (e) {
    console.error("ONBOARDING COURTS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error creando pistas" });
  }
});

router.put("/settings", auth, requireClubContext, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Solo una cuenta de club puede configurar horarios" });
    }

    const clubId = req.user.club_id;
    const openingTime = String(req.body?.opening_time || "").trim();
    const closingTime = String(req.body?.closing_time || "").trim();
    const slotMinutes = Number(req.body?.slot_minutes) || 90;

    if (!/^\d{2}:\d{2}$/.test(openingTime) || !/^\d{2}:\d{2}$/.test(closingTime)) {
      return res.status(400).json({ ok: false, error: "Formato de horario inválido" });
    }

    if (![60, 90, 120].includes(slotMinutes)) {
      return res.status(400).json({ ok: false, error: "Duración de tramo inválida" });
    }

    if (openingTime >= closingTime) {
      return res.status(400).json({ ok: false, error: "La apertura debe ser anterior al cierre" });
    }

    const [[club]] = await pool.query(
      "SELECT name FROM clubs WHERE id = ? LIMIT 1",
      [clubId]
    );
    if (!club) {
      return res.status(404).json({ ok: false, error: "Club no encontrado" });
    }

    const [settingsRows] = await pool.query(
      "SELECT id FROM club_settings WHERE club_id = ? LIMIT 1",
      [clubId]
    );

    if (settingsRows.length > 0) {
      await pool.query(
        `UPDATE club_settings
         SET club_name = ?, opening_time = ?, closing_time = ?, slot_minutes = ?
         WHERE club_id = ?`,
        [club.name, `${openingTime}:00`, `${closingTime}:00`, slotMinutes, clubId]
      );
    } else {
      await pool.query(
        `INSERT INTO club_settings
           (club_id, club_name, opening_time, closing_time, slot_minutes, max_days_ahead, cancel_hours_limit)
         VALUES (?, ?, ?, ?, ?, 14, 12)`,
        [clubId, club.name, `${openingTime}:00`, `${closingTime}:00`, slotMinutes]
      );
    }

    return res.json({
      ok: true,
      settings: {
        opening_time: openingTime,
        closing_time: closingTime,
        slot_minutes: slotMinutes,
      },
    });
  } catch (e) {
    console.error("ONBOARDING SETTINGS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error guardando horarios" });
  }
});

router.post("/complete", auth, requireClubContext, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Solo una cuenta de club puede completar onboarding" });
    }

    const user = await getUserWithClub(req.user.id);
    if (!user) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const onboarding = await getOnboardingState(user);
    if (!onboarding.complete) {
      return res.status(400).json({
        ok: false,
        error: "Faltan pasos para completar el onboarding",
        onboarding,
      });
    }

    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      club_id: user.club_id,
      club_name: user.club_name,
    };
    issueSessionCookie(res, responseUser);

    return res.json({ ok: true, onboarding, user: responseUser });
  } catch (e) {
    console.error("ONBOARDING COMPLETE ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error completando onboarding" });
  }
});

module.exports = router;
