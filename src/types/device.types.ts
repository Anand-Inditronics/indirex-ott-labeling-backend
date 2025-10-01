import {z} from 'zod';

// Device Schemas and Types
export const DeviceSchema = z.object({
    device_id:z.string().min(1),
    is_active:z.boolean().default(true)
});


export type Device = z.infer<typeof DeviceSchema>;

// Create Device Schemas and Types
export const CreateDeviceSchema = z.object({
    device_id:z.string().min(1,"Device ID is required"),
    is_active:z.boolean().optional()
});

export type CreateDevice = z.infer<typeof CreateDeviceSchema>;

// Update Device Schemas and Types
export const UpdateDeviceSchema = z.object({
    device_id:z.string().min(1,"Device ID is required"),
    is_active:z.boolean().optional()
});

export type UpdateDevice = z.infer<typeof UpdateDeviceSchema>;

// Get Device Result Interface
export interface GetDeviceResult {
    devices:Device[];
    total:number;
    totalPages:number;
    currentPage:number;
}

// Device Response Interfaces
export interface DeviceResponse extends BaseResponse{
    data:{
        device:Device;
    };
};

// Device List Response Interface
export interface DeviceListResponse extends BaseResponse{
   data:GetDeviceResult;
};

// Delete Device Response Interface
export interface DeleteDeviceResponse extends BaseResponse{
    data?:never;
};

// Base Response Interface
export interface BaseResponse {
    success: boolean;
    message: string;
}
