import { DataSource } from "typeorm";
import { config } from "dotenv";
import { entities } from "../entities";
import { join } from "path";

config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url:
    process.env.DATABASE_URL ||
    "postgres://username:password@ep-project-name-123456.region.neon.tech/database_name?sslmode=require",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production",
  entities: entities,
  migrations: [join(__dirname, "../database/migrations/*.{ts,js}")],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false,
  },
});
