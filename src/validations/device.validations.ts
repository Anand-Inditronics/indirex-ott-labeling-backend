import { CreateDeviceSchema,UpdateDeviceSchema } from "../types/device.types";
import { validate } from "../middleware/validate";

export const validateCreateDevice = validate(CreateDeviceSchema);

export const validateUpdateDevice = validate(UpdateDeviceSchema);



