require('dotenv').config();
const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION 💥', err.name, err.message);
  process.exit(1);
});

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀  NutriNest API running on port ${PORT} [${process.env.NODE_ENV}]`);
      console.log(`📋  Health: http://localhost:${PORT}/api/health`);
    });

    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION 💥', err.name, err.message);
      server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => console.log('Process terminated.'));
    });
  })
  .catch((err) => {
    console.error('❌  Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
