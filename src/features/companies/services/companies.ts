import axiosInstance from '@/config/axios';
import type { Company } from '../types/company';
import type { PaginatedResponse } from '@/utils/responseHelper';

interface PaginationParams {
    page?: number;
    per_page?: number;
}

interface CompanyParams extends PaginationParams {
    company_name?: string;
    city?: string;
    status?: string;
    search_term?: string;
}

// SERVICE LAYER - SADECE API ÇAĞRILARI
// TRY-CATCH KULLANMA! Hataları üst katmana fırlat

export const fetchCompanies = async (params: CompanyParams = {}) => {
    const response = await axiosInstance.get('/v1/companies', {
        params: {
            company_name: params.company_name,
            city: params.city,
            is_active: params.status
        }
    });
    return response.data as PaginatedResponse<Company>;
};

export const fetchCompaniesList = async (params: CompanyParams = {}) => {
    let requestParams: any = {};

    if (params.search_term) {
        // Eğer search_term dolu ise, sadece search_term ve is_active gönder
        requestParams.search_term = params.search_term;
        requestParams.is_active = params.status || 'all';
    } else {
        // Eğer search_term boş ise, company_name, city ve is_active gönder
        if (params.company_name) {
            requestParams.company_name = params.company_name;
        }
        if (params.city) {
            requestParams.city = params.city;
        }
        requestParams.is_active = params.status || 'all';
    }
    
    // Pagination params (if provided)
    if (typeof params.page === 'number') {
        requestParams.page = params.page;
    }
    if (typeof params.per_page === 'number') {
        requestParams.per_page = params.per_page;
    }
    
    const response = await axiosInstance.get('/v1/companies', {
        params: requestParams
    });

    // Backend now returns paginated response with data, total, page, etc.
    return response.data as PaginatedResponse<Company>;
};

export const fetchCompanyById = async (companyId: string): Promise<Company> => {
    const response = await axiosInstance.get(`/v1/companies/${companyId}`);
    return response.data;
};

export const insertCompany = async (companyData: Partial<Company>): Promise<Company> => {
    const response = await axiosInstance.post('/v1/companies', companyData);
    console.log('✅ Company created:', companyData.company_name);
    return response.data;
};

export const updateCompany = async (companyId: string, updatedData: Partial<Company>): Promise<Company> => {
    const response = await axiosInstance.put(`/v1/companies/${companyId}`, updatedData);
    console.log('✅ Company updated:', companyId);
    return response.data;
};

export const deleteCompany = async (companyId: string): Promise<void> => {
    const response = await axiosInstance.delete(`/v1/companies/${companyId}`);
    console.log('✅ Company deleted:', companyId);
    return response.data;
};

export const fetchCompaniesDropdown = async () => {
    const response = await axiosInstance.get('/v1/companies/dropdown');
    return response.data;
};