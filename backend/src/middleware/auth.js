const { ApiError } = require("../utils/errors");

/**
 * Asserts that a prior middleware has populated `req.user`.
 * Expected shape (produced by the Cognito verifier middleware that another
 * team member is building):
 *   req.user = { sub: string, email: string, role: 'manager'|'employee'|'admin', teamId: string }
 */
function requireAuth(req, res, next) {
  if (!req.user || !req.user.sub) {
    return next(ApiError.unauthorized("Authentication required"));
  }
  next();
}

function requireRole(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  return (req, res, next) => {
    if (!req.user || !req.user.sub) {
      return next(ApiError.unauthorized("Authentication required"));
    }
    if (!allowed.has(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${allowedRoles.join(" or ")}`));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
