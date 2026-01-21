// Backend/utils/response.js
/**
 * Small response helpers (optional, but professional + consistent)
 * Controllers me use kar sakte ho: return ok(res, "...", data)
 */

function ok(res, message = 'OK', data = null, extra = {}) {
  return res.status(200).json({ message, ...(data !== null ? { data } : {}), ...extra });
}

function created(res, message = 'Created', data = null, extra = {}) {
  return res.status(201).json({ message, ...(data !== null ? { data } : {}), ...extra });
}

function badRequest(res, message = 'Bad Request', extra = {}) {
  return res.status(400).json({ message, ...extra });
}

function unauthorized(res, message = 'Unauthorized', extra = {}) {
  return res.status(401).json({ message, ...extra });
}

function forbidden(res, message = 'Forbidden', extra = {}) {
  return res.status(403).json({ message, ...extra });
}

function notFound(res, message = 'Not Found', extra = {}) {
  return res.status(404).json({ message, ...extra });
}

function serverError(res, message = 'Server Error', extra = {}) {
  return res.status(500).json({ message, ...extra });
}

module.exports = {
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError
};
