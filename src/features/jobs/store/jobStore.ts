import { create } from 'zustand';
import React from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { fetchJobs, insertJob, updateJob, deleteJob, fetchJobById, fetchJobsList, fetchJobPackHierarchyRecursive, createJobScan, fetchJobPackages, fetchJobScans, fetchJobPackageHierarchyByLatestScan, fetchLastScannedByJob, forceCloseJobPackage, fetchCurrentJobNumber } from '../services/jobs';
import type { CreateJobScanRequest } from '../services/jobs';
import type { Job, CreateJobRequest, UpdateJobRequest, JobPackHierarchyNode, JobPackage, JobScan, JobLastScannedItem } from '../types/job';
import type { PaginatedResponse } from '@/utils/responseHelper';
import { extractErrorMessage, getUserFriendlyErrorMessage, isBusinessError } from '@/utils/errorHandler';

// URL'den status parametresini al
const getStatusFromUrl = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    return status || 'completed'; // Default olarak 'completed'
};

interface JobState {
    jobs: Job[];
    loading: boolean;
    jobPackHierarchy: JobPackHierarchyNode[] | null;
    jobPackHierarchyCount?: number;
    jobPackages: JobPackage[];
    jobScans: JobScan[];
    jobPackageHierarchyByLatestScan: JobPackHierarchyNode[];
    lastScanned: JobLastScannedItem[];
    currentJobNumber: number | null;
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    status?: string;
    fetchJobs: () => Promise<void>;
    fetchJobsList: () => Promise<void>;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    fetchJobById: (jobId: string) => Promise<Job>;
    fetchJobPackHierarchyRecursive: (jobId: string) => Promise<JobPackHierarchyNode[] | { data: JobPackHierarchyNode[]; count?: number }>;
    fetchJobPackages: (jobId: string, parentId?: string | null) => Promise<JobPackage[]>;
    fetchJobScans: (jobPackageId: string) => Promise<JobScan[]>;
    fetchJobPackageHierarchyByLatestScan: (jobId: string) => Promise<JobPackHierarchyNode[]>;
    fetchLastScannedByJob: (jobId: string) => Promise<JobLastScannedItem[]>;
    addJob: (jobData: CreateJobRequest) => Promise<Job>;
    editJob: (jobId: string, updatedData: UpdateJobRequest) => Promise<void>;
    removeJob: (jobId: string) => Promise<void>;
    scanJob: (payload: CreateJobScanRequest) => Promise<any>;
    forceClosePackage: (jobPackageId: string) => Promise<any>;
    fetchCurrentJobNumber: () => Promise<number>;
}

export const useJobStore = create<JobState>((set, get) => ({
    jobs: [],
    loading: false,
    jobPackHierarchy: null,
    jobPackHierarchyCount: undefined,
    jobPackages: [],
    jobScans: [],
    jobPackageHierarchyByLatestScan: [],
    lastScanned: [],
    currentJobNumber: null,
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
    status: 'completed', // Default status

    setPage: (page: number) => {
        set({ page });
        get().fetchJobsList();
    },

    setPerPage: (perPage: number) => {
        set({ per_page: perPage, page: 1 });
        get().fetchJobsList();
    },

    fetchJobs: async () => {
        set({ loading: true });
        try {
            const currentStatus = getStatusFromUrl();
            set({ status: currentStatus });
            
            const response = await fetchJobs({ status: currentStatus });
            const jobs = response.data;

            set({ 
                jobs: jobs,
                page: response.page,
                per_page: response.per_page,
                total: response.total,
                total_pages: response.total_pages
            });
        } catch (error) {
            console.error('Failed to fetch jobs', error);
            notifications.show({
                title: 'Hata!',
                message: 'İş listesi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            set({ jobs: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchJobsList: async () => {
        set({ loading: true });
        try {
            const currentStatus = getStatusFromUrl();
            set({ status: currentStatus });
            
            const response = await fetchJobsList({
                page: get().page,
                per_page: get().per_page,
                status: currentStatus,
            });

            set({ 
                jobs: response.data,
                page: response.page,
                per_page: response.per_page,
                total: response.total,
                total_pages: response.total_pages
            });
        } catch (error) {
            console.error('Failed to fetch jobs', error);
            notifications.show({
                title: 'Hata!',
                message: 'İş listesi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            set({ jobs: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchJobById: async (jobId) => {
        try {
            const response = await fetchJobById(jobId);
            return response;
        } catch (error) {
            console.error('Failed to fetch job by id', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'İş yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    },

    fetchJobPackHierarchyRecursive: async (jobId) => {
        try {
            const response = await fetchJobPackHierarchyRecursive(jobId);
            // response can be array or object containing data and count
            const tree = Array.isArray(response) ? response : (response?.data ?? []);
            const count = Array.isArray(response) ? undefined : response?.count;
            set({ jobPackHierarchy: tree, jobPackHierarchyCount: count });
            return response as any;
        } catch (error) {
            console.error('Failed to fetch job pack hierarchy', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Paket hiyerarşisi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    },

    fetchJobPackages: async (jobId, parentId) => {
        try {
            const list = await fetchJobPackages(jobId, parentId ?? undefined);
            // Only set top-level list when parentId is not provided
            if (!parentId) {
                set({ jobPackages: list });
            }
            return list;
        } catch (error) {
            console.error('Failed to fetch job packages', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Paket listesi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    },

    fetchJobScans: async (jobPackageId) => {
        try {
            const list = await fetchJobScans(jobPackageId);
            set({ jobScans: list });
            return list;
        } catch (error) {
            console.error('Failed to fetch job scans', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Barkod geçmişi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    },

    fetchJobPackageHierarchyByLatestScan: async (jobId) => {
        try {
            const list = await fetchJobPackageHierarchyByLatestScan(jobId);
            set({ jobPackageHierarchyByLatestScan: list });
            return list;
        } catch (error) {
            console.error('Failed to fetch job package hierarchy by latest scan', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'En son tarama paket hiyerarşisi yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    },

    fetchLastScannedByJob: async (jobId) => {
        try {
            const list = await fetchLastScannedByJob(jobId);
            set({ lastScanned: list });
            return list;
        } catch (error) {
            console.error('Failed to fetch last scanned list', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Son okutulan barkodlar yüklenirken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    },

    addJob: async (jobData) => {
        try {
            const createdJob = await insertJob(jobData);
            await get().fetchJobs();
            return createdJob;
        } catch (error) {
            console.error('Failed to add job', error);
            if (isBusinessError(error, 'duplicate')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu iş zaten mevcut',
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
            throw error;
        }
    },

    editJob: async (jobId, updatedData) => {
        try {
            await updateJob(jobId, updatedData);
            await get().fetchJobs();
        } catch (error) {
            const errorMessage = extractErrorMessage(error);
            if (errorMessage.toLowerCase().includes('duplicate') ||
                errorMessage.toLowerCase().includes('already exists') ||
                errorMessage.toLowerCase().includes('unique')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu iş zaten mevcut',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else if (isBusinessError(error, 'validation')) {
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
                    message: getUserFriendlyErrorMessage(error, 'update'),
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }
            throw error;
        }
    },

    removeJob: async (jobId) => {
        try {
            await deleteJob(jobId);
            await get().fetchJobs();
        } catch (error) {
            console.error('Failed to delete job', error);
            const errorMessage = extractErrorMessage(error).toLowerCase();
            if (errorMessage.includes('constraint') || errorMessage.includes('foreign key') || errorMessage.includes('reference')) {
                notifications.show({
                    title: 'Hata',
                    message: 'Bu iş başka kayıtlarda kullanıldığı için silinemez',
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            } else {
                notifications.show({
                    title: 'Hata!',
                    message: getUserFriendlyErrorMessage(error, 'delete'),
                    color: 'red',
                    icon: React.createElement(IconX, { size: 16 }),
                    autoClose: 5000,
                });
            }
            throw error;
        }
    },

    scanJob: async (payload) => {
        try {
            const response = await createJobScan(payload);
            return response;
        } catch (error) {
            console.error('Failed to create job scan', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Barkod okutulurken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    },

    forceClosePackage: async (jobPackageId) => {
        try {
            const response = await forceCloseJobPackage(jobPackageId);
            notifications.show({
                title: 'Başarılı',
                message: 'Paket zorla kapatıldı.',
                color: 'green',
                icon: React.createElement(IconCheck, { size: 16 }),
                autoClose: 3000,
            });
            return response;
        } catch (error) {
            console.error('Failed to force close package', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Paket kapatılırken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    },

    fetchCurrentJobNumber: async () => {
        try {
            const response = await fetchCurrentJobNumber();
            set({ currentJobNumber: response.current_job_number });
            return response.current_job_number;
        } catch (error) {
            console.error('Failed to fetch current job number', error);
            const errorMessage = extractErrorMessage(error);
            notifications.show({
                title: 'Hata!',
                message: errorMessage || 'Güncel iş numarası alınırken bir hata oluştu.',
                color: 'red',
                icon: React.createElement(IconX, { size: 16 }),
                autoClose: 5000,
            });
            throw error;
        }
    }
}));
