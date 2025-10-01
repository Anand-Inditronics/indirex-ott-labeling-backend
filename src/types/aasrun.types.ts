import zod from "zod";

// -------------------------
// Zod Schemas
// -------------------------

// Schema for existing AsRun
export const AsRunSchema = zod.object({
  id: zod.number().int().nonnegative(),
  uploaded_by: zod.string(),
  uploaded_at: zod.date(),
  channel_name: zod.string(),
  date: zod.date(),
  file_url: zod.string().url(),
});

// Schema for creating new AsRun
export const CreateAsRunSchema = zod.object({
  uploaded_by: zod.string(),
  uploaded_at: zod.date(),
  channel_name: zod.string(),
  date: zod.date(),
  file_url: zod.string().url(),
});



// Schema for deleting one or multiple AsRun(s)
export const DeleteAsRunSchema = zod.object({
  ids: zod.array(zod.number().int().nonnegative()).min(1),
});

// -------------------------
// TypeScript Types
// -------------------------

export type AsRun = zod.infer<typeof AsRunSchema>;
export type CreateAsRun = zod.infer<typeof CreateAsRunSchema>;
export type DeleteAsRun = zod.infer<typeof DeleteAsRunSchema>;

// -------------------------
// API Response Types
// -------------------------

// Paginated result
export interface GetAsRunResult {
  asRuns: AsRun[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Single response
export interface AsRunResponse extends BaseResponse {
  data: {
    asRun: AsRun;
  };
}

// List response
export interface AsRunListResponse extends BaseResponse {
  data: GetAsRunResult;
}

// Delete response (single or multiple)
export interface DeleteAsRunResponse extends BaseResponse {
  data?: {
    deletedIds: number[];
  };
}

export interface BaseResponse {
  success: boolean;
  message: string;
}