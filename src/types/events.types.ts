import {z} from 'zod';

// Event Schemas and Types
export const EventSchema = z.object({
    device_id:z.string().min(1),
    timestamp:z.string().min(1),
    type:z.number().int().nonnegative(),
    image_path:z.string().optional(),
    max_score:z.number().optional(),
    ads:z.array(z.object({
        id:z.number(),
        event_id:z.string(),
        name:z.string(),
        score:z.number().nullable()
    })),
    channels:z.array(z.object({
        id:z.number(),
        event_id:z.string(),
        name:z.string(),
        score:z.number().nullable()
    })),
    content:z.array(z.object({
        id:z.number(),
        event_id:z.string(),
        name:z.string(),
        score:z.number().nullable()
    }))
});

export type Events = z.infer<typeof EventSchema>;

export interface GetEventOptions{
    page?:number;
    limit?:number;
    startDate?:Date|undefined;
    endDate?:Date|undefined;
    deviceId?:string|undefined;
    types?:number[]|undefined;
    sort:'asc'|'desc'|undefined;
    category?:'ads'|'channels'|'content'|undefined;

}

export interface GetEventResult{
    events:Events[];
    total:number;
    totalPages:number;
    currentPage:number;
}

export interface EventResponse extends BaseResponse{
    data:{
        event:Events;
    }
}

export interface EventsListResponse extends BaseResponse{
    data:GetEventResult;
}

export interface BaseResponse{
    success:boolean;
    message:string;
}