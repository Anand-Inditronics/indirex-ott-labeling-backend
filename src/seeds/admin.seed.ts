import { AppDataSource } from "../config/database";
import { AuthService } from "../services/auth.services";
import { logger } from "../utils/logger";

async function seed() {
  try {
    await AppDataSource.initialize();
    await AuthService.createInitialAdmin();
    logger.info("Database seeding completed");
  } catch (error) {
    logger.error("Database seeding failed:", error);
    process.exit(1);
  }
}

seed();
