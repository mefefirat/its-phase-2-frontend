import { create } from 'zustand';
import React from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { fetchCompanies, insertCompany, updateCompany, deleteCompany, fetchCompanyById, fetchCompaniesList, fetchCompaniesDropdown } from '../services/companies';
import type { Company } from '../types/company';
import type { PaginatedResponse } from '@/utils/responseHelper';
import { extractErrorMessage, getUserFriendlyErrorMessage, isBusinessError } from '@/utils/errorHandler';

interface CompanyState {
    companies: Company[];
    dropdownCompanies: Company[];
    loading: boolean;
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    fetchCompanies: () => Promise<void>;
    fetchCompaniesList: () => Promise<void>;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchCompaniesDropdown: () => Promise<void>;
    fetchCompanyById: (companyId: string) => Promise<Company>;
    addCompany: (companyData: Partial<Company>) => Promise<void>;
    editCompany: (companyId: string, updatedData: Partial<Company>) => Promise<void>;
    removeCompany: (companyId: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
    companies: [],
    dropdownCompanies: [],
    loading: false,
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,

    setPage: (page: number) => {
        set({ page });
        get().fetchCompaniesList();
    },

    setPerPage: (perPage: number) => {
        set({ per_page: perPage, page: 1 });
        get().fetchCompaniesList();
    },

    // READ OPERATIONS - Liste yüklenirken hata kritik değil, empty state göster
    fetchCompanies: async () => {
        set({ loading: true });
        try {
            const response = await fetchCompanies();
            const companies = response.data;

            set({ 
                companies: companies,
                page: response.page,
                per_page: response.per_page,
                total: response.total,
                total_pages: response.total_pages
            });
        } catch (error) {
            console.error('Failed to fetch companies', error);
            // Liste yüklenirken hata - kullanıcıya bildir ama throw etme
            notifications.show({
                title: 'Hata!',
                message: 'Firma listesi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            // Boş liste set et
            set({ companies: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchCompaniesList: async () => {
        set({ loading: true });
        try {
            const response = await fetchCompaniesList({
                page: get().page,
                per_page: get().per_page,
            });

            set({ 
                companies: response.data,
                page: response.page,
                per_page: response.per_page,
                total: response.total,
                total_pages: response.total_pages
            });
        } catch (error) {
            console.error('Failed to fetch companies', error);
            
            notifications.show({
                title: 'Hata!',
                message: 'Firma listesi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });

            // Boş liste set et
            set({ companies: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchCompaniesDropdown: async () => {
        set({ loading: true });
        try {
            const response = await fetchCompaniesDropdown();
            set({ dropdownCompanies: response.data });
        } catch (error) {
            console.error('Failed to fetch companies for dropdown', error);
            notifications.show({
                title: 'Hata!',
                message: 'Dropdown için firmalar yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            // Boş dropdown set et
            set({ dropdownCompanies: [] });
        } finally {
            set({ loading: false });
        }
    },

    // SINGLE READ - Bu hata kritik, throw et
    fetchCompanyById: async (companyId) => {
        try {
            const response = await fetchCompanyById(companyId);
            return response;
        } catch (error) {
            console.error('Failed to fetch company by id', error);
            const errorMessage = extractErrorMessage(error);
            
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Firma yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error; // UI'ya fırlat - kritik hata
        }
    },

    // WRITE OPERATIONS - Business logic errors handle et
    addCompany: async (companyData) => {
        try {
            await insertCompany(companyData);
            await get().fetchCompaniesList(); // Listeyi yenile
            
            // Başarı notification'ı store seviyesinde göster
            notifications.show({
                title: 'Başarılı',
                message: 'Firma başarıyla eklendi',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Failed to add company', error);
            
            // Business logic errors handle et
            if (isBusinessError(error, 'duplicate')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu firma kodu zaten mevcut',
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

    editCompany: async (companyId, updatedData) => {
        try {
            await updateCompany(companyId, updatedData);
            await get().fetchCompaniesList(); // Listeyi yenile
            
            // Başarı notification'ı store seviyesinde göster
            notifications.show({
                title: 'Başarılı',
                message: 'Firma başarıyla güncellendi',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Failed to update company', error);
            const errorMessage = extractErrorMessage(error);
            
            // Business logic errors handle et
            if (errorMessage.includes('duplicate') || 
                errorMessage.includes('already exists') || 
                errorMessage.includes('unique')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu firma kodu zaten mevcut',
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
                    message: 'Firma güncellenirken bir hata oluştu.',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }
            
            throw error; // UI'ya fırlat
        }
    },

    removeCompany: async (companyId) => {
        try {
            await deleteCompany(companyId);
            await get().fetchCompaniesList(); // Listeyi yenile
            
            // Başarı notification'ı store seviyesinde göster
            notifications.show({
                title: 'Başarılı',
                message: 'Firma başarıyla silindi',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Failed to delete company', error);
            const errorMessage = extractErrorMessage(error);
            
            // Business logic errors handle et
            if (errorMessage.includes('constraint') || 
                errorMessage.includes('foreign key') || 
                errorMessage.includes('reference')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu firma başka kayıtlarda kullanıldığı için silinemez',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else {
                notifications.show({
                    title: 'Hata!',
                    message: 'Firma silinirken bir hata oluştu.',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }
            
            throw error; // UI'ya fırlat
        }
    }
}));