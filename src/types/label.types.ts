import { z } from "zod";

export const LabelSongSchema = z.object({
  label_id: z.number().optional(),
  song_name: z.string().min(1, "Song name is required"),
  artist: z.string().nullable(),
  album: z.string().nullable(),
  language: z.string().nullable(),
  release_year: z.number().int().positive().nullable(),
});

export type LabelSong = z.infer<typeof LabelSongSchema>;

export const LabelAdSchema = z.object({
  label_id: z.number().optional(),
  type: z.enum(["COMMERCIAL_BREAK", "PSA"]), // Excluded 'SPOT_OUTSIDE_BREAK' as it's now separate
  brand: z.string().min(1, "Brand is required").nullable(),
  product: z.string().nullable(),
  category: z.string().nullable(),
  sector: z.string().nullable(),
  format: z.string().nullable(),
  title: z.string().nullable(),
  language: z.string().nullable(),
});

export type LabelAd = z.infer<typeof LabelAdSchema>;

export const LabelSpotOutsideBreakSchema = z.object({
  label_id: z.number().optional(),
  brand: z.string().min(1, "Brand is required").nullable(),
  product: z.string().nullable(),
  category: z.string().nullable(),
  sector: z.string().nullable(),
  format: z.string().nullable(),
  title: z.string().nullable(),
  language: z.string().nullable(),
});

export type LabelSpotOutsideBreak = z.infer<typeof LabelSpotOutsideBreakSchema>;

export const LabelPromoSchema = z.object({
  label_id: z.number().optional(),
  program_name: z.string().nullable(),
  movie_name: z.string().nullable(),
  event_name: z.string().nullable(),
});

export type LabelPromo = z.infer<typeof LabelPromoSchema>;

export const LabelNoVideoSchema = z.object({
  label_id: z.number().optional(),
  disruption_type: z.string().min(1, "Disruption type is required"),
  reason: z.string().nullable(),
  description: z.string().nullable(),
});

export type LabelNoVideo = z.infer<typeof LabelNoVideoSchema>;

export const LabelStandBySchema = z.object({
  label_id: z.number().optional(),
  standby_type: z.string().min(1, "Standby type is required"),
  reason: z.string().nullable(),
  description: z.string().nullable(),
});

export type LabelStandBy = z.infer<typeof LabelStandBySchema>;

export const LabelProgramSchema = z.object({
  label_id: z.number().optional(),
  program_name: z.string().min(1, "Program name is required"),
  genre: z.string().nullable(),
  episode_number: z.number().int().positive(),
  season_number: z.number().int().positive(),
  language: z.string().nullable(),
});

export type LabelProgram = z.infer<typeof LabelProgramSchema>;

export const LabelMovieSchema = z.object({
  label_id: z.number().optional(),
  movie_name: z.string().min(1, "Movie name is required"),
  genre: z.string().nullable(),
  director: z.string().nullable(),
  release_year: z.number().int().positive().nullable(),
  language: z.string().nullable(),
  duration: z.number().int().positive().nullable(),
  rating: z.number().int().positive(),
});

export type LabelMovie = z.infer<typeof LabelMovieSchema>;

export const LabelSportsSchema = z.object({
  label_id: z.number().optional(),
  program_title: z.string().min(1, "Program title is required"),
  sport_type: z.string().min(1, "Sport type is required"),
  program_category: z.string().min(1, "Program category is required"),
  language: z.string().nullable(),
  live : z.boolean().default(false),
});

export type LabelSports = z.infer<typeof LabelSportsSchema>;

export const LabelNewsSchema = z.object({
  label_id: z.number().optional(),
  news_segment: z.string().min(1, "News segment is required"),
  category: z.string().nullable(),
  anchor: z.string().nullable(),
  language: z.string().nullable(),
  duration: z.number().int().positive().nullable(),
});

export type LabelNews = z.infer<typeof LabelNewsSchema>;

export const LabelSchema = z.object({
  id: z.number(),
  event_ids: z.array(z.string()),
  label_type: z.enum([
    "song",
    "ad",
    "program",
    "movie",
    "promo",
    "sports",
    "spotOutsideBreak",
    "news",
    "noVideo",
    "standBy",
  ]),
  created_by: z.string(),
  created_at: z.date(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().nullable(),
  image_paths: z.array(z.string().nullable()),
  song: LabelSongSchema.nullable(),
  ad: LabelAdSchema.nullable(),
  program: LabelProgramSchema.nullable(),
  movie: LabelMovieSchema.nullable(),
  promo: LabelPromoSchema.nullable(),
  sports: LabelSportsSchema.nullable(),
  spotOutsideBreak: LabelSpotOutsideBreakSchema.nullable(),
  news: LabelNewsSchema.nullable(),
  noVideo: LabelNoVideoSchema.nullable(),
  standBy: LabelStandBySchema.nullable(),
});

export type Label = z.infer<typeof LabelSchema>;

export const CreateLabelSchema = z
  .object({
    event_ids: z.array(z.string()).min(1, "At least one event ID is required"),
    label_type: z.enum([
      "song",
      "ad",
      "program",
      "movie",
      "promo",
      "sports",
      "spotOutsideBreak",
      "news",
      "noVideo",
      "standBy",
    ]),
    notes: z.string().nullable().optional(), // Added .optional() for consistency
    song: LabelSongSchema.nullable().optional(),
    ad: LabelAdSchema.nullable().optional(),
    program: LabelProgramSchema.nullable().optional(),
    movie: LabelMovieSchema.nullable().optional(),
    promo: LabelPromoSchema.nullable().optional(),
    sports: LabelSportsSchema.nullable().optional(),
    spotOutsideBreak: LabelSpotOutsideBreakSchema.nullable().optional(),
    news: LabelNewsSchema.nullable().optional(),
    noVideo: LabelNoVideoSchema.nullable().optional(),
    standBy: LabelStandBySchema.nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.label_type === "song" && !data.song) return false;
      if (data.label_type === "ad" && !data.ad) return false;
      if (data.label_type === "program" && !data.program) return false;
      if (data.label_type === "movie" && !data.movie) return false;
      if (data.label_type === "promo" && !data.promo) return false;
      if (data.label_type === "sports" && !data.sports) return false;
      if (data.label_type === "spotOutsideBreak" && !data.spotOutsideBreak)
        return false;
      if (data.label_type === "news" && !data.news) return false;
      if (data.label_type === "noVideo" && !data.noVideo) return false;
      if (data.label_type === "standBy" && !data.standBy) return false;

      if (
        data.label_type === "song" &&
        (data.ad ||
          data.program ||
          data.movie ||
          data.promo ||
          data.sports ||
          data.spotOutsideBreak ||
          data.news ||
          data.noVideo ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "ad" &&
        (data.song ||
          data.program ||
          data.movie ||
          data.promo ||
          data.sports ||
          data.spotOutsideBreak ||
          data.news ||
          data.noVideo ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "program" &&
        (data.song ||
          data.ad ||
          data.movie ||
          data.promo ||
          data.sports ||
          data.spotOutsideBreak ||
          data.news ||
          data.noVideo ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "movie" &&
        (data.song ||
          data.ad ||
          data.program ||
          data.promo ||
          data.sports ||
          data.spotOutsideBreak ||
          data.news ||
          data.noVideo ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "promo" &&
        (data.song ||
          data.ad ||
          data.program ||
          data.movie ||
          data.sports ||
          data.spotOutsideBreak ||
          data.news ||
          data.noVideo ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "sports" &&
        (data.song ||
          data.ad ||
          data.program ||
          data.movie ||
          data.promo ||
          data.spotOutsideBreak ||
          data.news ||
          data.noVideo ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "spotOutsideBreak" &&
        (data.song ||
          data.ad ||
          data.program ||
          data.movie ||
          data.promo ||
          data.sports ||
          data.news ||
          data.noVideo ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "news" &&
        (data.song ||
          data.ad ||
          data.program ||
          data.movie ||
          data.promo ||
          data.sports ||
          data.spotOutsideBreak ||
          data.noVideo ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "noVideo" &&
        (data.song ||
          data.ad ||
          data.program ||
          data.movie ||
          data.promo ||
          data.sports ||
          data.spotOutsideBreak ||
          data.news ||
          data.standBy)
      )
        return false;
      if (
        data.label_type === "standBy" &&
        (data.song ||
          data.ad ||
          data.program ||
          data.movie ||
          data.promo ||
          data.sports ||
          data.spotOutsideBreak ||
          data.news ||
          data.noVideo)
      )
        return false;
      return true;
    },
    {
      message:
        "Corresponding label details are required, and only one label type should be provided",
      path: ["label_type"],
    }
  );
export type CreateLabel = z.infer<typeof CreateLabelSchema>;

export const UpdateLabelSchema = CreateLabelSchema.partial().refine(
  (data) => {
    if (data.label_type) {
      // If label_type is provided in update, apply the same checks as create
      return CreateLabelSchema.safeParse({
        ...data,
        event_ids: data.event_ids || [],
        notes: data.notes || null,
      }).success;
    }
    return true;
  },
  {
    message: "Invalid update data for label type",
    path: ["label_type"],
  }
);

export type UpdateLabel = z.infer<typeof UpdateLabelSchema>;

export interface GetUnlabeledEventsOptions {
  page: number;
  limit: number;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  deviceId?: string | undefined;
  types?: number[] | undefined;
  sort?: "asc" | "desc";
}

export interface GetLabelsOptions {
  page: number;
  limit: number;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  createdBy?: string | undefined;
  labelType?: string | undefined;
  deviceId?: string | undefined;
  sort?: "asc" | "desc";
}

export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface LabelResponse extends BaseResponse {
  data: {
    label: Label;
  };
}

export interface LabelsListResponse extends BaseResponse {
  data: {
    events?: any[];
    labels?: Label[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export const ProgramGuideLabelSchema = z.object({
  id: z.number(),
  label_type: z.enum([
    "song",
    "ad",
    "program",
    "movie",
    "promo",
    "sports",
    "spotOutsideBreak",
    "news",
    "noVideo",
    "standBy",
  ]),
  created_by: z.string(),
  created_at: z.date(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().nullable(),
  device_id: z.string().nullable(),
  image_paths: z.array(z.string().nullable()),
  song: LabelSongSchema.nullable(),
  ad: LabelAdSchema.nullable(),
  program: LabelProgramSchema.nullable(),
  movie: LabelMovieSchema.nullable(),
  promo: LabelPromoSchema.nullable(),
  sports: LabelSportsSchema.nullable(),
  spotOutsideBreak: LabelSpotOutsideBreakSchema.nullable(),
  news: LabelNewsSchema.nullable(),
  noVideo: LabelNoVideoSchema.nullable(),
  standBy: LabelStandBySchema.nullable(),
});

export type ProgramGuideLabel = z.infer<typeof ProgramGuideLabelSchema>;

export interface ProgramGuideResponse extends BaseResponse {
  data: {
    date: string;
    labels: ProgramGuideLabel[];
  };
}
