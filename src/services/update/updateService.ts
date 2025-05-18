// Import version từ file version.json thay vì package.json
let appVersion = '1.0.0'; // Giá trị mặc định

try {
  // Dynamically import version from version.json
  const versionInfo = require('../../version.json');
  appVersion = versionInfo.version;
} catch (e) {
  console.error('Không thể đọc thông tin phiên bản:', e);
}

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  newVersion?: string;
  releaseNotes?: string;
  updateUrl?: string;
  downloadUrl?: string;
}

/**
 * Kiểm tra phiên bản mới từ GitHub Releases
 * @param repoOwner Chủ sở hữu repository
 * @param repoName Tên repository
 * @returns Thông tin cập nhật
 */
export const checkForUpdates = async (
  repoOwner: string = 'phamquangvinhfpt',
  repoName: string = 'invoice-compare-react-extension'
): Promise<UpdateInfo> => {
  try {
    // Lấy thông tin releases từ GitHub API
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
    
    if (!response.ok) {
      throw new Error(`Không thể kết nối với GitHub API: ${response.status}`);
    }
    
    const releaseData = await response.json();
    const tagName = releaseData.tag_name; // Ví dụ: "v1.0.1"
    
    // Loại bỏ 'v' từ tag name nếu có
    const remoteVersion = tagName.startsWith('v') ? tagName.substring(1) : tagName;
    
    // So sánh phiên bản
    const isUpdateAvailable = compareVersions(appVersion, remoteVersion) < 0;
    
    // Tìm asset zip để tải xuống
    let downloadUrl = '';
    if (releaseData.assets && releaseData.assets.length > 0) {
      const zipAsset = releaseData.assets.find((asset: any) => 
        asset.name.endsWith('.zip') && 
        asset.browser_download_url
      );
      
      if (zipAsset) {
        downloadUrl = zipAsset.browser_download_url;
      }
    }
    
    return {
      available: isUpdateAvailable,
      currentVersion: appVersion,
      newVersion: remoteVersion,
      releaseNotes: releaseData.body || 'Các tính năng mới và sửa lỗi.',
      updateUrl: releaseData.html_url,
      downloadUrl
    };
  } catch (error) {
    console.error('Lỗi khi kiểm tra cập nhật:', error);
    
    // Fallback: Thử kiểm tra package.json nếu API không hoạt động
    try {
      const packageResponse = await fetch(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/package.json`);
      
      if (packageResponse.ok) {
        const packageData = await packageResponse.json();
        const fallbackVersion = packageData.version;
        
        const isUpdateAvailable = compareVersions(appVersion, fallbackVersion) < 0;
        
        return {
          available: isUpdateAvailable,
          currentVersion: appVersion,
          newVersion: fallbackVersion,
          updateUrl: `https://github.com/${repoOwner}/${repoName}/releases/latest`
        };
      }
    } catch (fallbackError) {
      console.error('Cả hai phương thức kiểm tra cập nhật đều thất bại:', fallbackError);
    }
    
    return {
      available: false,
      currentVersion: appVersion
    };
  }
};

/**
 * So sánh hai chuỗi phiên bản
 * @param v1 Phiên bản 1
 * @param v2 Phiên bản 2
 * @returns -1 nếu v1 < v2, 0 nếu v1 = v2, 1 nếu v1 > v2
 */
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  
  return 0;
};

/**
 * Hàm giúp lưu trữ thông báo cập nhật đã được hiển thị
 * @param version Phiên bản đã thông báo
 */
export const markUpdateNotified = (version: string): void => {
  chrome.storage.local.set({ lastNotifiedUpdate: version });
};

/**
 * Kiểm tra xem phiên bản đã được thông báo chưa
 * @param version Phiên bản cần kiểm tra
 * @returns true nếu đã thông báo, false nếu chưa
 */
export const wasUpdateNotified = async (version: string): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.local.get('lastNotifiedUpdate', (data) => {
      resolve(data.lastNotifiedUpdate === version);
    });
  });
};
