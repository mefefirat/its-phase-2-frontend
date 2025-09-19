import axios from 'axios';

/**
 * Global error handler function that extracts meaningful error messages
 * from various error types (Axios, Network, JavaScript errors, etc.)
 */
export function extractErrorMessage(err: unknown): string {
  // Console'da ham veriyi göster (debugging için)
  console.log('🔍 Raw Error Data:', err);

  // Axios hatası mı?
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    
    console.log('🌐 Axios Error Details:', {
      status,
      data,
      message: err.message,
      config: {
        url: err.config?.url,
        method: err.config?.method
      }
    });

    if (data) {
      // JSON object ise: {"error": "..."} | {"message": "..."} | {"detail": "..."}
      if (typeof data === "object" && data !== null) {
        const anyData = data as Record<string, any>;
        
        // Öncelikli alanları kontrol et
        const errorMessage = 
          anyData.error ||
          anyData.message ||
          anyData.detail ||
          anyData.msg ||
          anyData.description;
          
        if (errorMessage && typeof errorMessage === "string") {
          return errorMessage;
        }
        
        // Nested error objeleri için
        if (anyData.errors && Array.isArray(anyData.errors) && anyData.errors.length > 0) {
          const firstError = anyData.errors[0];
          if (typeof firstError === "string") return firstError;
          if (typeof firstError === "object" && firstError.message) return firstError.message;
        }
        
        // Validation errors için (Laravel tarzı)
        if (anyData.errors && typeof anyData.errors === "object") {
          const firstField = Object.keys(anyData.errors)[0];
          if (firstField && anyData.errors[firstField][0]) {
            return anyData.errors[firstField][0];
          }
        }
        
        // Son çare olarak JSON string'e çevir
        try {
          return JSON.stringify(anyData, null, 2);
        } catch {
          return "Hata verisi işlenemiyor";
        }
      }
      
      // Düz metin ise
      if (typeof data === "string") {
        return data.trim() || "Boş hata mesajı";
      }
    }
    
    // Response yoksa (network / timeout / CORS)
    if (!err.response) {
      if (err.code === 'ERR_NETWORK') {
        return "Ağ bağlantı hatası - Sunucuya erişilemiyor";
      }
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return "İstek zaman aşımına uğradı";
      }
      if (err.code === 'ERR_CANCELED') {
        return "İstek iptal edildi";
      }
      return err.message || "Bilinmeyen ağ hatası";
    }
    
    // Response var ama data yok
    const statusText = err.response.statusText || "Bilinmeyen hata";
    return `HTTP ${status}: ${statusText}`;
  }
  
  // JavaScript Error objesi mi?
  if (err instanceof Error) {
    console.log('⚠️ JavaScript Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    // Özel hata türleri
    if (err.name === 'TypeError') {
      return `Tür hatası: ${err.message}`;
    }
    if (err.name === 'ReferenceError') {
      return `Referans hatası: ${err.message}`;
    }
    if (err.name === 'SyntaxError') {
      return `Sözdizimi hatası: ${err.message}`;
    }
    
    return err.message || "Bilinmeyen JavaScript hatası";
  }
  
  // Promise rejection (string)
  if (typeof err === "string") {
    return err.trim() || "Boş hata mesajı";
  }
  
  // Object ama Error değil
  if (typeof err === "object" && err !== null) {
    const anyErr = err as Record<string, any>;
    
    // En yaygın alanları kontrol et
    const message = anyErr.message || anyErr.error || anyErr.description || anyErr.msg;
    if (typeof message === "string") {
      return message;
    }
    
    // Son çare - objeyi string'e çevir
    try {
      return JSON.stringify(err, null, 2);
    } catch {
      return "Hata objesi işlenemiyor";
    }
  }
  
  // Primitive değerler (number, boolean, undefined, null)
  if (err === null) return "Null hata";
  if (err === undefined) return "Tanımsız hata";
  
  // Son çare
  return String(err) || "Bilinmeyen hata türü";
}

/**
 * Enhanced version with logging and categorization
 */
export function extractErrorMessageWithLogging(err: unknown, context?: string): {
  message: string;
  category: 'network' | 'server' | 'client' | 'javascript' | 'unknown';
  status?: number;
} {
  const contextPrefix = context ? `[${context}]` : '';
  console.group(`${contextPrefix} Error Analysis`);
  
  let message = extractErrorMessage(err);
  let category: 'network' | 'server' | 'client' | 'javascript' | 'unknown' = 'unknown';
  let status: number | undefined;
  
  if (axios.isAxiosError(err)) {
    status = err.response?.status;
    
    if (!err.response) {
      category = 'network';
    } else if (status && status >= 500) {
      category = 'server';
    } else if (status && status >= 400) {
      category = 'client';
    }
  } else if (err instanceof Error) {
    category = 'javascript';
  }
  
  console.log('📊 Error Summary:', { message, category, status });
  console.groupEnd();
  
  return { message, category, status };
}

/**
 * Check if error is a specific business logic error
 */
export function isBusinessError(err: unknown, type: 'duplicate' | 'validation' | 'not_found' | 'unauthorized' | 'forbidden'): boolean {
  const message = extractErrorMessage(err).toLowerCase();
  
  switch (type) {
    case 'duplicate':
      return message.includes('duplicate') || 
             message.includes('already exists') || 
             message.includes('unique') ||
             message.includes('constraint');
    
    case 'validation':
      return message.includes('validation') || 
             message.includes('invalid') ||
             message.includes('required') ||
             message.includes('format');
    
    case 'not_found':
      return message.includes('not found') || 
             message.includes('bulunamadı') ||
             message.includes('does not exist');
    
    case 'unauthorized':
      return message.includes('unauthorized') || 
             message.includes('yetkisiz') ||
             message.includes('authentication');
    
    case 'forbidden':
      return message.includes('forbidden') || 
             message.includes('yasaklı') ||
             message.includes('permission');
    
    default:
      return false;
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(err: unknown, operationType: 'create' | 'read' | 'update' | 'delete' = 'read'): string {
  if (isBusinessError(err, 'duplicate')) {
    return operationType === 'create' 
      ? 'Bu kayıt zaten mevcut' 
      : 'Bu kayıt başka yerlerde kullanıldığı için değiştirilemez';
  }
  
  if (isBusinessError(err, 'validation')) {
    return 'Girilen veriler geçerli değil. Lütfen kontrol ediniz';
  }
  
  if (isBusinessError(err, 'not_found')) {
    return 'Aradığınız kayıt bulunamadı';
  }
  
  if (isBusinessError(err, 'unauthorized')) {
    return 'Bu işlem için yetkiniz bulunmuyor';
  }
  
  if (isBusinessError(err, 'forbidden')) {
    return 'Bu işlemi gerçekleştirme yetkiniz yok';
  }
  
  // Default messages based on operation
  const operationMessages = {
    create: 'Kayıt oluşturulurken bir hata oluştu',
    read: 'Veriler yüklenirken bir hata oluştu', 
    update: 'Kayıt güncellenirken bir hata oluştu',
    delete: 'Kayıt silinirken bir hata oluştu'
  };
  
  return operationMessages[operationType];
}