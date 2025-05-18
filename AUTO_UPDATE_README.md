# Auto Update cho Extension So Sánh Hóa Đơn Excel

## Quy trình tự động hóa với GitHub Actions

Repository này đã được cấu hình để tự động build và release extension khi có commit mới được đẩy lên branch `master`. Quy trình hoạt động như sau:

1. Khi có commit mới vào branch `master`, GitHub Actions sẽ tự động kích hoạt.
2. Workflow sẽ:
   - Tăng phiên bản trong `package.json` và `manifest.json` tự động
   - Build extension
   - Tạo file ZIP chứa extension
   - Tạo một tag Git mới cho phiên bản
   - Tạo một GitHub Release mới với file ZIP đính kèm

## Yêu cầu cấu hình

Để workflow hoạt động, bạn cần đảm bảo:

1. Repository đã có Workflow file `.github/workflows/build-release.yml` (đã tích hợp)
2. Cấp quyền cho GitHub Actions:
   - Vào repository > Settings > Actions > General > Workflow permissions
   - Chọn "Read and write permissions"
   - Tích chọn "Allow GitHub Actions to create and approve pull requests"

## Cách người dùng cập nhật extension

1. Extension được cấu hình để kiểm tra phiên bản mới mỗi 2 ngày
2. Khi có phiên bản mới, extension sẽ hiển thị thông báo cho người dùng
3. Người dùng có thể:
   - Nhấp vào thông báo hoặc nút "Tải xuống" để tải trực tiếp file ZIP mới
   - Nhấp vào nút "Xem chi tiết" để xem thông tin chi tiết về bản cập nhật
4. Sau khi tải về, người dùng cần:
   - Giải nén file ZIP
   - Vào chrome://extensions/
   - Bật Developer Mode (Chế độ nhà phát triển)
   - Gỡ bỏ extension cũ (nếu đã cài)
   - Nhấp "Load unpacked" và chọn thư mục đã giải nén

## Troubleshooting

Nếu GitHub Actions không tạo được release:

1. Kiểm tra tab Actions trong GitHub để xem lỗi
2. Đảm bảo đã cấp đủ quyền cho GitHub Actions
3. Có thể cần tạo một Personal Access Token với quyền `repo` và thêm vào repository secrets
   - Tạo token tại Settings > Developer settings > Personal access tokens
   - Thêm token vào repository tại Settings > Secrets and variables > Actions với tên `GH_TOKEN`
   - Sửa workflow file để sử dụng token này

## Quy trình phát triển

1. Phát triển tính năng hoặc sửa lỗi trên branch riêng
2. Tạo Pull Request để merge vào `main`
3. Sau khi merge, GitHub Actions sẽ tự động:
   - Tăng phiên bản
   - Tạo release mới
   - Đẩy thay đổi phiên bản về repository

Không cần phải thay đổi phiên bản thủ công nữa!
