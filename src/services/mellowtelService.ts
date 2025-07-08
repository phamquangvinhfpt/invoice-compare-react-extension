/**
 * Mellowtel Service - Handles bandwidth sharing integration
 * Updated according to official Mellowtel documentation
 */

/**
 * Open Mellowtel settings page
 * Uses the generateSettingsLink() method from official documentation
 */
export const openMellowtelSettings = (): Promise<{
  success: boolean;
  error?: string;
}> => {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(
        { type: "OPEN_MELLOWTEL_SETTINGS" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    } else {
      reject(new Error("Chrome runtime not available"));
    }
  });
};

/**
 * Check if user has opted in to Mellowtel
 * Simplified according to official documentation
 */
export const checkMellowtelOptInStatus = (): Promise<{
  hasOptedIn: boolean;
  firstInstall: boolean;
}> => {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(
        { type: "CHECK_MELLOWTEL_OPTIN" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    } else {
      reject(new Error("Chrome runtime not available"));
    }
  });
};
