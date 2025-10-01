import { z } from "zod";
import { CreateLabelSchema, UpdateLabelSchema } from "../types/label.types";
import { validate } from "../middleware/validate";

export const validateCreateLabel = validate(CreateLabelSchema);
export const validateUpdateLabel = validate(UpdateLabelSchema);
