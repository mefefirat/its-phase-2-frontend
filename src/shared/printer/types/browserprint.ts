// types/browserprint.ts

export interface BrowserPrintDevice {
    uid: string;
    name: string;
    connection: string;
    deviceType: string;
    version?: number;
    provider?: string;
    manufacturer?: string;
    send: (data: string, successCallback?: () => void, errorCallback?: (error: string) => void) => void;
    read?: (successCallback: (data: string) => void, errorCallback: (error: string) => void) => void;
    sendFile?: (url: string, successCallback?: () => void, errorCallback?: (error: string) => void) => void;
    convertAndSendFile?: (url: string, successCallback?: () => void, errorCallback?: (error: string) => void) => void;
  }
  
  export interface ApplicationConfiguration {
    defaultPrintService: string;
    defaultDevice: string;
    availableDevices: BrowserPrintDevice[];
  }
  
  export interface BrowserPrintAPI {
    getDefaultDevice: (
      deviceType: string,
      successCallback: (device: BrowserPrintDevice) => void,
      errorCallback: (error: string) => void
    ) => void;
    
    getLocalDevices: (
      successCallback: (devices: BrowserPrintDevice[]) => void,
      errorCallback: (error: string) => void,
      deviceType?: string
    ) => void;
    
    getApplicationConfiguration?: (
      successCallback: (config: ApplicationConfiguration) => void,
      errorCallback: (error: string) => void
    ) => void;
    
    ApplicationConfiguration?: new () => ApplicationConfiguration;
  }
  
  // Global window tipini genişlet
  declare global {
    interface Window {
      BrowserPrint: BrowserPrintAPI;
    }
  }
  
  export {};