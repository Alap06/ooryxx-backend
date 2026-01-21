const app = require('./src/app');
const connectDB = require('./src/config/database');
const { PORT } = require('./src/config/env');

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`➡️  Serveur démarré sur le port ${PORT}`);
  console.log(`➡️  Environnement: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Arrêt du serveur...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM SIGNAL reçu. Fermeture du serveur...');
  server.close(() => {
    console.log('Processus terminé!');
  });
});
