import { create } from 'zustand';
import React from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { fetchQrcodesItems, insertQrcodesItem, updateQrcodesItem, deleteQrcodesItem, fetchQrcodesItemById, fetchQrcodesItemsList, fetchQrcodesItemsDropdown, fetchCurrentOrderNumber, fetchCurrentSerialNumber, completeQrcodesItem } from '../services/qrcodes';
import type { Qrcodes } from '../types/qrcodes';
import type { PaginatedResponse } from '@/utils/responseHelper';
import { extractErrorMessage, getUserFriendlyErrorMessage, isBusinessError } from '@/utils/errorHandler';

interface QrcodesState {
    items: Qrcodes[];
    dropdownItems: Qrcodes[];
    currentOrderNumber: number | null;
    currentSerialNumber: number | null;
    loading: boolean;
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    fetchItems: () => Promise<void>;
    fetchItemsList: (status?: string) => Promise<void>;
    setPage: (page: number, status?: string) => void;
    setPerPage: (perPage: number, status?: string) => void;
    fetchItemsDropdown: () => Promise<void>;
    fetchCurrentOrder: () => Promise<void>;
    fetchCurrentSerial: () => Promise<void>;
    fetchItemById: (itemId: string) => Promise<Qrcodes>;
    addItem: (itemData: Partial<Qrcodes>) => Promise<void>;
    editItem: (itemId: string, updatedData: Partial<Qrcodes>) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    completeItem: (itemId: string) => Promise<void>;
}

export const useQrcodesStore = create<QrcodesState>((set, get) => ({
    items: [],
    dropdownItems: [],
    currentOrderNumber: null,
    currentSerialNumber: null,
    loading: false,
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,

    setPage: (page: number, status?: string) => {
        set({ page });
        get().fetchItemsList(status);
    },

    setPerPage: (perPage: number, status?: string) => {
        set({ per_page: perPage, page: 1 });
        get().fetchItemsList(status);
    },

    // READ OPERATIONS - Liste yüklenirken hata kritik değil, empty state göster
    fetchItems: async () => {
        set({ loading: true });
        try {
            const response = await fetchQrcodesItems();
            const items = response.data;

            set({ 
                items: items,
                page: response.page,
                per_page: response.per_page,
                total: response.total,
                total_pages: response.total_pages
            });
        } catch (error) {
            console.error('Failed to fetch qrcodes items', error);
            // Liste yüklenirken hata - kullanıcıya bildir ama throw etme
            notifications.show({
                title: 'Hata!',
                message: 'Qrcodes listesi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            // Boş liste set et
            set({ items: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchItemsList: async (status?: string) => {
        set({ loading: true });
        try {
            const response = await fetchQrcodesItemsList({
                page: get().page,
                per_page: get().per_page,
                status: status,
            });

            set({ 
                items: response.data,
                page: response.page,
                per_page: response.per_page,
                total: response.total,
                total_pages: response.total_pages
            });
        } catch (error) {
            console.error('Failed to fetch qrcodes items', error);
            
            notifications.show({
                title: 'Hata!',
                message: 'Qrcodes listesi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });

            // Boş liste set et
            set({ items: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchItemsDropdown: async () => {
        set({ loading: true });
        try {
            const response = await fetchQrcodesItemsDropdown();
            set({ dropdownItems: response.data });
        } catch (error) {
            console.error('Failed to fetch qrcodes items for dropdown', error);
            notifications.show({
                title: 'Hata!',
                message: 'Dropdown için Qrcodes öğeleri yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            // Boş dropdown set et
            set({ dropdownItems: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchCurrentOrder: async () => {
        try {
            const response = await fetchCurrentOrderNumber();
            set({ currentOrderNumber: response.current_order_number });
        } catch (error) {
            console.error('Failed to fetch current order number', error);
            // Null set et ve hatayı fırlat (UI'da modal gösterilecek)
            set({ currentOrderNumber: null });
            throw error; // UI'ya fırlat - kritik hata
        }
    },

    fetchCurrentSerial: async () => {
        try {
            const response = await fetchCurrentSerialNumber();
            set({ currentSerialNumber: response.current_serial_number });
        } catch (error) {
            console.error('Failed to fetch current serial number', error);
            // Null set et ve hatayı fırlat (UI'da modal gösterilecek)
            set({ currentSerialNumber: null });
            throw error; // UI'ya fırlat - kritik hata
        }
    },

    // SINGLE READ - Bu hata kritik, throw et
    fetchItemById: async (itemId) => {
        try {
            const response = await fetchQrcodesItemById(itemId);
            return response;
        } catch (error) {
            console.error('Failed to fetch qrcodes item by id', error);
            const errorMessage = extractErrorMessage(error);
            
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Qrcodes öğesi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error; // UI'ya fırlat - kritik hata
        }
    },

    // WRITE OPERATIONS - Business logic errors handle et
    addItem: async (itemData) => {
        try {
            await insertQrcodesItem(itemData);
            await get().fetchItemsList(); // Listeyi yenile
            
            // Başarı notification'ı store seviyesinde göster
            notifications.show({
                title: 'Başarılı',
                message: 'Qrcodes öğesi başarıyla eklendi',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Failed to add qrcodes item', error);
            
            // Business logic errors handle et
            if (isBusinessError(error, 'duplicate')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu GTIN ve LOT kombinasyonu zaten mevcut',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else if (isBusinessError(error, 'validation')) {
                notifications.show({
                    title: 'Doğrulama Hatası',
                    message: extractErrorMessage(error),
                    color: 'yellow',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else {
                notifications.show({
                    title: 'Hata',
                    message: getUserFriendlyErrorMessage(error, 'create'),
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }
            
            throw error; // UI'ya fırlat
        }
    },

    editItem: async (itemId, updatedData) => {
        try {
            await updateQrcodesItem(itemId, updatedData);
            await get().fetchItemsList(); // Listeyi yenile
            
            // Başarı notification'ı store seviyesinde göster
            notifications.show({
                title: 'Başarılı',
                message: 'Qrcodes öğesi başarıyla güncellendi',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Failed to update qrcodes item', error);
            const errorMessage = extractErrorMessage(error);
            
            // Business logic errors handle et
            if (errorMessage.includes('duplicate') || 
                errorMessage.includes('already exists') || 
                errorMessage.includes('unique')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu GTIN ve LOT kombinasyonu zaten mevcut',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
                notifications.show({
                    title: 'Doğrulama Hatası',
                    message: errorMessage,
                    color: 'yellow',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else {
                notifications.show({
                    title: 'Hata!',
                    message: 'Qrcodes öğesi güncellenirken bir hata oluştu.',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }
            
            throw error; // UI'ya fırlat
        }
    },

    removeItem: async (itemId) => {
        try {
            await deleteQrcodesItem(itemId);
            await get().fetchItemsList(); // Listeyi yenile
            
            // Başarı notification'ı store seviyesinde göster
            notifications.show({
                title: 'Başarılı',
                message: 'Qrcodes öğesi başarıyla silindi',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Failed to delete qrcodes item', error);
            const errorMessage = extractErrorMessage(error);
            
            // Business logic errors handle et
            if (errorMessage.includes('constraint') || 
                errorMessage.includes('foreign key') || 
                errorMessage.includes('reference')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu Qrcodes öğesi başka kayıtlarda kullanıldığı için silinemez',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else {
                notifications.show({
                    title: 'Hata!',
                    message: 'Qrcodes öğesi silinirken bir hata oluştu.',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }
            
            throw error; // UI'ya fırlat
        }
    },

    completeItem: async (itemId) => {
        try {
            await completeQrcodesItem(itemId);
            await get().fetchItemsList(); // Listeyi yenile
            
            // Başarı notification'ı store seviyesinde göster
            notifications.show({
                title: 'Başarılı',
                message: 'Qrcodes öğesi başarıyla tamamlandı',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Failed to complete qrcodes item', error);
            const errorMessage = extractErrorMessage(error);
            
            // Business logic errors handle et
            if (errorMessage.includes('already completed') || 
                errorMessage.includes('invalid status')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu Qrcodes öğesi zaten tamamlanmış veya tamamlanamaz durumda',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else if (errorMessage.includes('not found')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Qrcodes öğesi bulunamadı',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else {
                notifications.show({
                    title: 'Hata!',
                    message: 'Qrcodes öğesi tamamlanırken bir hata oluştu.',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }
            
            throw error; // UI'ya fırlat
        }
    }
}));
