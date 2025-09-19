export interface PalletType {
    id?: number;
    name: string;
    pallet_type: string;
    pallet_type_description: string;
    pallet_width: number;
    pallet_length: number;
    pallet_height: number;
    pallet_weight: string;
    pallet_max_stack_count: number;
    pallet_max_row_count: number;
    is_active: boolean;
    is_deleted?: boolean;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
} 