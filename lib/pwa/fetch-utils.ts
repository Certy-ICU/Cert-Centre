/**
 * Network utility functions for PWA features
 */

/**
 * Fetch with timeout capability
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Promise<Response>
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Check if the browser is online
 * @returns boolean
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Network information types
 */
export type ConnectionType = 
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

export type EffectiveConnectionType = 
  | 'slow-2g'
  | '2g'
  | '3g'
  | '4g'
  | 'unknown';

/**
 * Get network information if available
 * @returns Object with connection details or null
 */
export function getNetworkInformation(): {
  type: ConnectionType;
  effectiveType: EffectiveConnectionType;
  downlinkMax?: number;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} | null {
  // @ts-ignore - Network Information API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return null;
  
  return {
    type: connection.type || 'unknown',
    effectiveType: connection.effectiveType || 'unknown',
    downlinkMax: connection.downlinkMax,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData
  };
}

/**
 * Check if the connection is metered
 * @returns boolean or null if not supported
 */
export function isMeteredConnection(): boolean | null {
  const netInfo = getNetworkInformation();
  
  if (!netInfo) return null;
  
  // Consider cellular connections as metered
  if (netInfo.type === 'cellular') return true;
  
  // Use saveData if available
  if (typeof netInfo.saveData === 'boolean') return netInfo.saveData;
  
  // Otherwise null (unknown)
  return null;
}

/**
 * Check if on a high-performance connection
 * @returns boolean
 */
export function isHighPerformanceConnection(): boolean {
  const netInfo = getNetworkInformation();
  
  if (!netInfo) return true; // Assume high performance if API not available
  
  // Check effective type
  if (netInfo.effectiveType === '4g') return true;
  
  // Check downlink speed (> 2 Mbps)
  if (netInfo.downlink && netInfo.downlink > 2) return true;
  
  // Check RTT (< 200ms)
  if (netInfo.rtt && netInfo.rtt < 200) return true;
  
  return false;
}

/**
 * Check if the device has a battery-saving mode enabled
 * @returns Promise<boolean or null>
 */
export async function isBatterySaving(): Promise<boolean | null> {
  // @ts-ignore - Battery API
  if (!navigator.getBattery) return null;
  
  try {
    // @ts-ignore - Battery API
    const battery = await navigator.getBattery();
    
    // Check charging status and level
    if (!battery.charging && battery.level < 0.2) {
      return true; // Likely in battery saving mode
    }
    
    return false;
  } catch (error) {
    console.error('Error checking battery status:', error);
    return null;
  }
} 