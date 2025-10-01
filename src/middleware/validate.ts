import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { AppError } from "./erroeHandler";

export const validate = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("validate middleware - req.body:", req.body); // Debug log
    try {
      if (!req.body) {
        throw new AppError("Request body is missing or empty", 400);
      }
      schema.parse(req.body);
      next();
    } catch (err: any) {
      console.error("Validation error:", err); // Debug log
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        const message = firstIssue?.message || "Validation failed";
        return next(new AppError(message, 400));
      }
      const message = err?.message || "Validation failed";
      return next(new AppError(message, 400));
    }
  };
};
