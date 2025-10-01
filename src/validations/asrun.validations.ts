import { CreateAsRunSchema,DeleteAsRunSchema } from "../types/aasrun.types";
import { validate } from "../middleware/validate";

export const validateCreateAsRun = validate(CreateAsRunSchema);
export const validateDeleteAsRun = validate(DeleteAsRunSchema);

