export interface ApiError {
    response?: {
      data?: { message?: string };
      status: number;
      statusText: string;
    };
    request?: any;
    message?: string;
  }
  
  export const getErrorMessage = (error: ApiError, defaultMessage: string): string => {
    if (error.response) {
      return error.response.data?.message || 
             `Hata: ${error.response.status} ${error.response.statusText}`;
    } else if (error.request) {
      return 'Sunucuya ulaşılamıyor';
    } else {
      return error.message || defaultMessage;
    }
  };
  
  export const createErrorHandler = (defaultMessage: string) => {
    return (error: ApiError): string => getErrorMessage(error, defaultMessage);
  };