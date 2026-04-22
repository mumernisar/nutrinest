const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { status: 'fail', error: { code: '429', message: 'Too many auth requests. Try again in 15 minutes.', details: null } },
});

const apiLimiter = rateLimit({
  windowMs, max: Number(process.env.RATE_LIMIT_MAX_ANON) || 60,
  standardHeaders: true, legacyHeaders: false,
  message: { status: 'fail', error: { code: '429', message: 'Rate limit exceeded. Please slow down.', details: null } },
});

module.exports = { authLimiter, apiLimiter };
