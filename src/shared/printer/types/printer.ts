export interface BarcodeRequest {
    printer_name: string;
    code: string;
    qr: string;
    text: string;
}

export interface BarcodeResponse {
    success: boolean;
    message?: string;
} 