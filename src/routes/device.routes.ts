import { Router } from "express";
import { DeviceController } from "../controllers/device.controllers";
import { validateCreateDevice,validateUpdateDevice } from "../validations/device.validations";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware";

const router = Router();

// Device routes


router.put("/:device_id", authenticate, authorizeAdmin, validateUpdateDevice, DeviceController.updateDevice);

router.delete("/:device_id", authenticate, authorizeAdmin, DeviceController.deleteDevice);

router.get("/", authenticate, authorizeAdmin, DeviceController.getDevices);

router.get("/:device_id", authenticate, authorizeAdmin, DeviceController.getDeviceById);

router.post("/register", authenticate, authorizeAdmin, validateCreateDevice, DeviceController.registerDevice);
export default router;

