import express from "express";
import cors from "cors";
import router from "./routes.js";
import { errorHandler } from "./middlewares/ErrorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

// Add a root route so you don't get "Cannot GET /"
app.get("/", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "ClashLab Backend API is live and running!",
    timestamp: new Date().toISOString()
  });
});

// Register central routes
app.use("/api", router);

// Global Error Handler
app.use(errorHandler);

export default app;