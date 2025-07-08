// Service worker cho Chrome Extension
import {
  checkForUpdates,
  markUpdateNotified,
  wasUpdateNotified,
} from "../services/update/updateService";
import Mellowtel from "mellowtel";

// Khởi tạo Mellowtel theo tài liệu chính thức
let mellowtel: Mellowtel;

(async () => {
  mellowtel = new Mellowtel("YOUR_CONFIGURATION_KEY"); // Replace with your configuration key
  await mellowtel.initBackground();
})();

// Khởi tạo khoảng thời gian kiểm tra cập nhật (2 ngày = 172800000 ms)
const UPDATE_CHECK_INTERVAL = 172800000;

// Function để generate settings link theo tài liệu
async function openSettings() {
  try {
    // Generate và mở settings link cho user
    const settingsLink = await mellowtel.generateSettingsLink();
    console.log("Generated Settings Link:", settingsLink);

    // Mở settings link trong tab mới
    await chrome.tabs.create({
      url: settingsLink,
      active: true,
    });

    console.log("Mellowtel settings opened:", settingsLink);

    // Tạo notification để hướng dẫn user
    chrome.notifications.create("mellowtel-settings-opened", {
      type: "basic",
      iconUrl: "images/excel.webp",
      title: "Mellowtel Settings",
      message:
        "Please complete the settings in the new tab to enable bandwidth sharing.",
      priority: 2,
    });
  } catch (error) {
    console.error("Error generating settings link:", error);

    // Fallback notification
    chrome.notifications.create("mellowtel-settings-error", {
      type: "basic",
      iconUrl: "images/excel.webp",
      title: "Mellowtel Setup",
      message: "Unable to open settings. Please try again later.",
      priority: 1,
    });
  }
}

// Xử lý sự kiện khi extension được cài đặt - theo tài liệu Mellowtel
chrome.runtime.onInstalled.addListener(async function (details) {
  console.log("Extension Installed or Updated");

  // Tạo menu ngữ cảnh cho extension
  chrome.contextMenus.create({
    id: "open-full-page",
    title: "Mở toàn màn hình",
    contexts: ["action"],
  });

  // Kiểm tra cập nhật khi extension được cài đặt hoặc cập nhật
  scheduleUpdateCheck();

  // Thiết lập kiểm tra cập nhật định kỳ
  chrome.alarms.create("checkForUpdates", {
    periodInMinutes: UPDATE_CHECK_INTERVAL / (60 * 1000),
  });

  // Theo yêu cầu: khi install ứng dụng mở Generate settings link để accept luôn
  if (details.reason === "install") {
    console.log("🎉 First time installation - opening Mellowtel settings");

    // Lưu trạng thái cài đặt lần đầu
    await chrome.storage.local.set({
      mellowtelFirstInstall: true,
      installTimestamp: Date.now(),
    });

    // Tự động mở settings link sau khi cài đặt (delay để đảm bảo extension load hoàn toàn)
    setTimeout(async () => {
      try {
        console.log("🚀 Auto-opening Mellowtel settings...");
        await openSettings();
      } catch (error) {
        console.error("Failed to auto-open settings:", error);
      }
    }, 2000);
  } else if (details.reason === "update") {
    console.log("Extension updated from version:", details.previousVersion);
    // Có thể mở settings để cập nhật cấu hình nếu cần
    // await openSettings();
  }
});

// Lắng nghe sự kiện báo thức để kiểm tra cập nhật
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkForUpdates") {
    scheduleUpdateCheck();
  }
});

// Hàm kiểm tra cập nhật
async function scheduleUpdateCheck() {
  const updateInfo = await checkForUpdates();

  if (updateInfo.available) {
    const alreadyNotified = await wasUpdateNotified(
      updateInfo.newVersion || ""
    );

    if (!alreadyNotified && updateInfo.newVersion) {
      chrome.notifications.create("update-available", {
        type: "basic",
        iconUrl: "images/excel.webp",
        title: "Có bản cập nhật mới!",
        message: `Phiên bản mới ${updateInfo.newVersion} đã sẵn sàng. Nhấp để cập nhật.`,
        priority: 2,
        buttons: [{ title: "Tải xuống" }, { title: "Xem chi tiết" }],
      });

      chrome.storage.local.set({
        updateDownloadUrl: updateInfo.downloadUrl || "",
        updateDetailsUrl: updateInfo.updateUrl || "",
      });

      markUpdateNotified(updateInfo.newVersion);
    }
  }
}

// Xử lý khi người dùng nhấp vào thông báo
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === "update-available") {
    chrome.storage.local.get(
      ["updateDownloadUrl", "updateDetailsUrl"],
      (data) => {
        const url = data.updateDownloadUrl || data.updateDetailsUrl;
        if (url) {
          chrome.tabs.create({ url });
        } else {
          checkForUpdates().then((updateInfo) => {
            if (updateInfo.updateUrl) {
              chrome.tabs.create({ url: updateInfo.updateUrl });
            }
          });
        }
      }
    );
  }

  // Xử lý các notification liên quan đến Mellowtel settings
  if (
    notificationId === "mellowtel-settings-opened" ||
    notificationId === "mellowtel-settings-error"
  ) {
    // Mở lại settings nếu cần
    openSettings().catch((error) => {
      console.error("Error reopening settings:", error);
      // Fallback: mở extension popup
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
    });
  }
});

// Xử lý khi người dùng nhấp vào các nút trong thông báo
chrome.notifications.onButtonClicked.addListener(
  (notificationId, buttonIndex) => {
    if (notificationId === "update-available") {
      chrome.storage.local.get(
        ["updateDownloadUrl", "updateDetailsUrl"],
        (data) => {
          if (buttonIndex === 0) {
            // Nút "Tải xuống"
            const url = data.updateDownloadUrl || data.updateDetailsUrl;
            if (url) chrome.tabs.create({ url });
          } else if (buttonIndex === 1) {
            // Nút "Xem chi tiết"
            if (data.updateDetailsUrl)
              chrome.tabs.create({ url: data.updateDetailsUrl });
          }
        }
      );
    }
  }
);

// Xử lý khi menu ngữ cảnh được nhấp
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-full-page") {
    chrome.tabs.create({ url: "index.html" });
  }
});

// Lắng nghe các tin nhắn từ popup hoặc content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Received message:", message.type);

  if (message.type === "OPEN_IN_TAB") {
    chrome.tabs.create({ url: "index.html" });
    sendResponse({ status: "ok" });
  } else if (message.type === "COMPARISON_COMPLETED") {
    sendResponse({ status: "ok" });
  } else if (message.type === "CHECK_FOR_UPDATES") {
    scheduleUpdateCheck();
    sendResponse({ status: "checking" });
  } else if (message.type === "OPEN_MELLOWTEL_SETTINGS") {
    // Mở Mellowtel settings
    openSettings()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    return true;
  } else if (message.type === "CHECK_MELLOWTEL_OPTIN") {
    // Check opt-in status
    chrome.storage.local.get(["mellowtelFirstInstall"], (result) => {
      sendResponse({
        hasOptedIn: false, // Will be determined by Mellowtel settings page
        firstInstall: result.mellowtelFirstInstall || false,
      });
    });
    return true;
  }

  // Trả về true để giữ kết nối mở cho phản hồi bất đồng bộ
  return true;
});

export {};
