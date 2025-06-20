/**
 * Mellowtel Service - Handles bandwidth sharing integration
 */

export interface MellowtelStats {
  bandwidthShared: number;
  earnings: number;
  isActive: boolean;
  lastUpdate: string; // Changed from Date to string (ISO string)
}

export interface MellowtelConfig {
  enabled: boolean;
  allowedDomains: string[];
  maxBandwidthUsage: number;
  shareOnlyWhenIdle: boolean;
}

/**
 * Get Mellowtel status from background script
 */
export const getMellowtelStatus = (): Promise<{
  enabled: boolean;
  stats: MellowtelStats;
}> => {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage(
        { type: 'GET_MELLOWTEL_STATUS' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    } else {
      reject(new Error('Chrome runtime not available'));
    }
  });
};

/**
 * Toggle Mellowtel on/off
 */
export const toggleMellowtel = (enabled: boolean): Promise<{
  enabled: boolean;
}> => {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage(
        { type: 'TOGGLE_MELLOWTEL', enabled },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    } else {
      reject(new Error('Chrome runtime not available'));
    }
  });
};

/**
 * Save Mellowtel configuration to storage
 */
export const saveMellowtelConfig = (config: MellowtelConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ mellowtelConfig: config }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    } else {
      reject(new Error('Chrome storage not available'));
    }
  });
};

/**
 * Load Mellowtel configuration from storage
 */
export const loadMellowtelConfig = (): Promise<MellowtelConfig> => {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['mellowtelConfig'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          const defaultConfig: MellowtelConfig = {
            enabled: true,
            allowedDomains: ['*'],
            maxBandwidthUsage: 1000,
            shareOnlyWhenIdle: false
          };
          resolve(result.mellowtelConfig || defaultConfig);
        }
      });
    } else {
      reject(new Error('Chrome storage not available'));
    }
  });
};