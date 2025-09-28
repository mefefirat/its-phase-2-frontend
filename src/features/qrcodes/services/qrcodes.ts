import axiosInstance from '@/config/axios';
import type { Qrcodes } from '../types/qrcodes';
import type { PaginatedResponse } from '@/utils/responseHelper';

interface PaginationParams {
    page?: number;
    per_page?: number;
}

interface QrcodesParams extends PaginationParams {
    gtin?: string;
    lot?: string;
    order_number?: number;
    search_term?: string;
}

// SERVICE LAYER - SADECE API ÇAĞRILARI
// TRY-CATCH KULLANMA! Hataları üst katmana fırlat

export const fetchQrcodesItems = async (params: QrcodesParams = {}) => {
    const response = await axiosInstance.get('/v1/qrcodes', {
        params: {
            gtin: params.gtin,
            lot: params.lot,
            order_number: params.order_number
        }
    });
    return response.data as PaginatedResponse<Qrcodes>;
};

export const fetchQrcodesItemsList = async (params: QrcodesParams = {}) => {
    let requestParams: any = {};

    if (params.search_term) {
        // Eğer search_term dolu ise, sadece search_term gönder
        requestParams.search_term = params.search_term;
    } else {
        // Eğer search_term boş ise, gtin, lot, order_number gönder
        if (params.gtin) {
            requestParams.gtin = params.gtin;
        }
        if (params.lot) {
            requestParams.lot = params.lot;
        }
        if (params.order_number) {
            requestParams.order_number = params.order_number;
        }
    }
    
    // Pagination params (if provided)
    if (typeof params.page === 'number') {
        requestParams.page = params.page;
    }
    if (typeof params.per_page === 'number') {
        requestParams.per_page = params.per_page;
    }
    
    const response = await axiosInstance.get('/v1/qrcodes', {
        params: requestParams
    });

    // Backend now returns paginated response with data, total, page, etc.
    return response.data as PaginatedResponse<Qrcodes>;
};

export const fetchQrcodesItemById = async (itemId: string): Promise<Qrcodes> => {
    const response = await axiosInstance.get(`/v1/qrcodes/${itemId}`);
    return response.data;
};

export const insertQrcodesItem = async (itemData: Partial<Qrcodes>): Promise<Qrcodes> => {
    const response = await axiosInstance.post('/v1/qrcodes', itemData);
    console.log('✅ Qrcodes item created:', itemData.gtin);
    return response.data;
};

export const updateQrcodesItem = async (itemId: string, updatedData: Partial<Qrcodes>): Promise<Qrcodes> => {
    const response = await axiosInstance.put(`/v1/qrcodes/${itemId}`, updatedData);
    console.log('✅ Qrcodes item updated:', itemId);
    return response.data;
};

export const deleteQrcodesItem = async (itemId: string): Promise<void> => {
    const response = await axiosInstance.delete(`/v1/qrcodes/${itemId}`);
    console.log('✅ Qrcodes item deleted:', itemId);
    return response.data;
};

export const fetchQrcodesItemsDropdown = async () => {
    const response = await axiosInstance.get('/v1/qrcodes/dropdown');
    return response.data;
};

export const fetchCurrentOrderNumber = async () => {
    const response = await axiosInstance.get('/v1/qrcodes/current-order-number');
    return response.data;
};

export const fetchCurrentSerialNumber = async () => {
    const response = await axiosInstance.get('/v1/qrcodes/current-serial-number');
    return response.data;
};


