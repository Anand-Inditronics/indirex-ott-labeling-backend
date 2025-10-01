import { Repository, DeepPartial } from "typeorm"; // Add DeepPartial import
import { AppDataSource } from "../config/database";
import { User } from "../entities/user.entity";
import { CreateUser, User as UserType} from "../types/auth.types";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
import { logger } from "../utils/logger";
import { AppError } from "../middleware/erroeHandler";
import { sendInviteEmail } from "../utils/emails";
import { Role } from "../entities/enums";

interface GetUsersOptions {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}

interface GetUsersResult {
  users: UserType[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export class AuthService {
  private static userRepository: Repository<User> =
    AppDataSource.getRepository(User);

  static async createUser(
    data: CreateUser,
    creatorId?: number
  ): Promise<UserType> {
    const hashedPassword = await bcrypt.hash(
      data.password,
      parseInt(process.env.BCRYPT_SALT_ROUNDS || "12")
    );

    try {
      // Explicitly type the entity object as DeepPartial<User>
      const userEntity: DeepPartial<User> = {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        recorderId: data.recorderId ?? null,
        createdBy: creatorId,
      };

      const user = this.userRepository.create(userEntity);
      const savedUser = await this.userRepository.save(user);

    //   if (data.role === "ANNOTATOR") {
    //     await sendInviteEmail({
    //       to: data.email,
    //       name: data.name,
    //       password: data.password,
    //       frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    //     });
    //   }

      return savedUser;
    } catch (error: any) {
      if (error.code === "23505") {
        throw new AppError("Email or recorderId already exists", 400);
      }
      throw new AppError("Failed to create user", 500);
    }
  }

  static async updateUser(
    id: number,
    data: Partial<CreateUser>
  ): Promise<UserType> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (data.name !== undefined) {
        user.name = data.name;
      }
      if (data.email !== undefined) {
        user.email = data.email;
      }
      if (data.password !== undefined) {
        user.password = await bcrypt.hash(
          data.password,
          parseInt(process.env.BCRYPT_SALT_ROUNDS || "12")
        );
      }
      if (data.recorderId !== undefined) {
        user.recorderId = data.recorderId;
      }

      const updatedUser = await this.userRepository.save(user);
      return updatedUser;
    } catch (error: any) {
      if (error.code === "23505") {
        throw new AppError("Email or recorderId already exists", 400);
      }
      throw new AppError("Failed to update user", 500);
    }
  }

  static async deleteUser(id: number): Promise<void> {
    try {
      const result = await this.userRepository.delete({ id });
      if (result.affected === 0) {
        throw new AppError("User not found", 404);
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete user", 500);
    }
  }

  static async getAllUsers(options: GetUsersOptions): Promise<GetUsersResult> {
    const { page, limit, role, search } = options;
    const skip = (page - 1) * limit;

    try {
      const where: any = {};
      if (role) {
        where.role = role;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { recorderId: { contains: search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await this.userRepository.findAndCount({
        where,
        skip,
        take: limit,
        order: { createdAt: "DESC" },
        select: [
          "id",
          "name",
          "email",
          "role",
          "recorderId",
          "createdAt",
          "updatedAt",
          "createdBy",
        ],
      });

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      logger.error("Error fetching users:", error);
      throw new AppError("Failed to fetch users", 500);
    }
  }

  static async getUserById(id: number): Promise<UserType> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        select: [
          "id",
          "name",
          "email",
          "role",
          "recorderId",
          "createdAt",
          "updatedAt",
          "createdBy",
        ],
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Error fetching user by ID:", error);
      throw new AppError("Failed to fetch user", 500);
    }
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ user: UserType; token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = generateToken({ id: user.id, role: user.role });
    return { user, token };
  }

  static async createInitialAdmin() {
    await this.createUser({
      name: "Mateen",
      email: "mateen@sharecast.org.np",
      password: "mateen@123",
      role: Role.ADMIN,
    });
    logger.info("Initial admin created successfully");
  }
}
