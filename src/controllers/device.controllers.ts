import {Request,Response} from 'express';
import { DeviceService } from '../services/device.services';
import {AppError} from '../middleware/erroeHandler';
import { logger } from '../utils/logger';
import { CreateDevice, UpdateDevice,DeleteDeviceResponse,DeviceListResponse,DeviceResponse } from '../types/device.types';
import { log } from 'console';

export class DeviceController{
    static async registerDevice(req:Request,res:Response<DeviceResponse>){
        const deviceData:CreateDevice = req.body;

        const device = await DeviceService.registerDevice(deviceData);

        res.status(201).json({
            success:true,
            message:"Device registered successfully",
            data:{device}
        });
    }

    static async updateDevice(req:Request,res:Response<DeviceResponse>){
        console.log("kadsfkdsfmdksd sdfjsnfjklsndfknklsfnsad")
        if(req.user?.role !== 'ADMIN'){
            throw new AppError("Unauthorized",403);
        }
        const device_id = req.params.device_id;
        console.log("Updating device with ID:", req.params);
        if(!device_id){
            throw new AppError("Device ID is required",400);
        }

        const deviceData:UpdateDevice = req.body;
        console.log("gand",deviceData)
        const updatedDevice = await DeviceService.updateDevice(device_id, deviceData);

        res.status(200).json({
            success:true,
            message:"Device updated successfully",
            data:{device:updatedDevice}
        });
    }

    static async deleteDevice(req:Request,res:Response<DeleteDeviceResponse>){
        console.log("kadsfkdsfmdksd sdfjsnfjklsndfknklsfnsad");
        if(req.user?.role !== 'ADMIN'){
            throw new AppError("Unauthorized",403);
        }

        const device_id = req.params.device_id;
        console.log("Deleting device with ID:", req.params);
        
        if(!device_id){
            throw new AppError("Device ID is required",400);
        }

        await DeviceService.deleteDevice(device_id);
        console.log("Device deleted successfully");

        res.status(204).json({
            success:true,
            message:"Device deleted successfully"
        });
    }

    static async getDevices(req:Request,res:Response<DeviceListResponse>){
        if(req.user?.role !== 'ADMIN'){
            throw new AppError("Unauthorized",403);
        }
        const page = req.query.page ? parseInt(req.query.page as string,10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string,10) : 10;
        const is_active = req.query.is_active ? req.query.is_active === 'true' : undefined;

        const result = await DeviceService.getAllDevices({page,limit,is_active});

        res.status(200).json({
            success:true,
            message:"Devices retrieved successfully",
            data:result
        });
    }

    static async getDeviceById(req:Request,res:Response<DeviceResponse>){
        if(req.user?.role !== 'ADMIN'){
            throw new AppError("Unauthorized",403);
        }

        if(!req.params.device_id){
            throw new AppError("Device ID is required",400);
        }
        const device = await DeviceService.getDeviceById(req.params.device_id);

        res.status(200).json({
            success:true,
            message:"Device retrieved successfully",
            data:{device}
        });
    }
}