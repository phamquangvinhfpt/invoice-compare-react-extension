import React from 'react';

const InfoSection: React.FC = () => {
  return (
    <>
      {/* Alert/Note */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-6 my-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Lưu ý: Công cụ tự động loại bỏ số 0 ở đầu số hóa đơn khi so sánh. Nhập đúng vị trí cột và dòng bắt đầu cho từng file.
            </p>
          </div>
        </div>
      </div>
      
      {/* New Feature Alert */}
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mx-6 my-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">Tính năng:</span> Sau khi so sánh, nhấn nút <span className="font-medium">"Tải Excel"</span> để tải về cả hai file với định dạng gốc và các dòng được đánh dấu: <span className="text-red-600 font-medium">màu đỏ</span> cho Hóa Đơn Thiếu và <span className="text-yellow-600 font-medium">màu vàng</span> cho Người Bán Không Khớp.
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <h2 className="text-lg font-medium text-gray-800 mb-3">Hướng Dẫn Sử Dụng</h2>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-start mb-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="ml-3 text-sm text-gray-600">
              Để so sánh chính xác, vui lòng làm theo các bước sau:
            </p>
          </div>
          
          <ol className="ml-8 list-decimal space-y-2 text-sm text-gray-600">
            <li>Tải lên cả hai file Excel cần so sánh</li>
            <li>Nhập vị trí cột số hóa đơn và tên người bán theo đúng cấu trúc của từng file</li>
            <li>Nhập dòng bắt đầu (dòng tiêu đề thường là dòng 1)</li>
            <li>Nhấn nút "So Sánh" để xem kết quả</li>
            <li>Sau khi có kết quả so sánh, nhấn nút "Tải Excel" để tải về file Excel có các dòng được đánh dấu màu</li>
          </ol>
        </div>
      </div>

      <div className="text-center mt-4 pb-4 text-xs text-gray-500">
        © 2025 So Sánh Hóa Đơn Excel | Phiên bản 1.0
      </div>
    </>
  );
};

export default InfoSection;
