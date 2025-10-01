import { Router } from "express";
import { EventController } from "../controllers/events.controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, EventController.getEvents);
router.get("/:id", authenticate, EventController.getEventById);

export default router;
