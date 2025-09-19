import { create } from 'zustand';
import { fetchProvinces, fetchProvinceById } from '../services/provinces';
import type { Province } from '../types/province';

interface ProvinceState {
    provinces: Province[];
    loading: boolean;
    fetchProvinces: (countryCode: number) => Promise<void>;
    fetchProvinceById: (provinceId: string) => Promise<Province>;
}

export const useProvinceStore = create<ProvinceState>((set) => ({
    provinces: [],
    loading: false,

    fetchProvinces: async (countryCode: number) => {
        set({ loading: true });
        try {
            const response = await fetchProvinces(countryCode);
            
            set({ provinces: response.data || [] });
        } catch (error) {
            console.error('Failed to fetch provinces', error);
            set({ provinces: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchProvinceById: async (provinceId) => {
        try {
            const response = await fetchProvinceById(provinceId);
            return response;
        } catch (error) {
            console.error('Failed to fetch province by id', error);
            throw error;
        }
    }
})); 