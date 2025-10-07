import { AsRunService } from "../services/asrun.services";
import { Request, Response } from "express";
import { CreateAsRun, DeleteAsRun } from "../types/aasrun.types";

export class AsRunController {
  private static asRunService = new AsRunService();

  static async createAsRun(req: Request, res: Response): Promise<void> {
    try {
      // Check if file exists
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || "Unknown";

      // Upload file to S3 and get URL
      const fileUrl = await AsRunController.asRunService.uploadAsRunFileToS3(
        req.file
      );

      // Prepare AsRun data
      const asRunData: CreateAsRun = {
        uploaded_by: userName,
        uploaded_at: new Date(),
        channel_name: req.body.channel_name,
        date: new Date(req.body.date),
        file_url: fileUrl,
      };

      // Save to database
      const asRun = await AsRunController.asRunService.createAsRun(asRunData);

      res.status(201).json({
        success: true,
        message: "AsRun file uploaded successfully",
        data: {
          asRun,
        },
      });
    } catch (error: any) {
      console.error("Error creating AsRun:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload AsRun file",
      });
    }
  }

  static async getAsRun(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const channelName = req.query.channel_name as string;

      const result = await AsRunController.asRunService.getAsRun(
        page,
        limit,
        channelName
      );

      res.status(200).json({
        success: true,
        message: "AsRun files retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error fetching AsRun files:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch AsRun files",
      });
    }
  }

  static async deleteAsRun(req: Request, res: Response): Promise<void> {
    try {
      const { ids }: DeleteAsRun = req.body;

      const deletedIds = await AsRunController.asRunService.deleteAsRun(ids);

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedIds.length} AsRun file(s)`,
        data: {
          deletedIds,
        },
      });
    } catch (error: any) {
      console.error("Error deleting AsRun files:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete AsRun files",
      });
    }
  }
}
