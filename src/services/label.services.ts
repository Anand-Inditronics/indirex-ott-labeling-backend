import { DataSource, In, Repository, Brackets } from "typeorm";
import { AppError } from "../middleware/erroeHandler";
import {
  CreateLabel,
  Label,
  UpdateLabel,
  GetUnlabeledEventsOptions,
  GetLabelsOptions,
  ProgramGuideLabel,
} from "../types/label.types";
import { logger } from "../utils/logger";
import { Label as LabelEntity } from "../entities/label.entity";
import { Event } from "../entities/event.entity";
import { LabelEvent } from "../entities/labelEvent.entity";
import { LabelCommercial } from "../entities/labelCommercial.entity";
import { LabelContent } from "../entities/labelContent.entity";
import { LabelDisruptions } from "../entities/labelDisruptions.entity";
import { LabelAd } from "../entities/labelAd.entity";
import { LabelSpotOutsideBreak } from "../entities/labelSpotOutSideBreak";
import { LabelPromo } from "../entities/labelPromo.entity";
import { LabelProgram } from "../entities/labelProgram.entity";
import { LabelMovie } from "../entities/labelMovie.entity";
import { LabelSong } from "../entities/labelSong.entity";
import { LabelSports } from "../entities/labelSports.entity";
import { LabelNews } from "../entities/labelNews.entity";
import { LabelNoVideo } from "../entities/labelNoVideo.entity";
import { LabelStandBy } from "../entities/labelStandBy.entity";
import { AppDataSource } from "../config/database";

export class LabelService {
  private labelRepository: Repository<LabelEntity>;
  private eventRepository: Repository<Event>;
  private labelEventRepository: Repository<LabelEvent>;

  constructor() {
    this.labelRepository = AppDataSource.getRepository(LabelEntity);
    this.eventRepository = AppDataSource.getRepository(Event);
    this.labelEventRepository = AppDataSource.getRepository(LabelEvent);
  }

  private getParentType(type: string): string {
    if (["ad", "spotOutsideBreak", "promo"].includes(type))
      return "LabelCommercial";
    if (["song", "program", "movie", "sports", "news"].includes(type))
      return "LabelContent";
    if (["noVideo", "standBy"].includes(type)) return "LabelDisruptions";
    throw new AppError("Invalid label type", 400);
  }

  private getSubType(label: LabelEntity): string {
    if (label.label_type === "LabelCommercial" && label.commercial) {
      if (label.commercial.ad) return "ad";
      if (label.commercial.spotOutsideBreak) return "spotOutsideBreak";
      if (label.commercial.promo) return "promo";
    }
    if (label.label_type === "LabelContent" && label.content) {
      if (label.content.song) return "song";
      if (label.content.program) return "program";
      if (label.content.movie) return "movie";
      if (label.content.sports) return "sports";
      if (label.content.news) return "news";
    }
    if (label.label_type === "LabelDisruptions" && label.disruptions) {
      if (label.disruptions.noVideo) return "noVideo";
      if (label.disruptions.standBy) return "standBy";
    }
    return "";
  }

  private mapToFlatLabel(label: LabelEntity): Label {
    let subType = "";
    const flat: Partial<Label> = {
      id: label.id,
      event_ids: label.events ? label.events.map((e) => e.event_id) : [],
      created_by: label.created_by,
      created_at: label.created_at,
      start_time: label.start_time,
      end_time: label.end_time,
      notes: label.notes,
      image_paths: label.events
        ? label.events
            .sort(
              (a, b) => Number(a.event.timestamp) - Number(b.event.timestamp)
            )
            .map((e) => e.event.image_path)
        : [],
    };

    if (label.label_type === "LabelCommercial" && label.commercial) {
      if (label.commercial.ad) {
        subType = "ad";
        flat.ad = {
          ...label.commercial.ad,
          type: label.commercial.ad.type as "COMMERCIAL_BREAK" | "PSA",
        };
      } else if (label.commercial.spotOutsideBreak) {
        subType = "spotOutsideBreak";
        flat.spotOutsideBreak = label.commercial.spotOutsideBreak;
      } else if (label.commercial.promo) {
        subType = "promo";
        flat.promo = label.commercial.promo;
      }
    } else if (label.label_type === "LabelContent" && label.content) {
      if (label.content.song) {
        subType = "song";
        flat.song = label.content.song;
      } else if (label.content.program) {
        subType = "program";
        flat.program = label.content.program;
      } else if (label.content.movie) {
        subType = "movie";
        flat.movie = label.content.movie;
      } else if (label.content.sports) {
        subType = "sports";
        flat.sports = label.content.sports;
      } else if (label.content.news) {
        subType = "news";
        flat.news = label.content.news;
      }
    } else if (label.label_type === "LabelDisruptions" && label.disruptions) {
      if (label.disruptions.noVideo) {
        subType = "noVideo";
        flat.noVideo = label.disruptions.noVideo;
      } else if (label.disruptions.standBy) {
        subType = "standBy";
        flat.standBy = label.disruptions.standBy;
      }
    }

    flat.label_type = subType as any;
    return flat as Label;
  }

  async createLabel(
    data: CreateLabel & { created_by: string }
  ): Promise<Label> {
    try {
      const eventIds = data.event_ids;
      const events = await this.eventRepository.find({
        where: { id: In(eventIds) },
        select: ["id", "timestamp", "image_path", "device_id"],
      });

      if (events.length !== eventIds.length) {
        throw new AppError("One or more events not found", 404);
      }

      const timestamps = events.map((e) => Number(e.timestamp));
      const start_time = Math.min(...timestamps).toString();
      const end_time = Math.max(...timestamps).toString();

      const label = new LabelEntity();
      label.label_type = this.getParentType(data.label_type);
      label.created_by = data.created_by;
      label.start_time = start_time;
      label.end_time = end_time;
      label.notes = data.notes ?? "";

      label.events = events
        .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
        .map((e) => {
          const le = new LabelEvent();
          le.event = e;
          return le;
        });

      if (label.label_type === "LabelCommercial") {
        const commercial = new LabelCommercial();
        commercial.commercial_type = data.label_type;
        commercial.language =
          data.ad?.language || data.spotOutsideBreak?.language || "";

        if (data.label_type === "ad" && data.ad) {
          const ad = new LabelAd();
          ad.type = data.ad.type;
          ad.brand = data.ad.brand ?? "";
          ad.product = data.ad.product ?? "";
          ad.category = data.ad.category ?? "";
          ad.sector = data.ad.sector ?? "";
          ad.format = data.ad.format ?? "";
          ad.title = data.ad.title ?? "";
          ad.language = data.ad.language ?? "";
          commercial.ad = ad;
        } else if (
          data.label_type === "spotOutsideBreak" &&
          data.spotOutsideBreak
        ) {
          const spot = new LabelSpotOutsideBreak();
          spot.brand = data.spotOutsideBreak.brand ?? "";
          spot.product = data.spotOutsideBreak.product ?? "";
          spot.category = data.spotOutsideBreak.category ?? "";
          spot.title = data.spotOutsideBreak.title ?? "";
          spot.language = data.spotOutsideBreak.language ?? "";
          spot.sector = data.spotOutsideBreak.sector ?? "";
          spot.format = data.spotOutsideBreak.format ?? "";
          commercial.spotOutsideBreak = spot;
        } else if (data.label_type === "promo" && data.promo) {
          const promo = new LabelPromo();
          promo.program_name = data.promo.program_name ?? "";
          promo.movie_name = data.promo.movie_name ?? "";
          promo.event_name = data.promo.event_name ?? "";
          commercial.promo = promo;
        }
        label.commercial = commercial;
      }

      if (label.label_type === "LabelContent") {
        const content = new LabelContent();
        content.content_type = data.label_type;
        content.language =
          data.program?.language ||
          data.movie?.language ||
          data.song?.language ||
          data.sports?.language ||
          data.news?.language ||
          "";

        if (data.label_type === "program" && data.program) {
          const program = new LabelProgram();
          program.program_name = data.program.program_name ?? "";
          program.episode_number = data.program.episode_number ?? null;
          program.season_number = data.program.season_number ?? null;
          program.genre = data.program.genre ?? "";
          program.language = data.program.language ?? "";
          content.program = program;
        } else if (data.label_type === "movie" && data.movie) {
          const movie = new LabelMovie();
          movie.movie_name = data.movie.movie_name ?? "";
          movie.genre = data.movie.genre ?? "";
          movie.duration = data.movie.duration ?? 0;
          movie.language = data.movie.language ?? "";
          movie.director = data.movie.director ?? "";
          movie.release_year = data.movie.release_year ?? 0;
          movie.rating = data.movie.rating ?? "";
          content.movie = movie;
        } else if (data.label_type === "song" && data.song) {
          const song = new LabelSong();
          song.song_name = data.song.song_name ?? "";
          song.artist = data.song.artist ?? "";
          song.album = data.song.album ?? "";
          song.language = data.song.language ?? "";
          song.release_year = data.song.release_year ?? 0;
          content.song = song;
        } else if (data.label_type === "sports" && data.sports) {
          const sports = new LabelSports();
          sports.sport_type = data.sports.sport_type;
          sports.program_title = data.sports?.program_title ?? "";
          sports.program_category = data.sports?.program_category ?? "";
          sports.language = data.sports?.language ?? "";
          sports.live = data.sports?.live ?? false;
          content.sports = sports;
        } else if (data.label_type === "news" && data.news) {
          const news = new LabelNews();
          news.news_segment = data.news.news_segment ?? "";
          news.category = data.news.category ?? "";
          news.language = data.news.language ?? "";
          news.anchor = data.news.anchor ?? "";
          news.duration = data.news.duration ?? 0;
          content.news = news;
        }
        label.content = content;
      }

      if (label.label_type === "LabelDisruptions") {
        const disruptions = new LabelDisruptions();
        disruptions.disruption_type = data.label_type;

        if (data.label_type === "noVideo" && data.noVideo) {
          const disruptions = new LabelDisruptions();
          disruptions.disruption_type = "noVideo"; // Set for LabelDisruptions
          const noVideo = new LabelNoVideo();
          noVideo.disruption_type = data.noVideo.disruption_type; // Set for LabelNoVideo
          noVideo.reason = data.noVideo.reason ?? "";
          noVideo.description = data.noVideo.description ?? "";
          disruptions.noVideo = noVideo;
          label.disruptions = disruptions;
          label.label_type = "LabelDisruptions"; // Set label_type to match entity
        } else if (data.label_type === "standBy" && data.standBy) {
          const disruptions = new LabelDisruptions();
          disruptions.disruption_type = "standBy";
          const standBy = new LabelStandBy();
          standBy.standby_type = data.standBy.standby_type; // Assuming similar schema
          standBy.reason = data.standBy.reason ?? "";
          standBy.description = data.standBy.description ?? "";
          disruptions.standBy = standBy;
          label.disruptions = disruptions;
          label.label_type = "LabelDisruptions";
        }
        label.disruptions = disruptions;
      }

      label.events = events
        .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
        .map((e) => {
          const le = new LabelEvent();
          le.label = label; // relation
          le.label_id = label.id; // FK
          le.event = e; // relation
          le.event_id = e.id.toString(); // FK
          return le;
        });

      const savedLabel = await this.labelRepository.save(label);
      return this.mapToFlatLabel(savedLabel);
    } catch (error) {
      logger.error("Error creating label:", error);
      throw new AppError("Failed to create label", 500);
    }
  }

  async getUnlabeledEvents(options: GetUnlabeledEventsOptions) {
    const qb = this.eventRepository.createQueryBuilder("event");

    qb.where(
      "NOT EXISTS (SELECT 1 FROM label_event le WHERE le.event_id = event.id)"
    );

    if (options.startDate) {
      const startTimestamp = Math.floor(options.startDate.getTime() / 1000);
      qb.andWhere("event.timestamp >= :startTimestamp", {
        startTimestamp: startTimestamp.toString(),
      });
    }

    if (options.endDate) {
      const endTimestamp = Math.floor(options.endDate.getTime() / 1000);
      qb.andWhere("event.timestamp <= :endTimestamp", {
        endTimestamp: endTimestamp.toString(),
      });
    }

    if (options.deviceId) {
      qb.andWhere("event.device_id = :deviceId", {
        deviceId: options.deviceId,
      });
    }

    if (options.types && options.types.length > 0) {
      qb.andWhere("event.type IN (:...types)", { types: options.types });
    }

    qb.skip((options.page - 1) * options.limit);
    qb.take(options.limit);

    if (options.sort) {
      qb.orderBy(
        "event.timestamp",
        options.sort.toUpperCase() as "ASC" | "DESC"
      );
    }

    const [events, total] = await qb.getManyAndCount();

    return {
      events,
      total,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
    };
  }

  async getLabels(options: GetLabelsOptions) {
    const qb = this.labelRepository
      .createQueryBuilder("label")
      .leftJoinAndSelect("label.events", "labelEvent")
      .leftJoinAndSelect("labelEvent.event", "event")
      .leftJoinAndSelect("label.commercial", "commercial")
      .leftJoinAndSelect("commercial.ad", "ad")
      .leftJoinAndSelect("commercial.spotOutsideBreak", "spotOutsideBreak")
      .leftJoinAndSelect("commercial.promo", "promo")
      .leftJoinAndSelect("label.content", "content")
      .leftJoinAndSelect("content.program", "program")
      .leftJoinAndSelect("content.movie", "movie")
      .leftJoinAndSelect("content.song", "song")
      .leftJoinAndSelect("content.sports", "sports")
      .leftJoinAndSelect("content.news", "news")
      .leftJoinAndSelect("label.disruptions", "disruptions")
      .leftJoinAndSelect("disruptions.noVideo", "noVideo")
      .leftJoinAndSelect("disruptions.standBy", "standBy");

    if (options.labelType) {
      const parentType = this.getParentType(options.labelType);
      qb.andWhere("label.label_type = :parentType", { parentType });

      if (parentType === "LabelCommercial")
        qb.andWhere("commercial.commercial_type = :type", {
          type: options.labelType,
        });
      if (parentType === "LabelContent")
        qb.andWhere("content.content_type = :type", {
          type: options.labelType,
        });
      if (parentType === "LabelDisruptions")
        qb.andWhere("disruptions.disruption_type = :type", {
          type: options.labelType,
        });
    }

    const [labels, total] = await qb.getManyAndCount();
    return {
      labels: labels.map((l) => this.mapToFlatLabel(l)),
      total,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
    };
  }

  async updateLabel(labelId: number, data: UpdateLabel): Promise<Label> {
    try {
      const label = await this.labelRepository.findOne({
        where: { id: labelId },
        relations: [
          "events",
          "events.event",
          "commercial",
          "commercial.ad",
          "commercial.spotOutsideBreak",
          "commercial.promo",
          "content",
          "content.program",
          "content.movie",
          "content.song",
          "content.sports",
          "content.news",
          "disruptions",
          "disruptions.noVideo",
          "disruptions.standBy",
        ],
      });
      if (!label) throw new AppError("Label not found", 404);

      const currentSubType = this.getSubType(label);
      const isTypeChanging =
        data.label_type && data.label_type !== currentSubType;

      // Update notes if provided
      if (data.notes !== undefined) {
        label.notes = data.notes ?? "";
      }

      // Update event_ids if provided
      if (data.event_ids && data.event_ids.length > 0) {
        const events = await this.eventRepository.find({
          where: { id: In(data.event_ids) },
          select: ["id", "timestamp", "image_path"],
        });

        if (events.length !== data.event_ids.length) {
          throw new AppError("One or more events not found", 404);
        }

        const timestamps = events.map((e) => Number(e.timestamp));
        label.start_time = Math.min(...timestamps).toString();
        label.end_time = Math.max(...timestamps).toString();
        label.events = events
          .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
          .map((e) => {
            const le = new LabelEvent();
            le.event = e;
            return le;
          });
      }

      // Handle label type change
      if (isTypeChanging) {
        const newParentType = this.getParentType(data.label_type!);
        const oldParentType = label.label_type;

        // Delete old parent type entities if changing to a different parent type
        if (oldParentType !== newParentType) {
          if (oldParentType === "LabelCommercial" && label.commercial) {
            // Mark for removal - TypeORM will handle cascade deletes
            await AppDataSource.getRepository(LabelCommercial).remove(
              label.commercial
            );
            label.commercial = null;
          }

          if (oldParentType === "LabelContent" && label.content) {
            await AppDataSource.getRepository(LabelContent).remove(
              label.content
            );
            label.content = null;
          }

          if (oldParentType === "LabelDisruptions" && label.disruptions) {
            await AppDataSource.getRepository(LabelDisruptions).remove(
              label.disruptions
            );
            label.disruptions = null;
          }
        } else {
          // Same parent type, just different subtype - clear old subtypes
          if (label.label_type === "LabelCommercial" && label.commercial) {
            if (label.commercial.ad) {
              await AppDataSource.getRepository(LabelAd).remove(
                label.commercial.ad
              );
              label.commercial.ad = null;
            }
            if (label.commercial.spotOutsideBreak) {
              await AppDataSource.getRepository(LabelSpotOutsideBreak).remove(
                label.commercial.spotOutsideBreak
              );
              label.commercial.spotOutsideBreak = null;
            }
            if (label.commercial.promo) {
              await AppDataSource.getRepository(LabelPromo).remove(
                label.commercial.promo
              );
              label.commercial.promo = null;
            }
          }

          if (label.label_type === "LabelContent" && label.content) {
            if (label.content.program) {
              await AppDataSource.getRepository(LabelProgram).remove(
                label.content.program
              );
              label.content.program = null;
            }
            if (label.content.movie) {
              await AppDataSource.getRepository(LabelMovie).remove(
                label.content.movie
              );
              label.content.movie = null;
            }
            if (label.content.song) {
              await AppDataSource.getRepository(LabelSong).remove(
                label.content.song
              );
              label.content.song = null;
            }
            if (label.content.sports) {
              await AppDataSource.getRepository(LabelSports).remove(
                label.content.sports
              );
              label.content.sports = null;
            }
            if (label.content.news) {
              await AppDataSource.getRepository(LabelNews).remove(
                label.content.news
              );
              label.content.news = null;
            }
          }

          if (label.label_type === "LabelDisruptions" && label.disruptions) {
            if (label.disruptions.noVideo) {
              await AppDataSource.getRepository(LabelNoVideo).remove(
                label.disruptions.noVideo
              );
              label.disruptions.noVideo = null;
            }
            if (label.disruptions.standBy) {
              await AppDataSource.getRepository(LabelStandBy).remove(
                label.disruptions.standBy
              );
              label.disruptions.standBy = null;
            }
          }
        }

        // Update parent type
        label.label_type = newParentType;

        // Create new type data
        if (newParentType === "LabelCommercial") {
          if (!label.commercial) {
            label.commercial = new LabelCommercial();
          }
          label.commercial.commercial_type = data.label_type!;
          label.commercial.language =
            data.ad?.language || data.spotOutsideBreak?.language || "";

          if (data.label_type === "ad" && data.ad) {
            const ad = new LabelAd();
            ad.type = data.ad.type;
            ad.brand = data.ad.brand ?? "";
            ad.product = data.ad.product ?? "";
            ad.category = data.ad.category ?? "";
            ad.sector = data.ad.sector ?? "";
            ad.format = data.ad.format ?? "";
            ad.title = data.ad.title ?? "";
            ad.language = data.ad.language ?? "";
            label.commercial.ad = ad;
          } else if (
            data.label_type === "spotOutsideBreak" &&
            data.spotOutsideBreak
          ) {
            const spot = new LabelSpotOutsideBreak();
            spot.brand = data.spotOutsideBreak.brand ?? "";
            spot.product = data.spotOutsideBreak.product ?? "";
            spot.category = data.spotOutsideBreak.category ?? "";
            spot.title = data.spotOutsideBreak.title ?? "";
            spot.language = data.spotOutsideBreak.language ?? "";
            spot.sector = data.spotOutsideBreak.sector ?? "";
            spot.format = data.spotOutsideBreak.format ?? "";
            label.commercial.spotOutsideBreak = spot;
          } else if (data.label_type === "promo" && data.promo) {
            const promo = new LabelPromo();
            promo.program_name = data.promo.program_name ?? "";
            promo.movie_name = data.promo.movie_name ?? "";
            promo.event_name = data.promo.event_name ?? "";
            label.commercial.promo = promo;
          }
        } else if (newParentType === "LabelContent") {
          if (!label.content) {
            label.content = new LabelContent();
          }
          label.content.content_type = data.label_type!;
          label.content.language =
            data.program?.language ||
            data.movie?.language ||
            data.song?.language ||
            data.sports?.language ||
            data.news?.language ||
            "";

          if (data.label_type === "program" && data.program) {
            const program = new LabelProgram();
            program.program_name = data.program.program_name ?? "";
            program.episode_number = data.program.episode_number ?? null;
            program.season_number = data.program.season_number ?? null;
            program.genre = data.program.genre ?? "";
            program.language = data.program.language ?? "";
            label.content.program = program;
          } else if (data.label_type === "movie" && data.movie) {
            const movie = new LabelMovie();
            movie.movie_name = data.movie.movie_name ?? "";
            movie.genre = data.movie.genre ?? "";
            movie.duration = data.movie.duration ?? 0;
            movie.language = data.movie.language ?? "";
            movie.director = data.movie.director ?? "";
            movie.release_year = data.movie.release_year ?? 0;
            movie.rating = data.movie.rating ?? "";
            label.content.movie = movie;
          } else if (data.label_type === "song" && data.song) {
            const song = new LabelSong();
            song.song_name = data.song.song_name ?? "";
            song.artist = data.song.artist ?? "";
            song.album = data.song.album ?? "";
            song.language = data.song.language ?? "";
            song.release_year = data.song.release_year ?? 0;
            label.content.song = song;
          } else if (data.label_type === "sports" && data.sports) {
            const sports = new LabelSports();
            sports.sport_type = data.sports.sport_type;
            sports.program_title = data.sports.program_title ?? "";
            sports.program_category = data.sports.program_category ?? "";
            sports.language = data.sports.language ?? "";
            sports.live = data.sports.live ?? false;
            label.content.sports = sports;
          } else if (data.label_type === "news" && data.news) {
            const news = new LabelNews();
            news.news_segment = data.news.news_segment ?? "";
            news.category = data.news.category ?? "";
            news.language = data.news.language ?? "";
            news.anchor = data.news.anchor ?? "";
            news.duration = data.news.duration ?? 0;
            label.content.news = news;
          }
        } else if (newParentType === "LabelDisruptions") {
          if (!label.disruptions) {
            label.disruptions = new LabelDisruptions();
          }
          label.disruptions.disruption_type = data.label_type!;

          if (data.label_type === "noVideo" && data.noVideo) {
            const noVideo = new LabelNoVideo();
            noVideo.disruption_type = data.noVideo.disruption_type;
            noVideo.reason = data.noVideo.reason ?? "";
            noVideo.description = data.noVideo.description ?? "";
            label.disruptions.noVideo = noVideo;
          } else if (data.label_type === "standBy" && data.standBy) {
            const standBy = new LabelStandBy();
            standBy.standby_type = data.standBy.standby_type;
            standBy.reason = data.standBy.reason ?? "";
            standBy.description = data.standBy.description ?? "";
            label.disruptions.standBy = standBy;
          }
        }
      } else {
        // No type change - just update existing data
        if (label.label_type === "LabelCommercial" && label.commercial) {
          if (data.ad && currentSubType === "ad" && label.commercial.ad) {
            label.commercial.ad = {
              ...label.commercial.ad,
              type: data.ad.type ?? label.commercial.ad.type,
              brand: data.ad.brand ?? label.commercial.ad.brand,
              product: data.ad.product ?? label.commercial.ad.product,
              category: data.ad.category ?? label.commercial.ad.category,
              sector: data.ad.sector ?? label.commercial.ad.sector,
              format: data.ad.format ?? label.commercial.ad.format,
              title: data.ad.title ?? label.commercial.ad.title,
              language: data.ad.language ?? label.commercial.ad.language,
            };
            label.commercial.language =
              data.ad.language ?? label.commercial.language;
          } else if (
            data.spotOutsideBreak &&
            currentSubType === "spotOutsideBreak" &&
            label.commercial.spotOutsideBreak
          ) {
            label.commercial.spotOutsideBreak = {
              ...label.commercial.spotOutsideBreak,
              brand:
                data.spotOutsideBreak.brand ??
                label.commercial.spotOutsideBreak.brand,
              product:
                data.spotOutsideBreak.product ??
                label.commercial.spotOutsideBreak.product,
              category:
                data.spotOutsideBreak.category ??
                label.commercial.spotOutsideBreak.category,
              title:
                data.spotOutsideBreak.title ??
                label.commercial.spotOutsideBreak.title,
              language:
                data.spotOutsideBreak.language ??
                label.commercial.spotOutsideBreak.language,
              sector:
                data.spotOutsideBreak.sector ??
                label.commercial.spotOutsideBreak.sector,
              format:
                data.spotOutsideBreak.format ??
                label.commercial.spotOutsideBreak.format,
            };
            label.commercial.language =
              data.spotOutsideBreak.language ?? label.commercial.language;
          } else if (
            data.promo &&
            currentSubType === "promo" &&
            label.commercial.promo
          ) {
            label.commercial.promo = {
              ...label.commercial.promo,
              program_name:
                data.promo.program_name ?? label.commercial.promo.program_name,
              movie_name:
                data.promo.movie_name ?? label.commercial.promo.movie_name,
              event_name:
                data.promo.event_name ?? label.commercial.promo.event_name,
            };
          }
        } else if (label.label_type === "LabelContent" && label.content) {
          if (
            data.program &&
            currentSubType === "program" &&
            label.content.program
          ) {
            label.content.program = {
              ...label.content.program,
              program_name:
                data.program.program_name ?? label.content.program.program_name,
              episode_number:
                data.program.episode_number ??
                label.content.program.episode_number,
              season_number:
                data.program.season_number ??
                label.content.program.season_number,
              genre: data.program.genre ?? label.content.program.genre,
              language: data.program.language ?? label.content.program.language,
            };
            label.content.language =
              data.program.language ?? label.content.language;
          } else if (
            data.movie &&
            currentSubType === "movie" &&
            label.content.movie
          ) {
            label.content.movie = {
              ...label.content.movie,
              movie_name:
                data.movie.movie_name ?? label.content.movie.movie_name,
              genre: data.movie.genre ?? label.content.movie.genre,
              director: data.movie.director ?? label.content.movie.director,
              release_year:
                data.movie.release_year ?? label.content.movie.release_year,
              language: data.movie.language ?? label.content.movie.language,
              duration: data.movie.duration ?? label.content.movie.duration,
              rating: data.movie.rating ?? label.content.movie.rating,
            };
            label.content.language =
              data.movie.language ?? label.content.language;
          } else if (
            data.song &&
            currentSubType === "song" &&
            label.content.song
          ) {
            label.content.song = {
              ...label.content.song,
              song_name: data.song.song_name ?? label.content.song.song_name,
              artist: data.song.artist ?? label.content.song.artist,
              album: data.song.album ?? label.content.song.album,
              language: data.song.language ?? label.content.song.language,
              release_year:
                data.song.release_year ?? label.content.song.release_year,
            };
            label.content.language =
              data.song.language ?? label.content.language;
          } else if (
            data.sports &&
            currentSubType === "sports" &&
            label.content.sports
          ) {
            label.content.sports = {
              ...label.content.sports,
              program_title:
                data.sports.program_title ?? label.content.sports.program_title,
              sport_type:
                data.sports.sport_type ?? label.content.sports.sport_type,
              program_category:
                data.sports.program_category ??
                label.content.sports.program_category,
              language: data.sports.language ?? label.content.sports.language,
            };
            label.content.language =
              data.sports.language ?? label.content.language;
          } else if (
            data.news &&
            currentSubType === "news" &&
            label.content.news
          ) {
            label.content.news = {
              ...label.content.news,
              news_segment:
                data.news.news_segment ?? label.content.news.news_segment,
              category: data.news.category ?? label.content.news.category,
              anchor: data.news.anchor ?? label.content.news.anchor,
              language: data.news.language ?? label.content.news.language,
              duration: data.news.duration ?? label.content.news.duration,
            };
            label.content.language =
              data.news.language ?? label.content.language;
          }
        } else if (
          label.label_type === "LabelDisruptions" &&
          label.disruptions
        ) {
          if (
            data.noVideo &&
            currentSubType === "noVideo" &&
            label.disruptions.noVideo
          ) {
            label.disruptions.noVideo = {
              ...label.disruptions.noVideo,
              reason: data.noVideo.reason ?? label.disruptions.noVideo.reason,
              description:
                data.noVideo.description ??
                label.disruptions.noVideo.description,
            };
          } else if (
            data.standBy &&
            currentSubType === "standBy" &&
            label.disruptions.standBy
          ) {
            label.disruptions.standBy = {
              ...label.disruptions.standBy,
              reason: data.standBy.reason ?? label.disruptions.standBy.reason,
              description:
                data.standBy.description ??
                label.disruptions.standBy.description,
            };
          }
        }
      }

      const savedLabel = await this.labelRepository.save(label);
      return this.mapToFlatLabel(savedLabel);
    } catch (error) {
      logger.error("Error updating label:", error);
      throw new AppError("Failed to update label", 500);
    }
  }
  async deleteLabel(labelId: number) {
    const result = await this.labelRepository.delete(labelId);
    if (result.affected === 0) throw new AppError("Label not found", 404);
  }

  async deleteLabelsBulk(labelIds: number[]) {
    await this.labelRepository.delete(labelIds);
  }

  async getProgramGuideByDate(
    date: Date,
    deviceId: string
  ): Promise<ProgramGuideLabel[]> {
    try {
      const device = await this.eventRepository.findOne({
        where: { device_id: deviceId },
      });
      if (!device) throw new AppError("Invalid device ID", 404);

      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const startTimestamp = Math.floor(startOfDay.getTime() / 1000).toString();
      const endTimestamp = Math.floor(endOfDay.getTime() / 1000).toString();

      const qb = this.labelRepository
        .createQueryBuilder("label")
        .innerJoinAndSelect("label.events", "labelEvent") // Use innerJoinAndSelect to load events
        .innerJoinAndSelect("labelEvent.event", "event")
        .leftJoinAndSelect("label.commercial", "commercial")
        .leftJoinAndSelect("commercial.ad", "ad")
        .leftJoinAndSelect("commercial.spotOutsideBreak", "spotOutsideBreak")
        .leftJoinAndSelect("commercial.promo", "promo")
        .leftJoinAndSelect("label.content", "content")
        .leftJoinAndSelect("content.program", "program")
        .leftJoinAndSelect("content.movie", "movie")
        .leftJoinAndSelect("content.song", "song")
        .leftJoinAndSelect("content.sports", "sports")
        .leftJoinAndSelect("content.news", "news")
        .leftJoinAndSelect("label.disruptions", "disruptions")
        .leftJoinAndSelect("disruptions.noVideo", "noVideo")
        .leftJoinAndSelect("disruptions.standBy", "standBy")
        .where("event.device_id = :deviceId", { deviceId })
        .andWhere("labelEvent.event_id IS NOT NULL")
        .andWhere(
          new Brackets((q) => {
            q.where(
              "CAST(label.start_time AS bigint) BETWEEN :start AND :end",
              {
                start: startTimestamp,
                end: endTimestamp,
              }
            )
              .orWhere(
                "CAST(label.end_time AS bigint) BETWEEN :start AND :end",
                {
                  start: startTimestamp,
                  end: endTimestamp,
                }
              )
              .orWhere(
                "CAST(label.start_time AS bigint) <= :start AND CAST(label.end_time AS bigint) >= :end",
                { start: startTimestamp, end: endTimestamp }
              )
              .orWhere(
                "EXISTS (SELECT 1 FROM label_event le JOIN event e ON le.event_id = e.id WHERE le.label_id = label.id AND e.timestamp BETWEEN :start AND :end)",
                { start: startTimestamp, end: endTimestamp }
              ); // Additional check for event timestamps
          })
        )
        .orderBy("CAST(label.start_time AS bigint)", "ASC");

      const labels = await qb.getMany();

      // Log for debugging
      labels.forEach((l) => {
        logger.debug(
          `Label ${l.id}: Events count = ${l.events?.length || 0}, First event device_id = ${l.events?.[0]?.event.device_id || "null"}`
        );
      });

      return labels
        .filter((l) => l.events?.length > 0)
        .map((l) => {
          const deviceIds = [
            ...new Set(
              l.events?.map((e) => e.event.device_id).filter((id) => id) || []
            ),
          ];
          if (deviceIds.length > 1) {
            logger.warn(
              `Label ${l.id} has events with multiple device_ids: ${deviceIds}`
            );
            throw new AppError(
              `Label ${l.id} has events with inconsistent device_ids`,
              400
            );
          }
          if (deviceIds.length === 0) {
            logger.warn(`Label ${l.id} has no valid device_id`);
            return null;
          }
          return {
            ...this.mapToFlatLabel(l),
            device_id: deviceIds[0],
          };
        })
        .filter((l) => l !== null) as ProgramGuideLabel[];
    } catch (error) {
      logger.error("Error fetching program guide:", error);
      throw new AppError("Failed to fetch program guide", 500);
    }
  }
}
