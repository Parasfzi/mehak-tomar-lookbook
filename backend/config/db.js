const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('CRITICAL: MONGODB_URI is not defined in environment variables!');
            console.log('Falling back to local MongoDB (will fail on Render)...');
        } else {
            console.log('Attempting to connect to MongoDB Atlas...');
        }

        const conn = await mongoose.connect(uri || 'mongodb://127.0.0.1:27017/mehak_tomar_lookbook');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`MongoDB Connection Error: ${err.message}`);
        // In production, we don't want to crash the whole app immediately 
        // if we want to see logs, but for Render, a crash is fine as it restarts.
        // However, we'll keep it running for a bit to ensure logs are flushed.
        setTimeout(() => process.exit(1), 5000);
    }
};

module.exports = connectDB;
