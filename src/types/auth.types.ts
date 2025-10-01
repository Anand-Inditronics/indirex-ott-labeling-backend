import { z } from "zod";
import { Role } from "../entities/enums"; // Import UserRole enum

export const UserRoleSchema = z.enum([Role.ADMIN, Role.ANNOTATOR]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: UserRoleSchema,
  recorderId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.number().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: UserRoleSchema,
  recorderId: z.string().optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export type UpdateUser = {
  name?: string;
  email?: string;
  password?: string;
  recorderId?: string;
};

export const UpdateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    recorderId: z.string(),
  })
  .partial();

export const UpdateUserValidationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  recorderId: z.string().optional(),
});

export interface GetUsersResult {
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface LoginResponse extends BaseResponse {
  data: {
    user: User;
    token: string;
  };
}

export interface UserResponse extends BaseResponse {
  data: {
    user: User;
  };
}

export interface UsersListResponse extends BaseResponse {
  data: GetUsersResult;
}

export interface DeleteUserResponse extends BaseResponse {
  data?: never;
}

export interface AuthResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export type AuthAPIResponse =
  | LoginResponse
  | UserResponse
  | UsersListResponse
  | DeleteUserResponse;
