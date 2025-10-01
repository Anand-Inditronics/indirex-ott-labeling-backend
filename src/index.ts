import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/erroeHandler";
import apiRoutes from "./routes/index";
import { AppDataSource } from "./config/database";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

// Global BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use(process.env.API_PREFIX || "/api/v1", apiRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
AppDataSource.initialize()
  .then(() => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📖 Environment: ${process.env.NODE_ENV || "development"}`);
    app.listen(PORT);
  })
  .catch((err) => {
    logger.error("❌ Server failed to start due to DB connection issue:", err);
    process.exit(1);
  });

export default app;
