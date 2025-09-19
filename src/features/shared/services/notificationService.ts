import { notifications } from '@mantine/notifications';

export interface NotificationOptions {
    title?: string;
    message: string;
    color?: 'red' | 'green' | 'orange' | 'blue' | 'yellow';
    autoClose?: number | false;
    withCloseButton?: boolean;
    icon?: React.ReactNode;
}

class NotificationService {
    private readonly defaultOptions = {
        withCloseButton: true,
        position: 'top-right' as const,
    };

    // Core notification methods
    showSuccess(message: string, options?: Partial<NotificationOptions>) {
        notifications.show({
            ...this.defaultOptions,
            title: options?.title || 'Başarılı!',
            message,
            color: 'green',
            autoClose: options?.autoClose ?? 3000,
            withCloseButton: options?.withCloseButton ?? true,
            icon: options?.icon,
        });
    }

    showError(message: string, details?: string, options?: Partial<NotificationOptions>) {
        const fullMessage = details ? `${message}: ${details}` : message;
        
        notifications.show({
            ...this.defaultOptions,
            title: options?.title || 'Hata!',
            message: fullMessage,
            color: 'red',
            autoClose: options?.autoClose ?? 5000,
            withCloseButton: options?.withCloseButton ?? true,
            icon: options?.icon,
        });
    }

    showWarning(message: string, options?: Partial<NotificationOptions>) {
        notifications.show({
            ...this.defaultOptions,
            title: options?.title || 'Uyarı!',
            message,
            color: 'orange',
            autoClose: options?.autoClose ?? 4000,
            withCloseButton: options?.withCloseButton ?? true,
            icon: options?.icon,
        });
    }

    showInfo(message: string, options?: Partial<NotificationOptions>) {
        notifications.show({
            ...this.defaultOptions,
            title: options?.title || 'Bilgi',
            message,
            color: 'blue',
            autoClose: options?.autoClose ?? 3000,
            withCloseButton: options?.withCloseButton ?? true,
            icon: options?.icon,
        });
    }

    // Network and connectivity errors
    showNetworkError() {
        this.showError(
            'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
            undefined,
            {
                title: 'Bağlantı Hatası',
                autoClose: 6000,
            }
        );
    }

    showTimeoutError() {
        this.showError(
            'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
            undefined,
            {
                title: 'Zaman Aşımı',
                autoClose: 5000,
            }
        );
    }

    showPermissionError() {
        this.showError(
            'Bu işlem için yetkiniz bulunmuyor.',
            undefined,
            {
                title: 'Yetki Hatası',
                autoClose: 4000,
            }
        );
    }

    // Authentication notifications (aligned with your Keycloak setup)
    showTokenRefreshSuccess() {
        this.showInfo(
            'Oturum başarıyla yenilendi.',
            {
                title: 'Oturum Yenilendi',
                autoClose: 2000,
            }
        );
    }

    showSessionExpired() {
        this.showWarning(
            'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
            {
                title: 'Oturum Sona Erdi',
                autoClose: false, // Don't auto close
            }
        );
    }

    showKeycloakError(message?: string) {
        this.showError(
            message || 'Kimlik doğrulama hatası oluştu.',
            undefined,
            {
                title: 'Kimlik Doğrulama Hatası',
                autoClose: 5000,
            }
        );
    }

    showTokenStorageRestored() {
        this.showSuccess(
            'Oturum bilgileriniz geri yüklendi.',
            {
                title: 'Oturum Geri Yüklendi',
                autoClose: 2000,
            }
        );
    }

    showCompanyAccessDenied(companyName?: string) {
        const message = companyName 
            ? `${companyName} şirketine erişim yetkiniz bulunmuyor.`
            : 'Bu şirkete erişim yetkiniz bulunmuyor.';
            
        this.showError(message, undefined, {
            title: 'Şirket Erişim Hatası',
            autoClose: 6000,
        });
    }

    // Validation errors
    showValidationError(field: string, message: string) {
        this.showError(`${field}: ${message}`, undefined, {
            title: 'Validation Hatası',
            autoClose: 4000,
        });
    }

    // Batch operation notifications
    showBulkSuccess(count: number, operation: string) {
        this.showSuccess(`${count} ${operation} başarıyla tamamlandı.`);
    }

    showBulkError(count: number, operation: string) {
        this.showError(`${count} ${operation} işlemi başarısız oldu.`);
    }

    showBatchProgress(current: number, total: number, operation: string) {
        this.showInfo(
            `${operation}: ${current}/${total} tamamlandı`,
            {
                title: 'İşlem Devam Ediyor',
                autoClose: 2000,
            }
        );
    }

    // Cache and performance notifications
    showCacheCleared() {
        this.showInfo(
            'Önbellek temizlendi.',
            {
                title: 'Önbellek',
                autoClose: 2000,
            }
        );
    }

    showCacheError() {
        this.showWarning(
            'Önbellek hatası. Veriler sunucudan yeniden alınıyor.',
            {
                title: 'Önbellek Hatası',
                autoClose: 3000,
            }
        );
    }

    // Development notifications (only in dev mode)
    showDevInfo(message: string, data?: any) {
        if (import.meta.env.DEV) {
            this.showInfo(
                `DEV: ${message}`,
                {
                    title: 'Geliştirme Bilgisi',
                    autoClose: 3000,
                    color: 'yellow',
                }
            );
            
            if (data) {
                console.log('Dev notification data:', data);
            }
        }
    }

    showDevError(message: string, error?: any) {
        if (import.meta.env.DEV) {
            this.showError(
                `DEV: ${message}`,
                undefined,
                {
                    title: 'Geliştirme Hatası',
                    autoClose: 5000,
                }
            );
            
            if (error) {
                console.error('Dev notification error:', error);
            }
        }
    }

    // Auto-retry notifications
    showRetryAttempt(attempt: number, maxAttempts: number) {
        this.showInfo(
            `Yeniden deneniyor... (${attempt}/${maxAttempts})`,
            {
                title: 'Yeniden Deneme',
                autoClose: 2000,
            }
        );
    }

    showRetrySuccess(attempts: number) {
        this.showSuccess(
            `İşlem ${attempts}. denemede başarılı oldu.`,
            {
                title: 'Başarılı',
                autoClose: 3000,
            }
        );
    }

    showRetryFailed(maxAttempts: number) {
        this.showError(
            `${maxAttempts} deneme sonrası işlem başarısız oldu.`,
            undefined,
            {
                title: 'İşlem Başarısız',
                autoClose: 5000,
            }
        );
    }

    // Global store related notifications
    showStoreReset() {
        this.showInfo(
            'Uygulama durumu sıfırlandı.',
            {
                title: 'Durum Sıfırlandı',
                autoClose: 2000,
            }
        );
    }

    showDataSync() {
        this.showInfo(
            'Veriler eşitleniyor...',
            {
                title: 'Eşitleme',
                autoClose: 2000,
            }
        );
    }

    showDataSyncComplete() {
        this.showSuccess(
            'Veri eşitlemesi tamamlandı.',
            {
                title: 'Eşitleme Tamamlandı',
                autoClose: 2000,
            }
        );
    }

    // User activity tracking notifications
    showIdleWarning(minutes: number) {
        this.showWarning(
            `${minutes} dakikadır hareketsizsiniz. Oturumunuz yakında sonlanabilir.`,
            {
                title: 'Hareketsizlik Uyarısı',
                autoClose: false,
            }
        );
    }

    showActivityDetected() {
        this.showInfo(
            'Aktivite algılandı. Oturum süresi uzatıldı.',
            {
                title: 'Aktivite Algılandı',
                autoClose: 2000,
            }
        );
    }

    // System status notifications
    showMaintenanceMode() {
        this.showWarning(
            'Sistem bakım modunda. Bazı özellikler geçici olarak kullanılamayabilir.',
            {
                title: 'Bakım Modu',
                autoClose: false,
            }
        );
    }

    showSystemUpdate() {
        this.showInfo(
            'Sistem güncellemesi mevcut. Sayfayı yenilemek önerilir.',
            {
                title: 'Güncelleme Mevcut',
                autoClose: false,
            }
        );
    }

    // Utility methods
    clear() {
        notifications.clean();
    }

    close(id: string) {
        notifications.hide(id);
    }

    // Show notification with custom ID for update/replace functionality
    showWithId(id: string, message: string, options?: Partial<NotificationOptions>) {
        notifications.show({
            id,
            ...this.defaultOptions,
            message,
            title: options?.title || 'Bildirim',
            color: options?.color || 'blue',
            autoClose: options?.autoClose ?? 3000,
            withCloseButton: options?.withCloseButton ?? true,
            icon: options?.icon,
        });
    }

    // Update existing notification
    updateNotification(id: string, message: string, options?: Partial<NotificationOptions>) {
        notifications.update({
            id,
            message,
            title: options?.title,
            color: options?.color,
            autoClose: options?.autoClose,
            withCloseButton: options?.withCloseButton,
            icon: options?.icon,
        });
    }

    // Queue notifications (useful for batch operations)
    private notificationQueue: Array<() => void> = [];
    private isProcessingQueue = false;

    queueNotification(notificationFn: () => void) {
        this.notificationQueue.push(notificationFn);
        this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessingQueue || this.notificationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift();
            if (notification) {
                notification();
                // Small delay between queued notifications
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        this.isProcessingQueue = false;
    }
}

export const notificationService = new NotificationService();