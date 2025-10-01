import { Repository, DeepPartial, QueryFailedError } from "typeorm";
import { AppDataSource } from "../config/database";
import { Device } from "../entities/device.entity";
import { CreateDevice, UpdateDevice } from "../types/device.types";
import { AppError } from "../middleware/erroeHandler";
import { logger } from "../utils/logger";

interface GetDevicesOptions {
  page?: number;
  limit?: number;
  is_active?: boolean;
}

interface GetDevicesResult {
  devices: Device[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export class DeviceService {
  private static deviceRepository: Repository<Device> =
    AppDataSource.getRepository(Device);

  static async registerDevice(deviceData: CreateDevice): Promise<Device> {
    try {
      const device = this.deviceRepository.create({
        device_id: deviceData.device_id,
        is_active: deviceData.is_active ?? true,
      });

      await this.deviceRepository.save(device);
      return device;
    } catch (error: any) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === "23505" // unique_violation in Postgres
      ) {
        throw new AppError("Device ID already exists", 400);
      }

      logger.error("Error registering device", error);
      throw new AppError("Failed to register device", 500);
    }
  }

  static async updateDevice(
    device_id: string,
    data: UpdateDevice
  ): Promise<Device> {
    try {
      const device = await this.deviceRepository.findOneBy({ device_id });

      if (!device) {
        throw new AppError("Device not found", 404);
      }

      if (data.is_active !== undefined) {
        device.is_active = data.is_active;
      }

      await this.deviceRepository.update(device_id, { is_active: device.is_active });
      const updatedDevice = await this.deviceRepository.findOneBy({ device_id });
      return updatedDevice!;
    } catch (error: any) {
      logger.error("Error updating device", error);
      throw new AppError("Failed to update device", 500);
    }
  }

  static async deleteDevice(device_id: string): Promise<void> {
    try {
      const device = await this.deviceRepository.findOneBy({ device_id });
      if (!device) {
        throw new AppError("Device not found", 404);
      }

      await this.deviceRepository.remove(device);
      // No return needed for void
    } catch (error: any) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === "23503"
      ) {
        throw new AppError("Device is in use and cannot be deleted", 400);
      }

      logger.error("Error deleting device", error);
      throw new AppError("Failed to delete device", 500);
    }
  }

  static async getAllDevices(
    options: GetDevicesOptions
  ): Promise<GetDevicesResult> {
    try {
      const page = options.page && options.page > 0 ? options.page : 1;
      const limit = options.limit && options.limit > 0 ? options.limit : 10;
      const skip = (page - 1) * limit;

      const [devices, total] = await this.deviceRepository.findAndCount({
        where: {
          is_active: options.is_active,
        },
        take: limit,
        skip,
      });

      return {
        devices,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error: any) {
      logger.error("Error fetching devices", error);
      throw new AppError("Failed to fetch devices", 500);
    }
  }

  static async getDeviceById(device_id: string): Promise<Device> {
    try {
      const device = await this.deviceRepository.findOneBy({ device_id });
      if (!device) {
        throw new AppError("Device not found", 404);
      }
      return device;
    } catch (error: any) {
      logger.error("Error fetching device", error);
      throw new AppError("Failed to fetch device", 500);
    }
  }
}
