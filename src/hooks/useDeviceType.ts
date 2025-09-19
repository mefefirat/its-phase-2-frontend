// src/hooks/useDeviceType.ts
import { useState, useEffect } from 'react';

export type DeviceType = 'desktop' | 'mobile' | 'rf-device';

export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isRFDevice = userAgent.includes('rf') || 
                        userAgent.includes('handheld') ||
                        userAgent.includes('honeywell') ||
                        userAgent.includes('zebra') ||
                        // URL parametresi ile de kontrol edebilirsiniz
                        window.location.search.includes('rf=true');
      
      if (isRFDevice) {
        setDeviceType('rf-device');
      } else if (window.innerWidth <= 768) {
        setDeviceType('mobile');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  return deviceType;
};