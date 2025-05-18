import React, { useEffect, useState } from 'react';
import { checkForUpdates, UpdateInfo } from '../../services/update/updateService';

const UpdateNotifier: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Kiểm tra cập nhật khi component được render
    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    setChecking(true);
    const info = await checkForUpdates();
    setUpdateInfo(info);
    setChecking(false);
  };

  const handleManualCheck = () => {
    checkUpdate();
    // Thông báo cho background script để có thể kiểm tra và hiển thị thông báo
    chrome.runtime.sendMessage({ type: 'CHECK_FOR_UPDATES' });
  };

  const openUpdatePage = () => {
    if (updateInfo?.updateUrl) {
      chrome.tabs.create({ url: updateInfo.updateUrl });
    }
  };

  const downloadUpdate = () => {
    if (updateInfo?.downloadUrl) {
      chrome.tabs.create({ url: updateInfo.downloadUrl });
    } else if (updateInfo?.updateUrl) {
      chrome.tabs.create({ url: updateInfo.updateUrl });
    }
  };

  if (!updateInfo) {
    return <div>Đang tải thông tin cập nhật...</div>;
  }

  return (
    <div className="p-3 border rounded-lg mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Thông tin phiên bản</h3>
        <button
          onClick={handleManualCheck}
          className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center"
          disabled={checking}
          title="Kiểm tra cập nhật thủ công"
        >
          {checking ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Đang kiểm tra</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Làm mới</span>
            </>
          )}
        </button>
      </div>
      
      <div className="text-sm">
        <p>Phiên bản hiện tại: <span className="font-medium">{updateInfo.currentVersion}</span></p>
        
        {updateInfo.available && updateInfo.newVersion && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">
              Có phiên bản mới: <span className="font-medium">{updateInfo.newVersion}</span>
            </p>
            {updateInfo.releaseNotes && (
              <p className="text-xs text-blue-700 mt-1">{updateInfo.releaseNotes}</p>
            )}
            <div className="flex gap-2 mt-2">
              {updateInfo.downloadUrl && (
                <button
                  onClick={downloadUpdate}
                  className="flex-1 text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải xuống
                </button>
              )}
              <button
                onClick={openUpdatePage}
                className="flex-1 text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Xem chi tiết
              </button>
            </div>
          </div>
        )}
        
        {!updateInfo.available && (
          <p className="mt-1 text-green-600 flex items-center">
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Bạn đang sử dụng phiên bản mới nhất.
          </p>
        )}
      </div>
    </div>
  );
};

export default UpdateNotifier;
