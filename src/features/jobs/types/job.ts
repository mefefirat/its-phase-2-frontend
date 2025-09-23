export interface Job {
    id?: string;
    company_code: string;
    material_id: string;
    material_name?: string;
    gtin?: string | null;
    sku?: string | null;
    lot?: string | null;
    manufacture_date?: string | null;
    expiry_date?: string | null;
    planned_items: number;
    scanned_items: number;
    status: string; // job_status enum
    started_at?: string | null;
    completed_at?: string | null;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
}

export interface CreateJobRequest {
    company_code: string;
    material_id: string;
}

export interface UpdateJobRequest {
    planned_items?: number;
    scanned_items?: number;
    status?: string;
    started_at?: string | null;
    completed_at?: string | null;
    gtin?: string | null;
    sku?: string | null;
    lot?: string | null;
    manufacture_date?: string | null;
    expiry_date?: string | null;
}

export interface JobPackHierarchyNode {
    id: string;
    parent_id?: string | null;
    level?: number;
    children?: JobPackHierarchyNode[];
    // Allow additional backend-provided fields without strict typing
    [key: string]: unknown;
}

export interface JobPackage {
    id: string;
    job_id: string;
    material_id: string;
    parent_id: string | null;
    code: string;
    label?: string;
    barcode: string;
    current_value: number;
    capacity_items: number;
    filled_items: number;
    status: string;
    sort_order: number;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
}

export interface JobScan {
    id: string;
    job_id: string;
    job_package_id: string;
    barcode: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
}

export interface JobLastScannedItem {
    barcode: string;
    created_at: string;
}