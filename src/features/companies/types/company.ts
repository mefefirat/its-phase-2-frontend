export interface Company {
    id?: string;
    company_code: string;
    company_name: string;
    gln?: string | null;
    gcp: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
}