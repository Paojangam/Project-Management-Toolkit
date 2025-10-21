// usage: authorize('admin', 'manager')
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden: insufficient role');
    }
    next();
  };
};
