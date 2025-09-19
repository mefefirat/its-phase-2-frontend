import { create } from 'zustand';
import { notifications } from '@mantine/notifications';
import { 
    fetchPalletTypes,
    insertPalletType,
    updatePalletType,
    deletePalletType,
    fetchPalletTypeById,
    fetchPalletTypesDropdown
} from '../services/palletTypes';
import type { PalletType } from '../types/palletType';

interface PalletTypeState {
    palletTypes: PalletType[];
    palletTypesDropdown: PalletType[];
    loading: boolean;
    totalPages: number;
    currentPage: number;
    perPage: number;
    fetchPalletTypes: (page?: number) => Promise<void>;
    fetchPalletTypesDropdown: () => Promise<void>;
    fetchPalletTypeById: (id: number) => Promise<PalletType>;
    insertPalletType: (data: Partial<PalletType>) => Promise<void>;
    updatePalletType: (id: number, data: Partial<PalletType>) => Promise<void>;
    deletePalletType: (id: number) => Promise<void>;
    setPage: (page: number) => void;
}

export const usePalletTypeStore = create<PalletTypeState>((set, get) => ({
    palletTypes: [],
    palletTypesDropdown: [],
    loading: false,
    totalPages: 1,
    currentPage: 0,
    perPage: 10,

    setPage: (page: number) => {
        set({ currentPage: page });
        get().fetchPalletTypes(page);
    },

    fetchPalletTypes: async (page?: number) => {
        set({ loading: true });
        try {
            const currentPage = page ?? get().currentPage;
            const response = await fetchPalletTypes({
                page: currentPage,
                per_page: get().perPage
            });

            const { data: palletTypes, total, page: responsePage } = response;

            set({ 
                palletTypes,
                totalPages: Math.ceil(total / get().perPage) || 1,
                currentPage: responsePage || 0
            });
        } catch (error) {
            console.error('Failed to fetch pallet types', error);
            notifications.show({
                title: 'Hata!',
                message: 'Palet tipleri yüklenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
        } finally {
            set({ loading: false });
        }
    },

    fetchPalletTypeById: async (id) => {
        try {
            const response = await fetchPalletTypeById(id);
            return response;
        } catch (error) {
            console.error('Failed to fetch pallet type by id', error);
            notifications.show({
                title: 'Hata!',
                message: 'Palet tipi yüklenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
        }
    },

    insertPalletType: async (data) => {
        try {
            const newItem = await insertPalletType(data);
            await get().fetchPalletTypes();
            return newItem;
        } catch (error) {
            console.error('Failed to add pallet type', error);
            notifications.show({
                title: 'Hata!',
                message: 'Palet tipi eklenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
            throw error;
        }
    },

    updatePalletType: async (id, data) => {
        try {
            const updatedItem = await updatePalletType(id, data);
            await get().fetchPalletTypes();
            return updatedItem;
        } catch (error) {
            console.error('Failed to update pallet type', error);
            notifications.show({
                title: 'Hata!',
                message: 'Palet tipi güncellenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
        }
    },

    deletePalletType: async (id) => {
        try {
            await deletePalletType(id);
            await get().fetchPalletTypes();
        } catch (error) {
            console.error('Failed to delete pallet type', error);
            notifications.show({
                title: 'Hata!',
                message: 'Palet tipi silinirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
        }
    },

    fetchPalletTypesDropdown: async () => {
        try {
            const response = await fetchPalletTypesDropdown();
            set({ palletTypesDropdown: response.data || [] });
        } catch (error) {
            console.error('Failed to fetch pallet types dropdown', error);
            notifications.show({
                title: 'Hata!',
                message: 'Palet tipleri dropdown yüklenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
            set({ palletTypesDropdown: [] });
        }
    }
})); 