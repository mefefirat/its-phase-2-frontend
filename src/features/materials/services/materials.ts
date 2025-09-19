import axiosInstance from '@/config/axios';
import type { Material } from '../types/material';
import type { MaterialPackHierarchyItem } from '../types/material';
import type { PaginatedResponse } from '@/utils/responseHelper';
import { useGlobalStore } from '@/store/globalStore';

interface PaginationParams {
    page?: number;
    per_page?: number;
}

interface MaterialParams extends PaginationParams {
    search?: string;
}

const logError = (operation: string, error: any) => {
    console.error(`Material ${operation} failed:`, error.response?.data || error.message);
};

export const fetchMaterials = async (params: MaterialParams = {}) => {
    try {
        const { currentCompany } = useGlobalStore.getState();
        const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
        const response = await axiosInstance.get('/v1/materials', {
            params: {
                page: params.page,
                per_page: params.per_page,
                company_code: companyCode,
            }
        });
        return response.data as PaginatedResponse<Material>;
    } catch (error) {
        logError('fetchMaterials', error);
        throw error;
    }
};

export const fetchMaterialsList = async (params: MaterialParams = {}) => {
    const { currentCompany } = useGlobalStore.getState();
    const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
    const requestParams: any = { company_code: companyCode };
    if (typeof params.page === 'number') requestParams.page = params.page;
    if (typeof params.per_page === 'number') requestParams.per_page = params.per_page;
    if (typeof params.search === 'string' && params.search.trim() !== '') requestParams.search = params.search.trim();

    try {
        const response = await axiosInstance.get('/v1/materials', { params: requestParams });
        return response.data as PaginatedResponse<Material>;
    } catch (error) {
        logError('fetchMaterialsList', error);
        throw error;
    }
};

export const fetchMaterialById = async (materialId: string): Promise<Material> => {
    try {
        const { currentCompany } = useGlobalStore.getState();
        const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
        const response = await axiosInstance.get(`/v1/materials/${materialId}`, {
            params: { company_code: companyCode }
        });
        return response.data;
    } catch (error) {
        logError('fetchMaterialById', error);
        throw error;
    }
};

export const insertMaterial = async (materialData: Partial<Material>): Promise<Material> => {
    try {
        const { currentCompany } = useGlobalStore.getState();
        const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
        const payload = { company_code: companyCode, ...materialData };
        const response = await axiosInstance.post('/v1/materials', payload);
        console.log('✅ Material created:', materialData.material_name);
        return response.data;
    } catch (error) {
        logError('insertMaterial', error);
        throw error;
    }
};

export const updateMaterial = async (materialId: string, updatedData: Partial<Material>): Promise<Material> => {
    try {
        const { currentCompany } = useGlobalStore.getState();
        const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
        const payload = { company_code: companyCode, ...updatedData };
        const response = await axiosInstance.put(`/v1/materials/${materialId}`, payload, { params: { company_code: companyCode } });
        console.log('✅ Material updated:', materialId);
        return response.data;
    } catch (error) {
        logError('updateMaterial', error);
        throw error;
    }
};

export const deleteMaterial = async (materialId: string): Promise<void> => {
    try {
        const { currentCompany } = useGlobalStore.getState();
        const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
        const response = await axiosInstance.delete(`/v1/materials/${materialId}`, { params: { company_code: companyCode } });
        console.log('✅ Material deleted:', materialId);
        return response.data;
    } catch (error) {
        logError('deleteMaterial', error);
        throw error;
    }
};


// Material Pack Hierarchies
export const fetchMaterialPackHierarchies = async (materialId: string): Promise<MaterialPackHierarchyItem[]> => {
    try {
        const response = await axiosInstance.get(`/v1/material-pack-hierarchies`, { params: { material_id: materialId } });
        return response.data?.data ?? response.data ?? [];
    } catch (error) {
        logError('fetchMaterialPackHierarchies', error);
        throw error;
    }
};

export const insertMaterialPackHierarchy = async (payload: Omit<MaterialPackHierarchyItem, 'id' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'>): Promise<MaterialPackHierarchyItem> => {
    try {
        const response = await axiosInstance.post(`/v1/material-pack-hierarchies`, payload);
        return response.data;
    } catch (error) {
        logError('insertMaterialPackHierarchy', error);
        throw error;
    }
};

export const deleteMaterialPackHierarchy = async (id: string): Promise<void> => {
    try {
        const response = await axiosInstance.delete(`/v1/material-pack-hierarchies/${id}`);
        return response.data;
    } catch (error) {
        logError('deleteMaterialPackHierarchy', error);
        throw error;
    }
};


