import { Router } from "express";
import { LabelController } from "../controllers/label.controllers";
import {
  validateCreateLabel,
  validateUpdateLabel,
} from "../validations/label.validations";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  validateCreateLabel,
  LabelController.createLabel
);
router.get("/unlabeled", authenticate, LabelController.getUnlabeledEvents);
router.get("/", authenticate, LabelController.getLabels);
router.get(
  "/program-guides/:date/:deviceId",
  LabelController.getProgramGuideByDate
);
router.delete("/bulk", authenticate, LabelController.deleteLabelsBulk);
router.put(
  "/:id",
  authenticate,
  validateUpdateLabel,
  LabelController.updateLabel
);
router.delete("/:id", authenticate, LabelController.deleteLabel);

export default router;
