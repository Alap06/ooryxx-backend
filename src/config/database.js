const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = async () => {
  try {
    // Index optimization - Disable auto-index to prevent startup crashes
    mongoose.set('autoIndex', false);

    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`MongoDB connecté: ${conn.connection.host}`);

    // Connection events
    mongoose.connection.on('error', (err) => {
      console.error('Erreur de connexion MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB déconnecté');
    });

  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
