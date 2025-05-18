import React, { useState } from 'react';
import { checkForUpdates } from '../../services/update/updateService';

const ManualUpdateChecker: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ message: string; type: 'success' | 'info' | 'error' | null }>({
    message: '',
    type: null
  });

  const handleCheckUpdate = async () => {
    setChecking(true);
    setResult({ message: 'Đang kiểm tra cập nhật...', type: 'info' });
    
    try {
      // Thông báo cho background script kiểm tra cập nhật
      chrome.runtime.sendMessage({ type: 'CHECK_FOR_UPDATES' });
      
      // Kiểm tra trực tiếp
      const updateInfo = await checkForUpdates();
      
      if (updateInfo.available) {
        setResult({
          message: `Có phiên bản mới ${updateInfo.newVersion} sẵn sàng cập nhật!`,
          type: 'success'
        });
      } else {
        setResult({
          message: 'Bạn đang sử dụng phiên bản mới nhất.',
          type: 'success'
        });
      }
    } catch (error) {
      setResult({
        message: `Không thể kiểm tra cập nhật: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        type: 'error'
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-2 mb-4">
      <button
        onClick={handleCheckUpdate}
        disabled={checking}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {checking ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang kiểm tra...
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Kiểm tra cập nhật
          </>
        )}
      </button>
      
      {result.type && (
        <div 
          className={`mt-2 text-sm ${
            result.type === 'success' ? 'text-green-600' : 
            result.type === 'error' ? 'text-red-600' : 
            'text-blue-600'
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
};

export default ManualUpdateChecker;
