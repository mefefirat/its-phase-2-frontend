import axiosInstance from '@/config/axios';
import type { BarcodeRequest, BarcodeResponse } from '../types/printer';

export const printBarcode = async (data: BarcodeRequest): Promise<BarcodeResponse> => {
    const response = await axiosInstance.post('/v1/printer/barcode', data);
    return response.data;
}; 