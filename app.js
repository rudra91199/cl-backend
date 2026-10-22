import express from "express";
import cors from "cors";
import router from "./routes.js";
import {errorHandler} from "./middlewares/ErrorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

// Register central routes
app.use("/api", router);

// Global Error Handler
app.use(errorHandler);

export default app;