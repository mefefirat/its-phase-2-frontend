import axiosInstance from '@/config/axios';
import type { Province } from '../types/province';

interface ProvincesResponse {
    data: Province[];
    total: number;
    page: number;
}

export const fetchProvinces = async (countryCode: number) => {
    const response = await axiosInstance.get<ProvincesResponse>(`/v1/provinces/country/${countryCode}`);
    return response.data;
};

export const fetchProvinceById = async (provinceId: string) => {
    const response = await axiosInstance.get<Province>(`/v1/provinces/${provinceId}`);
    return response.data;
}; 