import React, { useState } from 'react';
import { Workbook } from 'exceljs';
import { createAndDownloadCleanZip } from '../services/cleanExcelService';

interface CleanExcelButtonProps {
  file1Workbook: Workbook | null;
  file2Workbook: Workbook | null;
  file1Name: string;
  file2Name: string;
  missingInFile1: number[];
  missingInFile2: number[];
  mismatchedRowsFile1: number[];
  mismatchedRowsFile2: number[];
  isDisabled: boolean;
}

const CleanExcelButton: React.FC<CleanExcelButtonProps> = ({
  file1Workbook,
  file2Workbook,
  file1Name,
  file2Name,
  missingInFile1,
  missingInFile2,
  mismatchedRowsFile1,
  mismatchedRowsFile2,
  isDisabled
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!file1Workbook || !file2Workbook) {
      alert('Vui lòng chọn cả hai file Excel trước khi xuất');
      return;
    }

    setIsLoading(true);
    
    try {
      // Sử dụng phương pháp highlight sạch
      await createAndDownloadCleanZip(
        file1Workbook,
        file2Workbook,
        file1Name,
        file2Name,
        missingInFile1,
        missingInFile2,
        mismatchedRowsFile1,
        mismatchedRowsFile2
      );
      
      alert('Đã tạo file Excel với phương pháp mới thành công!');
    } catch (error) {
      console.error('Lỗi khi tạo file Excel:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không xác định'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="ml-2 px-3 py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-md flex items-center shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleClick}
      disabled={isDisabled || isLoading}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang tạo...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tạo Excel (Giữ định dạng)
        </>
      )}
    </button>
  );
};

export default CleanExcelButton;
