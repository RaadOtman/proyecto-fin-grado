function requireClubContext(req, res, next) {
  const clubId = Number(req.user?.club_id);

  if (!clubId) {
    return res.status(403).json({
      ok: false,
      error: "No hay club asociado a esta sesión. Vuelve a iniciar sesión o contacta con el administrador.",
    });
  }

  req.user.club_id = clubId;
  return next();
}

module.exports = requireClubContext;
