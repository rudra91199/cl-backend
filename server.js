import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { initClashClient } from "./utils/clashClient.js"; // Import the initializer

const port = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    // Log into Supercell
    await initClashClient(); 

    app.listen(port, () => {
      console.log(`Clash proxy backend running on ${port}`);
    });
  })
  .catch((err) => console.error('MongoDB error:', err));