import { Router } from "express";
import { validateDeleteAsRun } from "../validations/asrun.validations";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware";
import { AsRunController } from "../controllers/asrun.controllers";
import { upload } from "../config/multer.config";

const router = Router();

// Upload file - Note: multer comes BEFORE validation
// File uploads need special handling with multipart/form-data
router.post(
  "/upload-file",
  authenticate,
  authorizeAdmin,
  upload.single("file"), // This must come before validation
  AsRunController.createAsRun
);

router.get("/", authenticate, authorizeAdmin, AsRunController.getAsRun);

router.delete(
  "/delete-file",
  authenticate,
  authorizeAdmin,
  validateDeleteAsRun,
  AsRunController.deleteAsRun
);

export default router;
