import { Router } from "express";
import authRoutes from "./auth.routes";
import deviceRoutes from "./device.routes";
import eventRoutes from "./events.routes";
import labelRoutes from "./label.routes";
import asrunRoutes from "./asrun.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/devices", deviceRoutes);
router.use("/labels", labelRoutes);
router.use("/asrun",asrunRoutes);
router.use("/events", eventRoutes);


export default router;
