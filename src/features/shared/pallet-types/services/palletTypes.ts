import axiosInstance from '@/config/axios';
import type { PalletType } from '../types/palletType';

const logError = (operation: string, error: any) => {
    console.error(`Error in ${operation}:`, error);
};

interface PaginationParams {
    page?: number;
    per_page?: number;
}

export const fetchPalletTypes = async (params: PaginationParams = {}) => {
    const response = await axiosInstance.get('/v1/pallet-types', {
        params: {
            page: params.page || 0,
            per_page: params.per_page || 10
        }
    });
    return response.data;
};

export const fetchPalletTypeById = async (id: number) => {
    const response = await axiosInstance.get(`/v1/pallet-types/${id}`);
    return response.data;
};

export const insertPalletType = async (data: Partial<PalletType>) => {
    const response = await axiosInstance.post('/v1/pallet-types', data);
    return response.data;
};

export const updatePalletType = async (id: number, data: Partial<PalletType>) => {
    const response = await axiosInstance.put(`/v1/pallet-types/${id}`, data);
    return response.data;
};

export const deletePalletType = async (id: number) => {
    const response = await axiosInstance.delete(`/v1/pallet-types/${id}`);
    return response.data;
};

export const fetchPalletTypesDropdown = async () => {
    try {
        const response = await axiosInstance.get('/v1/pallet-types/dropdown');
        return response.data;
    } catch (error) {
        logError('fetchPalletTypesDropdown', error);
        throw error;
    }
}; 