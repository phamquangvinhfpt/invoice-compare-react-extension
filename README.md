# So Sánh Hóa Đơn Excel - Chrome Extension

Chrome Extension giúp so sánh số hóa đơn và thông tin người bán giữa hai file Excel. Dự án được xây dựng bằng React, TypeScript và TailwindCSS.

## Tính năng chính

- Tải lên 2 file Excel (.xlsx, .xls, .csv)
- So sánh số hóa đơn giữa hai file (tự động loại bỏ số 0 ở đầu khi so sánh)
- So sánh thông tin người bán cho các hóa đơn trùng số
- Hiển thị kết quả với giao diện rõ ràng, dễ sử dụng
- Xuất file Excel đã highlight các dòng có vấn đề:
  - Màu đỏ: Hóa đơn chỉ có ở một file (thiếu ở file còn lại)
  - Màu vàng: Hóa đơn có ở cả hai file nhưng thông tin người bán không khớp

## Cài đặt để phát triển

1. Clone repository:
```bash
git clone <url-repository>
cd invoice-compare-react-extension
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy ở chế độ phát triển:
```bash
npm start
```

4. Build extension:
```bash
npm run build
```

5. Sau khi build, thư mục `dist` sẽ chứa extension hoàn chỉnh. Bạn có thể tải nó lên Chrome bằng cách:
   - Mở Chrome, vào `chrome://extensions/`
   - Bật "Developer mode"
   - Nhấp "Load unpacked" và chọn thư mục `dist`

## Cách sử dụng

1. Nhấp vào icon extension trên Chrome
2. Tải lên cả hai file Excel cần so sánh
3. Nhập vị trí cột số hóa đơn và tên người bán cho từng file
4. Nhập dòng bắt đầu (dòng tiêu đề thường là dòng 1)
5. Nhấn nút "So Sánh" để xem kết quả
6. Sau khi có kết quả so sánh, nhấn nút "Tải Excel" để tải về file Excel với các dòng được đánh dấu màu

## Công nghệ sử dụng

- React
- TypeScript
- TailwindCSS
- ExcelJS
- Webpack
- Chrome Extension API

## Giấy phép

[MIT License](LICENSE)
