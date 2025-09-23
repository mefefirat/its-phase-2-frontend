import axiosInstance from '@/config/axios';
import type { Job, CreateJobRequest, UpdateJobRequest, JobPackHierarchyNode, JobPackage, JobScan, JobLastScannedItem } from '../types/job';
import type { PaginatedResponse } from '@/utils/responseHelper';
import { useGlobalStore } from '@/store/globalStore';

interface PaginationParams {
    page?: number;
    per_page?: number;
}

interface JobParams extends PaginationParams {
    status?: string;
}

export interface CreateJobScanRequest {
    job_id: string;
    barcode: string;
}

// SERVICE LAYER - SADECE API ÇAĞRILARI
// TRY-CATCH KULLANMA! Hataları üst katmana fırlat

export const fetchJobs = async (params: JobParams = {}) => {
    const { currentCompany } = useGlobalStore.getState();
    const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
    const response = await axiosInstance.get('/v1/jobs', {
        params: {
            page: params.page,
            per_page: params.per_page,
            company_code: companyCode,
            ...(params.status && { status: params.status }),
        }
    });
    return response.data as PaginatedResponse<Job>;
};

export const fetchJobsList = async (params: JobParams = {}) => {
    const { currentCompany } = useGlobalStore.getState();
    const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
    const requestParams: any = { company_code: companyCode };
    if (typeof params.page === 'number') requestParams.page = params.page;
    if (typeof params.per_page === 'number') requestParams.per_page = params.per_page;
    if (params.status) requestParams.status = params.status;

    const response = await axiosInstance.get('/v1/jobs', { params: requestParams });
    // Backend now returns paginated response with data, total, page, etc.
    return response.data as PaginatedResponse<Job>;
};

export const fetchJobById = async (jobId: string): Promise<Job> => {
    const { currentCompany } = useGlobalStore.getState();
    const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
    const response = await axiosInstance.get(`/v1/jobs/${jobId}`, {
        params: { company_code: companyCode }
    });
    return response.data;
};

export const insertJob = async (jobData: CreateJobRequest): Promise<Job> => {
    const { currentCompany } = useGlobalStore.getState();
    const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
    const payload = { ...jobData, company_code: companyCode };
    const response = await axiosInstance.post('/v1/jobs', payload);
    console.log('✅ Job created:', companyCode);
    return response.data;
};

export const updateJob = async (jobId: string, updatedData: UpdateJobRequest): Promise<Job> => {
    const { currentCompany } = useGlobalStore.getState();
    const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
    const payload = { company_code: companyCode, ...updatedData };
    const response = await axiosInstance.put(`/v1/jobs/${jobId}`, payload, { params: { company_code: companyCode } });
    console.log('✅ Job updated:', jobId);
    return response.data;
};

export const deleteJob = async (jobId: string): Promise<void> => {
    const { currentCompany } = useGlobalStore.getState();
    const companyCode = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;
    const response = await axiosInstance.delete(`/v1/jobs/${jobId}`, { params: { company_code: companyCode } });
    console.log('✅ Job deleted:', jobId);
    return response.data;
};

export const fetchJobPackHierarchyRecursive = async (jobId: string): Promise<{ data: JobPackHierarchyNode[]; count?: number } | JobPackHierarchyNode[]> => {
    const response = await axiosInstance.get(`/v1/job-pack-hierarchies/by-job/${jobId}/recursive`);
    return response.data as { data: JobPackHierarchyNode[]; count?: number } | JobPackHierarchyNode[];
};

export const createJobScan = async (payload: CreateJobScanRequest) => {
    const response = await axiosInstance.post('/v1/job-scans', payload);
    return response.data;
};

export const fetchJobPackages = async (jobId: string, parentId?: string | null): Promise<JobPackage[]> => {
    const basePath = `/v1/job-packages/list/${jobId}`;
    const url = parentId ? `${basePath}?parent_id=${encodeURIComponent(parentId)}` : basePath;
    const response = await axiosInstance.get(url);
    return response.data as JobPackage[];
};

export const fetchJobScans = async (jobPackageId: string): Promise<JobScan[]> => {
    const response = await axiosInstance.get('/v1/job-scans', {
        params: { job_package_id: jobPackageId }
    });
    return response.data as JobScan[];
};

export const fetchJobPackageHierarchyByLatestScan = async (jobId: string): Promise<JobPackHierarchyNode[]> => {
    const response = await axiosInstance.get(`/v1/job-packages/hierarchy/by-latest-scan/${jobId}`);
    return response.data as JobPackHierarchyNode[];
};

export const fetchLastScannedByJob = async (jobId: string): Promise<JobLastScannedItem[]> => {
    const response = await axiosInstance.get(`/v1/job-scans/last-scanned/${jobId}`);
    // API returns: { status: 'success', data: [...] }
    const payload = response.data as { status?: string; data: JobLastScannedItem[] } | JobLastScannedItem[];
    if (Array.isArray(payload)) return payload;
    return payload.data ?? [];
};
