export interface Qrcodes {
    id?: string;
    gtin: string;
    lot: string;
    expiry_date: string;
    quantity: number;
    order_number: number;
    start_serial_number: string;
    end_serial_number: string;
    current_serial_number: number;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
}
