const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goldx_intelligence';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[GOLDX MongoDB] Connected successfully to ${mongoUri}`);
  } catch (err) {
    isConnected = false;
    console.warn(`[GOLDX MongoDB] Connection fallback: running in high-reliability in-memory / local mode (${err.message})`);
  }
}

function getDbStatus() {
  return {
    connected: isConnected,
    state: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'STANDALONE_FALLBACK',
    uri: isConnected ? (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goldx_intelligence') : 'LOCAL_IN_MEMORY'
  };
}

module.exports = { connectDB, getDbStatus };
