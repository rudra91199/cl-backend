import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { initClashClient } from "./utils/clashClient.js";

const port = process.env.PORT || 5000;

let isClashInitialized = false;

const ensureDbAndClashConnected = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in Vercel Environment Variables!");
  }

  // 1. Connect to MongoDB if not already connected (readyState 1 = connected)
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("Connected to MongoDB Atlas");
  }

  // 2. Initialize Supercell client once per warm container (non-fatal for auth routes)
  if (!isClashInitialized) {
    try {
      await initClashClient();
      isClashInitialized = true;
      console.log("Supercell Client Initialized");
    } catch (clashErr) {
      console.error("Supercell init warning:", clashErr.message);
    }
  }
};

// Local development server
if (process.env.NODE_ENV !== "production") {
  ensureDbAndClashConnected()
    .then(() => {
      app.listen(port, () => {
        console.log(`ClashLab backend running on port ${port}`);
      });
    })
    .catch((err) => console.error("Startup error:", err));
}

// Vercel Serverless Handler
export default async function handler(req, res) {
  try {
    await ensureDbAndClashConnected();
    return app(req, res);
  } catch (err) {
    console.error("Database connection failed:", err);
    return res.status(500).json({
      success: false,
      message: `Database connection error: ${err.message}`,
    });
  }
}