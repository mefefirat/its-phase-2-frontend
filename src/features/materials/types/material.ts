export interface Material {
    id?: string;
    company_code: string;
    material_name: string;
    material_name_search: string;
    sku?: string | null;
    gtin?: string | null;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
}

export interface MaterialPackHierarchyItem {
    id?: string;
    material_id: string;
    parent_id: string | null;
    code: string;
    label: string;
    capacity_items: number;
    barcode_prefix: string;
    barcode_start_value: number;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
}


