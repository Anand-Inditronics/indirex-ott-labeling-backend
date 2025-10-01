import { AppDataSource } from "../config/database";
import { Device } from "../entities/device.entity";
import { Event } from "../entities/event.entity";
import { EventAd } from "../entities/eventAd.entity";
import { EventChannel } from "../entities/eventChannel.entity";
import { logger } from "../utils/logger";
import { DeepPartial, QueryFailedError } from "typeorm";

// Sample data
const devices = ["R-1001", "R-1002", "R-1003"];
const channels = [
  { name: "Global TV", score: 0.81 },
  { name: "Nepal TV", score: 0.85 },
  { name: "Kantipur TV", score: 0.78 },
];
const ads = [
  { name: "Shivam Cement", score: 0.96 },
  { name: "Dabur Honey", score: 0.92 },
  { name: "Wai Wai Noodles", score: 0.94 },
];

// Helpers
const getRandomTimestamp = (): bigint => {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const randomTime = sevenDaysAgo + Math.random() * (now - sevenDaysAgo);
  return BigInt(Math.floor(randomTime / 1000));
};

const getRandomSubset = <T>(arr: T[], min: number, max: number): T[] => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const generateEventData = (deviceId: string) => {
  const hasChannel = Math.random() > 0.3;
  const hasAds = Math.random() > 0.4;
  const eventChannels = hasChannel ? getRandomSubset(channels, 1, 1) : [];
  const eventAds = hasAds ? getRandomSubset(ads, 1, 3) : [];
  const maxScore =
    eventAds.length > 0 ? Math.max(...eventAds.map((ad) => ad.score)) : null;
  const imagePath =
    hasAds || hasChannel
      ? `https://apm-captured-images.s3.ap-south-1.amazonaws.com/Nepal_Frames/analyzed_frames/${deviceId}/${deviceId}_${getRandomTimestamp()}_recognized.jpg`
      : null;

  return {
    device_id: deviceId,
    timestamp: getRandomTimestamp(),
    type: 29,
    image_path: imagePath,
    max_score: maxScore,
    ads: eventAds,
    channels: eventChannels,
  };
};

async function seedEvents() {
  try {
    logger.info("Initializing database connection...");
    await AppDataSource.initialize();
    logger.info("Database connection established successfully");

    const eventRepo = AppDataSource.getRepository(Event);
    const adRepo = AppDataSource.getRepository(EventAd);
    const channelRepo = AppDataSource.getRepository(EventChannel);

    const eventCountPerDevice = Math.floor(50 / devices.length);
    const eventsData = devices.flatMap((deviceId) =>
      Array.from({ length: eventCountPerDevice }, () =>
        generateEventData(deviceId)
      )
    );

    eventsData.sort(() => Math.random() - 0.5);

    const batchSize = 10;
    const batches: (typeof eventsData)[] = [];
    for (let i = 0; i < eventsData.length; i += batchSize) {
      batches.push(eventsData.slice(i, i + batchSize));
    }

    let totalCreated = 0;

    for (const [index, batch] of batches.entries()) {
      logger.info(`Processing batch ${index + 1} of ${batches.length}...`);

      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const createdEvents: Event[] = [];

        for (const eventData of batch) {
          let eventId: bigint;
          let attempts = 0;
          const maxAttempts = 3;
          let event: Event | null = null;

          while (attempts < maxAttempts) {
            eventId = BigInt(Math.floor(Math.random() * 1000000) + 100000);
            try {
              // Create and save the Event entity first
              const eventEntity = queryRunner.manager.create(Event, {
                id: eventId.toString(),
                device_id: eventData.device_id,
                timestamp: eventData.timestamp.toString(),
                type: eventData.type,
                image_path: eventData.image_path,
                max_score: eventData.max_score,
                created_at: new Date(),
              } as DeepPartial<Event>);

              event = await queryRunner.manager.save(eventEntity);

              // Create and save EventAd entities
              if (eventData.ads.length > 0) {
                if (!event) {
                  throw new Error("Event is null after creation, cannot assign ads.");
                }
                const ads = eventData.ads.map((ad) =>
                  queryRunner.manager.create(EventAd, {
                    event_id: event!.id.toString(),
                    name: ad.name,
                    score: ad.score,
                  } as DeepPartial<EventAd>)
                );
                await queryRunner.manager.save(ads);
              // Create and save EventChannel entities
              if (eventData.channels.length > 0) {
                if (!event) {
                  throw new Error("Event is null after creation, cannot assign channels.");
                }
                const channels = eventData.channels.map((ch) =>
                  queryRunner.manager.create(EventChannel, {
                    event_id: event!.id.toString(),
                    name: ch.name,
                    score: ch.score,
                  } as DeepPartial<EventChannel>)
                );
                const savedChannels = await queryRunner.manager.save(channels);
                event.channels = savedChannels;
              }
              }

              createdEvents.push(event);
              break;
            } catch (error: any) {
              if (
                error instanceof QueryFailedError &&
                (error as any).code === "23505"
              ) {
                attempts++;
                if (attempts === maxAttempts) {
                  throw new Error(
                    `Failed to generate unique event ID for device ${eventData.device_id} after ${maxAttempts} attempts`
                  );
                }
                continue;
              }
              throw error;
            }
          }
        }

        await queryRunner.commitTransaction();
        totalCreated += createdEvents.length;
        logger.info(
          `Batch ${index + 1} completed: ${createdEvents.length} events created`
        );
      } catch (err) {
        await queryRunner.rollbackTransaction();
        logger.error("Error creating batch", err);
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    logger.info(
      `Successfully seeded ${totalCreated} events across ${batches.length} batches.`
    );
  } catch (error) {
    logger.error("Failed to initialize database or seed events", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info("Database connection closed");
    }
  }
}

seedEvents().catch((e) => {
  console.error(e);
  process.exit(1);
});
