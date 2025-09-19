import { create } from 'zustand';
import { notifications } from '@mantine/notifications';
import { fetchMaterials, insertMaterial, updateMaterial, deleteMaterial, fetchMaterialById, fetchMaterialsList, fetchMaterialPackHierarchies, insertMaterialPackHierarchy, deleteMaterialPackHierarchy } from '../services/materials';
import type { Material, MaterialPackHierarchyItem } from '../types/material';

interface MaterialState {
    materials: Material[];
    loading: boolean;
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    packHierarchies: MaterialPackHierarchyItem[];
    fetchPackHierarchies: (materialId: string) => Promise<void>;
    addPackHierarchy: (payload: Omit<MaterialPackHierarchyItem, 'id' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'>) => Promise<void>;
    removePackHierarchy: (id: string) => Promise<void>;
    fetchMaterials: () => Promise<void>;
    fetchMaterialsList: (params?: { page?: number; per_page?: number; search?: string }) => Promise<void>;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchMaterialById: (materialId: string) => Promise<Material>;
    addMaterial: (materialData: Partial<Material>) => Promise<Material>;
    editMaterial: (materialId: string, updatedData: Partial<Material>) => Promise<void>;
    removeMaterial: (materialId: string) => Promise<void>;
}

export const useMaterialStore = create<MaterialState>((set, get) => ({
    materials: [],
    loading: false,
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
    packHierarchies: [],

    setPage: (page: number) => {
        set({ page });
        get().fetchMaterialsList();
    },

    setPerPage: (perPage: number) => {
        set({ per_page: perPage, page: 1 });
        get().fetchMaterialsList();
    },

    fetchMaterials: async () => {
        set({ loading: true });
        try {
            const response = await fetchMaterials({ page: get().page, per_page: get().per_page });
            set({ 
                materials: response.data,
                page: response.page,
                per_page: response.per_page,
                total: response.total,
                total_pages: response.total_pages
            });
        } catch (error) {
            console.error('Failed to fetch materials', error);
            notifications.show({
                title: 'Hata!',
                message: 'Ürün listesi yüklenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
        } finally {
            set({ loading: false });
        }
    },

    fetchPackHierarchies: async (materialId) => {
        set({ loading: true });
        try {
            const list = await fetchMaterialPackHierarchies(materialId);
            set({ packHierarchies: list });
        } catch (error) {
            console.error('Failed to fetch pack hierarchies', error);
            notifications.show({ title: 'Hata!', message: 'Paket hiyerarşisi yüklenemedi.', color: 'red', autoClose: 5000 });
        } finally {
            set({ loading: false });
        }
    },

    addPackHierarchy: async (payload) => {
        try {
            const created = await insertMaterialPackHierarchy(payload);
            set({ packHierarchies: [...get().packHierarchies, created] });
        } catch (error) {
            console.error('Failed to add pack hierarchy', error);
            notifications.show({ title: 'Hata!', message: 'Paket hiyerarşisi eklenemedi.', color: 'red', autoClose: 5000 });
            throw error;
        }
    },

    removePackHierarchy: async (id) => {
        try {
            await deleteMaterialPackHierarchy(id);
            set({ packHierarchies: get().packHierarchies.filter(h => h.id !== id) });
        } catch (error) {
            console.error('Failed to delete pack hierarchy', error);
            notifications.show({ title: 'Hata!', message: 'Paket hiyerarşisi silinemedi.', color: 'red', autoClose: 5000 });
        }
    },

    fetchMaterialsList: async (params) => {
        set({ loading: true });
        try {
            const response = await fetchMaterialsList({ page: params?.page ?? get().page, per_page: params?.per_page ?? get().per_page, search: params?.search });
            set({ 
                materials: response.data,
                page: response.page,
                per_page: response.per_page,
                total: response.total,
                total_pages: response.total_pages
            });
        } catch (error) {
            console.error('Failed to fetch materials', error);
            notifications.show({
                title: 'Hata!',
                message: 'Ürün listesi yüklenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
        } finally {
            set({ loading: false });
        }
    },

    fetchMaterialById: async (materialId) => {
        try {
            const response = await fetchMaterialById(materialId);
            return response;
        } catch (error) {
            console.error('Failed to fetch material by id', error);
            notifications.show({
                title: 'Hata!',
                message: 'Ürün yüklenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
            throw error;
        }
    },

    addMaterial: async (materialData) => {
        try {
            const created = await insertMaterial(materialData);
            // Refresh list in background; consumer can use returned entity immediately
            await get().fetchMaterials();
            return created;
        } catch (error) {
            console.error('Failed to add material', error);
            throw error;
        }
    },

    editMaterial: async (materialId, updatedData) => {
        try {
            await updateMaterial(materialId, updatedData);
            await get().fetchMaterials();
        } catch (error) {
            notifications.show({
                title: 'Hata!',
                message: 'Ürün güncellenirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
            throw error;
        }
    },

    removeMaterial: async (materialId) => {
        try {
            await deleteMaterial(materialId);
            await get().fetchMaterials();
        } catch (error) {
            console.error('Failed to delete material', error);
            notifications.show({
                title: 'Hata!',
                message: 'Ürün silinirken bir hata oluştu.',
                color: 'red',
                autoClose: 5000,
            });
        }
    }
}));


