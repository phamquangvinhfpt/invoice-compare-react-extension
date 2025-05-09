import React from 'react';
import { DuplicatedItem } from '../services/comparisonService';

interface DuplicatedInvoiceTabProps {
  duplicatedItems: DuplicatedItem[];
  file1Name: string;
  file2Name: string;
}

const DuplicatedInvoiceTab: React.FC<DuplicatedInvoiceTabProps> = ({ 
  duplicatedItems,
  file1Name,
  file2Name 
}) => {
  // Nhóm các hóa đơn trùng lặp theo số hóa đơn
  const groupedDuplicates = duplicatedItems.reduce<Record<string, DuplicatedItem[]>>((acc, item) => {
    const key = item.key;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  // Render một nhóm hóa đơn trùng lặp
  const renderDuplicateGroup = (invoice: string, items: DuplicatedItem[], index: number) => (
    <div key={index} className="p-4 mb-3 bg-white border border-l-4 border-l-red-500 rounded-md shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-gray-800">Số hóa đơn: {invoice}</p>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
          {index + 1}/{Object.keys(groupedDuplicates).length}
        </span>
      </div>
      
      <div className="mt-2">
        <div className="flex items-center mb-2">
          <svg className="h-4 w-4 text-red-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-red-600">Tìm thấy {items.length} bản ghi trùng lặp</p>
        </div>
      </div>
      
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-md">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-2 border-b">File</th>
              <th className="px-4 py-2 border-b">Dòng</th>
              <th className="px-4 py-2 border-b">Người bán</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 text-sm">
                  {item.file1 !== null ? 
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {file1Name}
                    </span> : 
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {file2Name}
                    </span>
                  }
                </td>
                <td className="px-4 py-2 text-sm">{item.file1 ? item.file1.position : item.file2?.position}</td>
                <td className="px-4 py-2 text-sm">{item.file1 ? item.file1.seller : item.file2?.seller}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (Object.keys(groupedDuplicates).length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium">Không tìm thấy hóa đơn trùng lặp</p>
        <p className="text-sm mt-1">Tất cả các hóa đơn trong cả hai tệp đều là duy nhất.</p>
      </div>
    );
  }

  return (
    <div className="tab-content p-4">
      <div className="bg-red-50 p-4 mb-4 rounded-lg border border-red-200 text-red-800">
        <div className="flex items-center mb-2">
          <svg className="h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h3 className="font-semibold text-red-800">
            Phát hiện {Object.keys(groupedDuplicates).length} hóa đơn trùng lặp hoàn toàn
          </h3>
        </div>
        <p className="text-sm">
          Danh sách dưới đây hiển thị các hóa đơn xuất hiện nhiều lần trong một file với dữ liệu hoàn toàn giống nhau. Điều này có thể là dấu hiệu của dữ liệu trùng lặp cần được loại bỏ.
        </p>
      </div>
      
      <div className="max-h-96 overflow-y-auto w-full">
        {Object.entries(groupedDuplicates).map(([invoice, items], index) => 
          renderDuplicateGroup(invoice, items, index)
        )}
      </div>
      
      <div className="mt-3 py-3 px-4 bg-red-50 text-red-800 font-medium rounded-md text-center text-sm flex items-center justify-center">
        <svg className="h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 01-1 1H7a1 1 0 110-2h3a1 1 0 011 1z" clipRule="evenodd" />
        </svg>
        <p>Tổng số: {Object.keys(groupedDuplicates).length} hóa đơn trùng lặp, với tổng cộng {duplicatedItems.length} bản ghi hoàn toàn giống nhau</p>
      </div>
    </div>
  );
};

export default DuplicatedInvoiceTab;