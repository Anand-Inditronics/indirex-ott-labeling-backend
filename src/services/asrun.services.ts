import { CreateAsRun, GetAsRunResult } from "../types/aasrun.types";
import { AppDataSource } from "../config/database";
import { AsRun } from "../entities/asrun.entity";
import * as XLSX from "xlsx";
import * as csvParseSync from "csv-parse/sync";

const { parse } = csvParseSync;

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export class AsRunService {
  private asRunRepository = AppDataSource.getRepository(AsRun);
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "radio-playback-files";
  }

  /**
   * Uploads AsRun file (CSV or Excel) to S3
   * Converts the file to JSON format before uploading
   * @param file - Multer file object
   * @returns S3 URL of the uploaded JSON file
   */
  async uploadAsRunFileToS3(file: Express.Multer.File): Promise<string> {
    try {
      // Parse file to JSON based on file type
      let jsonData: any;
      const fileExtension = file.originalname.split(".").pop()?.toLowerCase();

      if (fileExtension === "csv") {
        jsonData = this.parseCsvToJson(file.buffer);
      } else if (["xlsx", "xls"].includes(fileExtension || "")) {
        jsonData = this.parseExcelToJson(file.buffer);
      } else {
        throw new Error(
          "Unsupported file format. Only CSV and Excel files are allowed."
        );
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(jsonData, null, 2);
      const jsonBuffer = Buffer.from(jsonString);

      // Generate unique file name
      const timestamp = Date.now();
      const sanitizedFileName = file.originalname
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "_");
      const fileName = `${sanitizedFileName}-${timestamp}.json`;
      const key = `asrun-files/${fileName}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: jsonBuffer,
        ContentType: "application/json",
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Return the S3 URL
      const fileUrl = `https://${this.bucketName}.s3.${
        process.env.AWS_REGION || "us-east-1"
      }.amazonaws.com/${key}`;

      return fileUrl;
    } catch (error: any) {
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Parses CSV buffer to JSON
   * @param buffer - File buffer
   * @returns Parsed JSON data
   */
  private parseCsvToJson(buffer: Buffer): any[] {
    try {
      const csvString = buffer.toString("utf-8");
      const records = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true,
      });
      return records;
    } catch (error: any) {
      throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
  }

  /**
   * Parses Excel buffer to JSON
   * @param buffer - File buffer
   * @returns Parsed JSON data
   */
  private parseExcelToJson(buffer: Buffer): any[] {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return jsonData;
    } catch (error: any) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Creates a new AsRun record in the database
   * @param data - AsRun creation data
   * @returns Created AsRun entity
   */
  async createAsRun(data: CreateAsRun): Promise<AsRun> {
    try {
      const asRun = this.asRunRepository.create(data);
      const savedAsRun = await this.asRunRepository.save(asRun);
      return savedAsRun;
    } catch (error: any) {
      throw new Error(`Failed to create AsRun record: ${error.message}`);
    }
  }

  /**
   * Retrieves AsRun files with pagination and optional filtering
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @param channelName - Optional channel name filter
   * @returns Paginated AsRun results
   */
  async getAsRun(
    page: number = 1,
    limit: number = 10,
    channelName?: string
  ): Promise<GetAsRunResult> {
    try {
      const skip = (page - 1) * limit;

      const queryBuilder = this.asRunRepository.createQueryBuilder("asrun");

      // Apply channel name filter if provided
      if (channelName) {
        queryBuilder.where("asrun.channel_name = :channelName", {
          channelName,
        });
      }

      // Execute query with pagination
      const [asRuns, total] = await queryBuilder
        .orderBy("asrun.uploaded_at", "DESC")
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      return {
        asRuns,
        total,
        totalPages,
        currentPage: page,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch AsRun records: ${error.message}`);
    }
  }

  /**
   * Deletes AsRun records from database and their files from S3
   * @param ids - Array of AsRun IDs to delete
   * @returns Array of successfully deleted IDs
   */
  async deleteAsRun(ids: number[]): Promise<number[]> {
    try {
      const deletedIds: number[] = [];
      const errors: string[] = [];

      for (const id of ids) {
        try {
          // Find the AsRun record
          const asRun = await this.asRunRepository.findOne({ where: { id } });

          if (!asRun) {
            console.warn(`AsRun with id ${id} not found`);
            errors.push(`AsRun with id ${id} not found`);
            continue;
          }

          // Extract S3 key from URL
          const s3Key = this.extractS3KeyFromUrl(asRun.file_url);

          // Delete from S3
          if (s3Key) {
            try {
              const deleteCommand = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
              });
              await this.s3Client.send(deleteCommand);
            } catch (s3Error: any) {
              console.error(
                `Failed to delete file from S3 for id ${id}:`,
                s3Error
              );
              errors.push(
                `Failed to delete S3 file for id ${id}: ${s3Error.message}`
              );
              // Continue with database deletion even if S3 deletion fails
            }
          }

          // Delete from database
          await this.asRunRepository.delete(id);
          deletedIds.push(id);
        } catch (error: any) {
          console.error(`Error deleting AsRun with id ${id}:`, error);
          errors.push(`Failed to delete id ${id}: ${error.message}`);
        }
      }

      // If some deletions failed, log but return successful ones
      if (errors.length > 0) {
        console.warn("Some deletions failed:", errors);
      }

      return deletedIds;
    } catch (error: any) {
      throw new Error(`Failed to delete AsRun records: ${error.message}`);
    }
  }

  /**
   * Extracts S3 key from full S3 URL
   * @param url - Full S3 URL
   * @returns S3 key or null if invalid
   */
  private extractS3KeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash from pathname
      return urlObj.pathname.substring(1);
    } catch (error) {
      console.error("Invalid S3 URL:", url);
      return null;
    }
  }
}
