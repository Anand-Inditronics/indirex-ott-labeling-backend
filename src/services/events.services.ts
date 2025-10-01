import { AppDataSource } from "../config/database"; // Add this import
import { Event as TypeOrmEvent } from "../entities/event.entity";
import { AppError } from "../middleware/erroeHandler";
import { logger } from "../utils/logger";
import { Events, GetEventOptions, GetEventResult } from "../types/events.types";
import { EventAd } from "../entities/eventAd.entity";
import { EventChannel } from "../entities/eventChannel.entity";
import { EventContent } from "../entities/eventContent.entity";

// Enhanced helper function to convert TypeORM Event to custom Event type
const serializeEvent = (event: TypeOrmEvent): Events => {
  return {
    device_id: event.device_id,
    timestamp: event.timestamp.toString(),
    type: event.type,
    image_path: event.image_path || undefined,
    max_score: event.max_score || undefined,
    ads:
      event.ads?.map((ad: EventAd) => ({
        id: ad.id,
        event_id: ad.event_id.toString(),
        name: ad.name,
        score: ad.score || null,
      })) || [],
    channels:
      event.channels?.map((channel: EventChannel) => ({
        id: channel.id,
        event_id: channel.event_id.toString(),
        name: channel.name,
        score: channel.score || null,
      })) || [],
    content:
      event.content?.map((content: EventContent) => ({
        id: content.id,
        event_id: content.event_id.toString(),
        name: content.name,
        score: content.score || null,
      })) || [],
  };
};

export class EventService {
  static async getEvents(options: GetEventOptions): Promise<GetEventResult> {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      deviceId,
      types,
      sort,
      category,
    } = options;
    const skip = (page - 1) * limit;

    try {
      // Use AppDataSource.getRepository instead of getRepository
      const eventRepository = AppDataSource.getRepository(TypeOrmEvent);

      const queryBuilder = eventRepository
        .createQueryBuilder("event")
        .leftJoinAndSelect("event.ads", "ads")
        .leftJoinAndSelect("event.channels", "channels")
        .leftJoinAndSelect("event.content", "content");

      if (startDate || endDate) {
        const timestampConditions: any = {};
        if (startDate) {
          timestampConditions.gte = BigInt(
            Math.floor(startDate.getTime() / 1000)
          );
        }
        if (endDate) {
          timestampConditions.lte = BigInt(
            Math.floor(endDate.getTime() / 1000)
          );
        }
        queryBuilder.andWhere(
          "event.timestamp BETWEEN :gte AND :lte",
          timestampConditions
        );
      }

      if (deviceId) {
        queryBuilder.andWhere("event.device_id = :deviceId", { deviceId });
      }

      if (typeof types === "number") {
        queryBuilder.andWhere("event.type = :type", { type: types });
      }

      if (category) {
        if (category === "ads") {
          queryBuilder.andWhere(
            "exists (select 1 from event_ad where event_ad.event_id = event.id)"
          );
        } else if (category === "channels") {
          queryBuilder.andWhere(
            "exists (select 1 from event_channel where event_channel.event_id = event.id)"
          );
        } else if (category === "content") {
          queryBuilder.andWhere(
            "exists (select 1 from event_content where event_content.event_id = event.id)"
          );
        }
      }

      queryBuilder
        .orderBy(
          "event.timestamp",
          (sort?.toUpperCase() as "ASC" | "DESC") || "DESC"
        )
        .skip(skip)
        .take(limit);

      const [events, total] = await queryBuilder.getManyAndCount();

      // Serialize events to match the custom Event type
      const serializedEvents = events.map((event) => serializeEvent(event));

      return {
        events: serializedEvents,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error("Error fetching events:", error);
      throw new AppError("Failed to fetch events", 500);
    }
  }

  static async getEventById(id: bigint): Promise<Events> {
    try {
      // Use AppDataSource.getRepository instead of getRepository
      const eventRepository = AppDataSource.getRepository(TypeOrmEvent);

      const event = await eventRepository.findOne({
        where: { id: id.toString() },
        relations: ["ads", "channels", "content"],
      });

      if (!event) {
        throw new AppError("Event not found", 404);
      }

      return serializeEvent(event);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Error fetching event by ID:", error);
      throw new AppError("Failed to fetch event", 500);
    }
  }
}
