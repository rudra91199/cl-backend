import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { initClashClient } from "./utils/clashClient.js";

const port = process.env.PORT || 5000;

// 1. Establish connections (Mongoose will buffer database requests until connected)
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    // Log into Supercell
    await initClashClient(); 
    console.log('Supercell Client Initialized');

    // 2. ONLY bind the port when running locally. 
    // Vercel routes traffic dynamically in production.
    if (process.env.NODE_ENV !== 'production') {
      app.listen(port, () => {
        console.log(`Clash proxy backend running on ${port}`);
      });
    }
  })
  .catch((err) => console.error('MongoDB error:', err));

// 3. CRITICAL FOR VERCEL: You must export the Express app
export default app;