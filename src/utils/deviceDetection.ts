
export const isRFDevice = () => {
  // Screen resolution kontrolü (PM550: 480x800)
  const { width, height } = screen;
  const isPM550Resolution = 
    (width === 480 && height === 800) || 
    (width === 800 && height === 480);

  // User Agent kontrolü
  const userAgent = navigator.userAgent.toLowerCase();
  const isPMDevice = 
    userAgent.includes('pm550') || 
    userAgent.includes('pointmobile');

  // WebView detection (Android)
  const isAndroidWebView = 
    userAgent.includes('wv') && 
    userAgent.includes('android');

  // Combine all conditions
  return isPM550Resolution || isPMDevice || isAndroidWebView;
};

export const getDeviceType = () => {
  const { width, height } = screen;
  const userAgent = navigator.userAgent.toLowerCase();

  // PM550 specific detection
  if ((width === 480 && height === 800) || 
      (width === 800 && height === 480) ||
      userAgent.includes('pm550') ||
      userAgent.includes('pointmobile')) {
    return 'PM550';
  }

  // General RF/handheld device detection
  if (userAgent.includes('wv') && userAgent.includes('android')) {
    return 'handheld';
  }

  // Desktop/Web
  return 'desktop';
};

export const getDeviceInfo = () => {
  return {
    type: getDeviceType(),
    isRFDevice: isRFDevice(),
    userAgent: navigator.userAgent,
    screenSize: `${screen.width}x${screen.height}`,
    pixelRatio: window.devicePixelRatio || 1,
    isWebView: navigator.userAgent.includes('wv')
  };
};