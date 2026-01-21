// Backend/middleware/errorMiddleware.js
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err?.message || err);

  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    message: err?.message || 'Server Error',
    // production me stack mat bhejna
    stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack
  });
};

module.exports = { notFound, errorHandler };
