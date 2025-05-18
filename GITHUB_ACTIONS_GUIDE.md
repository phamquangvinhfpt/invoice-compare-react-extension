# Quy trình Auto-Update cho Extension So Sánh Hóa Đơn Excel

## Thiết lập GitHub Actions

Repository này sử dụng GitHub Actions để tự động hóa quá trình release extension khi có commit mới hoặc khi được kích hoạt thủ công. Dưới đây là hướng dẫn chi tiết để thiết lập và sử dụng:

### 1. Cấu trúc file cần thiết

- `.github/workflows/build-release.yml`: Workflow tự động chạy khi có commit vào branch master
- `.github/workflows/manual-release.yml`: Workflow có thể kích hoạt thủ công
- `scripts/version-bump.js`: Script tự động tăng phiên bản
- `src/services/update/updateService.ts`: Service kiểm tra cập nhật
- `src/components/UpdateNotifier`: Component hiển thị thông tin cập nhật
- `src/components/ManualUpdateChecker`: Component nút kiểm tra cập nhật thủ công

### 2. Quy trình hoạt động

1. Khi có commit mới vào branch master, GitHub Actions tự động kích hoạt workflow `build-release.yml`
2. Workflow sẽ:
   - Checkout code
   - Cài đặt dependencies
   - Chạy script tăng phiên bản
   - Build extension
   - Tạo file ZIP
   - Tạo tag Git cho phiên bản mới
   - Tạo GitHub Release với file ZIP đính kèm

### 3. Cấp quyền cho GitHub Actions

Để workflow hoạt động đúng, cần cấp quyền cho GitHub Actions:

1. Vào repository > Settings > Actions > General
2. Trong phần "Workflow permissions", chọn "Read and write permissions"
3. Tick "Allow GitHub Actions to create and approve pull requests"
4. Nhấn "Save"

### 4. Kích hoạt thủ công

Nếu muốn tạo release mà không cần commit mới:

1. Vào tab "Actions" trong repository
2. Chọn workflow "Manual Build and Release"
3. Nhấn "Run workflow"
4. Nhập mô tả cho bản cập nhật (nếu muốn)
5. Nhấn "Run workflow" để bắt đầu

### 5. Xử lý lỗi thường gặp

- **Workflow không chạy**: Kiểm tra cấu hình trong file `.github/workflows/*.yml`
- **Error: Permission denied**: Cần cấp quyền đọc/ghi như hướng dẫn ở mục 3
- **Error khi push tag hoặc tạo release**: Có thể cần tạo Personal Access Token và thêm vào repository secrets

### 6. Tạo Personal Access Token (nếu cần)

Nếu gặp lỗi về quyền khi push tag hoặc tạo release:

1. Vào GitHub > Settings > Developer settings > Personal access tokens > Generate new token
2. Chọn quyền "repo" và tạo token
3. Thêm token này vào repository: Repository Settings > Secrets and variables > Actions > New repository secret với tên `GH_PAT`
4. Cập nhật workflow để sử dụng token này thay vì `GITHUB_TOKEN` mặc định

## Cách người dùng nhận cập nhật

1. Extension tự động kiểm tra cập nhật mỗi 2 ngày
2. Khi có cập nhật mới, Extension sẽ hiển thị thông báo
3. Người dùng có thể nhấp vào thông báo hoặc nút trong extension để tải xuống
4. Sau khi tải về, người dùng cài đặt extension mới qua Developer Mode
