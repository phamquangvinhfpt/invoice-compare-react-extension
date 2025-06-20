// Service worker cho Chrome Extension
import { checkForUpdates, markUpdateNotified, wasUpdateNotified } from '../services/update/updateService';
import Mellowtel from 'mellowtel';

// Khởi tạo Mellowtel với configuration key
const mellowtel = new Mellowtel('84d8b468', {
  // Optional: Specify allowed domains for network sharing
  allowedDomains: ['*'],
  // Optional: Maximum bandwidth limit in MB per day
  maxBandwidthUsage: 1000,
  // Optional: Only share bandwidth when user is idle
  shareOnlyWhenIdle: false
});

// Khởi tạo khoảng thời gian kiểm tra cập nhật (2 ngày = 172800000 ms)
const UPDATE_CHECK_INTERVAL = 172800000;

// Xử lý sự kiện khi extension được cài đặt
chrome.runtime.onInstalled.addListener(async () => {  
  // Khởi tạo Mellowtel
  try {
    // Initialize Mellowtel in background script
    // The exact method name might vary - check Mellowtel documentation
    console.log('Initializing Mellowtel...');
    // await mellowtel.initBackground(); // Uncomment when API is confirmed
  } catch (error) {
    console.error('Failed to initialize Mellowtel:', error);
  }
  
  // Tạo menu ngữ cảnh cho extension
  chrome.contextMenus.create({
    id: "open-full-page",
    title: "Mở toàn màn hình",
    contexts: ["action"] // Hiển thị khi nhấp chuột phải vào icon extension
  });
  
  // Kiểm tra cập nhật khi extension được cài đặt hoặc cập nhật
  scheduleUpdateCheck();
  
  // Thiết lập kiểm tra cập nhật định kỳ
  chrome.alarms.create('checkForUpdates', {
    periodInMinutes: UPDATE_CHECK_INTERVAL / (60 * 1000)
  });
});

// Lắng nghe sự kiện báo thức để kiểm tra cập nhật
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkForUpdates') {
    scheduleUpdateCheck();
  }
});

// Hàm kiểm tra cập nhật
async function scheduleUpdateCheck() {
  const updateInfo = await checkForUpdates();
  
  if (updateInfo.available) {
    // Kiểm tra xem đã thông báo người dùng về phiên bản này chưa
    const alreadyNotified = await wasUpdateNotified(updateInfo.newVersion || '');
    
    if (!alreadyNotified && updateInfo.newVersion) {
      // Tạo thông báo cho người dùng
      chrome.notifications.create('update-available', {
        type: 'basic',
        iconUrl: 'images/excel.webp',
        title: 'Có bản cập nhật mới!',
        message: `Phiên bản mới ${updateInfo.newVersion} đã sẵn sàng. Nhấp để cập nhật.`,
        priority: 2,
        buttons: [
          { title: 'Tải xuống' },
          { title: 'Xem chi tiết' }
        ]
      });
      
      // Lưu URL tải xuống và URL xem chi tiết
      chrome.storage.local.set({ 
        updateDownloadUrl: updateInfo.downloadUrl || '', 
        updateDetailsUrl: updateInfo.updateUrl || '' 
      });
      
      // Đánh dấu đã thông báo
      markUpdateNotified(updateInfo.newVersion);
    }
  }
}

// Xử lý khi người dùng nhấp vào thông báo
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'update-available') {
    // Trường hợp người dùng nhấp vào thông báo chính, mở trang tải xuống nếu có
    chrome.storage.local.get(['updateDownloadUrl', 'updateDetailsUrl'], (data) => {
      const url = data.updateDownloadUrl || data.updateDetailsUrl;
      if (url) {
        chrome.tabs.create({ url });
      } else {
        // Fallback nếu không có URL nào được lưu
        checkForUpdates().then(updateInfo => {
          if (updateInfo.updateUrl) {
            chrome.tabs.create({ url: updateInfo.updateUrl });
          }
        });
      }
    });
  }
});

// Xử lý khi người dùng nhấp vào các nút trong thông báo
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'update-available') {
    chrome.storage.local.get(['updateDownloadUrl', 'updateDetailsUrl'], (data) => {
      if (buttonIndex === 0) {
        // Nút "Tải xuống"
        const url = data.updateDownloadUrl || data.updateDetailsUrl;
        if (url) {
          chrome.tabs.create({ url });
        }
      } else if (buttonIndex === 1) {
        // Nút "Xem chi tiết"
        if (data.updateDetailsUrl) {
          chrome.tabs.create({ url: data.updateDetailsUrl });
        }
      }
    });
  }
});

// Xử lý khi menu ngữ cảnh được nhấp
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-full-page") {
    chrome.tabs.create({ url: "index.html" });
  }
});

// Lắng nghe các tin nhắn từ popup hoặc nội dung
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('Nhận tin nhắn:', message);
  
  // Xử lý tin nhắn từ Mellowtel
  if (message.type === 'MELLOWTEL_MESSAGE') {
    // Forward message to Mellowtel (if needed based on actual Mellowtel API)
    sendResponse({ status: 'ok' });
    return true;
  }
  
  // Xử lý tin nhắn khác
  if (message.type === 'OPEN_IN_TAB') {
    chrome.tabs.create({ url: 'index.html' });
    sendResponse({ status: 'ok' });
  } else if (message.type === 'COMPARISON_COMPLETED') {
    // Có thể xử lý dữ liệu hoặc gửi thông báo
    // console.log('Số khác biệt:', message.differences);
    sendResponse({ status: 'ok' });
  } else if (message.type === 'CHECK_FOR_UPDATES') {
    // Cho phép kiểm tra cập nhật theo yêu cầu
    scheduleUpdateCheck();
    sendResponse({ status: 'checking' });
  } else if (message.type === 'GET_MELLOWTEL_STATUS') {
    // Trả về trạng thái của Mellowtel (mock data for now)
    sendResponse({ 
      status: 'ok', 
      enabled: true, // mellowtel.isEnabled() when API is confirmed
      stats: {
        bandwidthShared: 0,
        earnings: 0,
        isActive: false,
        lastUpdate: new Date().toISOString() // Send as ISO string
      }
    });
  } else if (message.type === 'TOGGLE_MELLOWTEL') {
    // Bật/tắt Mellowtel (implement when API is confirmed)
    if (message.enabled) {
      mellowtel.start();
    } else {
      mellowtel.stop();
    }
    sendResponse({ status: 'ok', enabled: message.enabled });
  }
  
  // Trả về true để giữ kết nối mở cho phản hồi bất đồng bộ
  return true;
});

// Note: Chúng ta không sử dụng chrome.action.onClicked ở đây vì đã có default_popup trong manifest.json
// Khi có default_popup, sự kiện onClicked sẽ không được gọi

export {};
