export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    per_page: number;
    total: number;
    total_pages?: number;
}

export function extractData<T>(response: PaginatedResponse<T> | T[] | T): T[] {
    if (Array.isArray(response)) {
        return response;
    }
    
    if (response && typeof response === 'object' && 'data' in response) {
        return response.data;
    }
    
    // If response is a single item, wrap it in an array
    return [response as T];
} 