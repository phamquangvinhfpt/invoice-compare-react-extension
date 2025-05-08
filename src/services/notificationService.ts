export type NotificationType = 'success' | 'error' | 'info';

interface NotificationOptions {
  message: string;
  type: NotificationType;
  duration?: number;
}

/**
 * Hiển thị thông báo trên giao diện người dùng
 * @param options Tùy chọn thông báo
 */
export const showNotification = (options: NotificationOptions): void => {
  const { message, type, duration = 5000 } = options;
  
  // Kiểm tra nếu đã có thông báo cũ, xóa đi
  const existingNotification = document.querySelector('.notification-container');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Tạo container thông báo
  const notificationContainer = document.createElement('div');
  notificationContainer.className = 'notification-container';
  
  // Tạo thông báo
  const notification = document.createElement('div');
  notification.className = `notification-${type}`;
  
  // Icon thông báo
  let icon = '';
  if (type === 'error') {
    icon = `<svg class="h-5 w-5 text-red-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>`;
  } else if (type === 'success') {
    icon = `<svg class="h-5 w-5 text-green-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>`;
  } else {
    icon = `<svg class="h-5 w-5 text-blue-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>`;
  }
  
  notification.innerHTML = `
    <div class="flex-shrink-0">
      ${icon}
    </div>
    <div class="flex-1 ml-3">
      <p class="text-sm font-medium">${message}</p>
    </div>
    <button class="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none">
      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  // Thêm vào container
  notificationContainer.appendChild(notification);
  document.body.appendChild(notificationContainer);
  
  // Xử lý sự kiện đóng thông báo
  const closeButton = notification.querySelector('button');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      notificationContainer.remove();
    });
  }
  
  // Tự động đóng sau duration mili giây
  setTimeout(() => {
    if (document.body.contains(notificationContainer)) {
      notificationContainer.remove();
    }
  }, duration);
};
