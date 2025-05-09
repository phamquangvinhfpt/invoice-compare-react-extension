// Service worker cho Chrome Extension

// Xử lý sự kiện khi extension được cài đặt
chrome.runtime.onInstalled.addListener(() => {  
  // Tạo menu ngữ cảnh cho extension
  chrome.contextMenus.create({
    id: "open-full-page",
    title: "Mở toàn màn hình",
    contexts: ["action"] // Hiển thị khi nhấp chuột phải vào icon extension
  });
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
  
  // Xử lý tin nhắn
  if (message.type === 'OPEN_IN_TAB') {
    chrome.tabs.create({ url: 'index.html' });
    sendResponse({ status: 'ok' });
  } else if (message.type === 'COMPARISON_COMPLETED') {
    // Có thể xử lý dữ liệu hoặc gửi thông báo
    // console.log('Số khác biệt:', message.differences);
    sendResponse({ status: 'ok' });
  }
  
  // Trả về true để giữ kết nối mở cho phản hồi bất đồng bộ
  return true;
});

// Note: Chúng ta không sử dụng chrome.action.onClicked ở đây vì đã có default_popup trong manifest.json
// Khi có default_popup, sự kiện onClicked sẽ không được gọi

export {};
