/**
 * DEV-ONLY auth stub.
 *
 * Until the Cognito JWT verifier middleware lands, this reads identity from
 * request headers so endpoints can be exercised locally:
 *
 *   x-user-sub:   <cognito sub / uuid>
 *   x-user-email: <email>
 *   x-user-role:  manager | employee | admin
 *   x-user-team:  <teamId>   (omit for manager)
 *
 * Wire in ONLY when NODE_ENV !== 'production'. Replace with the real Cognito
 * middleware once it's ready — the downstream contract (req.user) is identical.
 */
function devAuth(req, res, next) {
  const sub = req.header("x-user-sub");
  if (!sub) return next();

  req.user = {
    sub,
    email: req.header("x-user-email") || null,
    role: req.header("x-user-role") || "employee",
    teamId: req.header("x-user-team") || null,
  };
  next();
}

module.exports = devAuth;
