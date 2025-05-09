import React, { useState, useRef, useEffect } from 'react';
import { Workbook } from 'exceljs';
import FileContainer from './FileContainer';
import CompareButton from './CompareButton';
import ResultsDisplay from './ResultsDisplay';
import InfoSection from './InfoSection';
import { FileSettingsValues } from './FileSettings';
import { showNotification } from '../services/notificationService';
import { 
  readExcelFile, 
  workbookToArray, 
  createAndDownloadZip 
} from '../services/excelService';
import { 
  extractInvoiceData, 
  validateInput, 
  compareInvoiceData,
  ComparisonResult
} from '../services/comparisonService';

import '../styles/global.css';

const App: React.FC = () => {
  // State cho file và dữ liệu
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [file1Data, setFile1Data] = useState<any[][] | null>(null);
  const [file2Data, setFile2Data] = useState<any[][] | null>(null);
  const [file1Workbook, setFile1Workbook] = useState<Workbook | null>(null);
  const [file2Workbook, setFile2Workbook] = useState<Workbook | null>(null);
  
  // State cho cài đặt file
  const [file1Settings, setFile1Settings] = useState<FileSettingsValues>({
    invoiceCol: 1,
    sellerCol: 2,
    startRow: 1
  });
  const [file2Settings, setFile2Settings] = useState<FileSettingsValues>({
    invoiceCol: 1,
    sellerCol: 2,
    startRow: 1
  });
  
  // State cho kết quả so sánh
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Kiểm tra xem đang chạy trong tab riêng hay không
  const [isFullPage, setIsFullPage] = useState(false);
  
  useEffect(() => {
    // Kiểm tra xem đang ở trong popup hay tab đầy đủ
    setIsFullPage(window.location.pathname.includes('index.html'));
  }, []);
  
  // Ref để scroll đến kết quả
  const resultsRef = useRef<HTMLDivElement>(null);

  // Xử lý đọc file 1
  const handleFile1Loaded = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = await readExcelFile(arrayBuffer);
      const data = workbookToArray(workbook);
      
      setFile1(file);
      setFile1Workbook(workbook);
      setFile1Data(data);
      
      showNotification({
        message: `Đã đọc thành công file "${file.name}" với ${data.length} dòng dữ liệu`,
        type: 'success'
      });
    } catch (error) {
      console.error('Lỗi khi đọc file Excel:', error);
      showNotification({
        message: `Không thể đọc file Excel. Lỗi: ${error instanceof Error ? error.message : 'Không xác định'}`,
        type: 'error'
      });
    }
  };

  // Xử lý đọc file 2
  const handleFile2Loaded = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = await readExcelFile(arrayBuffer);
      const data = workbookToArray(workbook);
      
      setFile2(file);
      setFile2Workbook(workbook);
      setFile2Data(data);
      
      showNotification({
        message: `Đã đọc thành công file "${file.name}" với ${data.length} dòng dữ liệu`,
        type: 'success'
      });
    } catch (error) {
      console.error('Lỗi khi đọc file Excel:', error);
      showNotification({
        message: `Không thể đọc file Excel. Lỗi: ${error instanceof Error ? error.message : 'Không xác định'}`,
        type: 'error'
      });
    }
  };

  // Hàm so sánh file
  const handleCompare = async () => {
    if (!file1Data || !file2Data || !file1 || !file2) {
      showNotification({
        message: 'Vui lòng tải lên cả hai file trước khi so sánh',
        type: 'error'
      });
      return;
    }
    
    setIsComparing(true);

    try {
      // Lấy thông số cấu hình
      const file1InvoiceCol = file1Settings.invoiceCol - 1;
      const file1StartRow = file1Settings.startRow - 1;
      const file1SellerCol = file1Settings.sellerCol - 1;
      
      const file2InvoiceCol = file2Settings.invoiceCol - 1;
      const file2StartRow = file2Settings.startRow - 1;
      const file2SellerCol = file2Settings.sellerCol - 1;
      
      // Kiểm tra dữ liệu đầu vào
      if (!validateInput(file1InvoiceCol, file1StartRow, file1SellerCol, file1Data)) {
        showNotification({
          message: 'Cấu hình File 1 không hợp lệ. Vui lòng kiểm tra lại.',
          type: 'error'
        });
        setIsComparing(false);
        return;
      }
      
      if (!validateInput(file2InvoiceCol, file2StartRow, file2SellerCol, file2Data)) {
        showNotification({
          message: 'Cấu hình File 2 không hợp lệ. Vui lòng kiểm tra lại.',
          type: 'error'
        });
        setIsComparing(false);
        return;
      }
      
      // So sánh dữ liệu
      const results = compareInvoiceData(
        file1Data,
        file2Data,
        file1StartRow,
        file1InvoiceCol,
        file1SellerCol,
        file2StartRow,
        file2InvoiceCol,
        file2SellerCol
      );
      setComparisonResults(results);
      setShowResults(true);
      
      // Hiển thị thông báo
      const totalDifferences = results.missingInFile1.length + results.missingInFile2.length + results.mismatchedSellers.length;
      
      showNotification({
        message: `So sánh hoàn tất! Đã tìm thấy ${totalDifferences} khác biệt.`,
        type: 'success'
      });
      
      // Cuộn xuống kết quả
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
    } catch (error) {
      console.error('Lỗi khi so sánh file:', error);
      showNotification({
        message: `Lỗi khi so sánh: ${error instanceof Error ? error.message : 'Không xác định'}`,
        type: 'error'
      });
    } finally {
      setIsComparing(false);
    }
  };

  // Xử lý tải xuống Excel
  const handleDownloadExcel = async () => {
    if (!file1Workbook || !file2Workbook || !file1 || !file2 || !comparisonResults) {
      showNotification({
        message: 'Không có dữ liệu để tải xuống',
        type: 'error'
      });
      return;
    }
    
    try {
      showNotification({
        message: 'Đang chuẩn bị file Excel, vui lòng đợi...',
        type: 'info'
      });
      
      // Chuẩn bị dữ liệu cho highlight
      const file1MissingRows = comparisonResults.missingInFile2.map(item => item.row);
      const file2MissingRows = comparisonResults.missingInFile1.map(item => item.row);
      
      const file1MismatchRows = comparisonResults.mismatchedSellers.map(item => item.file1.row);
      const file2MismatchRows = comparisonResults.mismatchedSellers.map(item => item.file2.row);
      
      const file1DuplicatedRows = comparisonResults.duplicatedItems
        .filter(item => item.file1 !== null)
        .map(item => item.file1!.row);
      const file2DuplicatedRows = comparisonResults.duplicatedItems
        .filter(item => item.file2 !== null)
        .map(item => item.file2!.row);
      
      // Tạo và tải xuống file ZIP với Excel đã highlight
      await createAndDownloadZip(
        file1Workbook,
        file2Workbook,
        file1.name,
        file2.name,
        file2MissingRows,
        file1MissingRows,
        file1MismatchRows,
        file2MismatchRows,
        file1DuplicatedRows,
        file2DuplicatedRows
      );
      
      showNotification({
        message: 'Đã tải xuống file Excel thành công!',
        type: 'success'
      });
      
    } catch (error) {
      console.error('Lỗi khi tải file Excel:', error);
      showNotification({
        message: `Lỗi khi tạo file Excel: ${error instanceof Error ? error.message : 'Không xác định'}`,
        type: 'error'
      });
    }
  };

  return (
    <div className={`${isFullPage ? 'max-w-6xl' : 'max-w-4xl'} mx-auto p-5 my-4`}>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
          <h1 className="text-2xl font-bold text-white text-center">So Sánh Hóa Đơn Excel</h1>
          <p className="text-blue-100 text-sm text-center mt-2">Công cụ so sánh số hóa đơn và thông tin người bán</p>
          {!isFullPage && (
            <div className="flex justify-end mt-1">
              <button 
                className="text-xs text-blue-100 hover:text-white flex items-center"
                onClick={() => {
                  chrome.runtime.sendMessage({ type: 'OPEN_IN_TAB' });
                }}
              >
                <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Mở trong tab mới
              </button>
            </div>
          )}
        </div>
        
        {/* Info section */}
        <InfoSection />
        
        {/* Upload Section */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileContainer 
            index={1}
            onFileLoaded={handleFile1Loaded}
            settings={file1Settings}
            onSettingsChange={setFile1Settings}
          />
          
          <FileContainer 
            index={2}
            onFileLoaded={handleFile2Loaded}
            settings={file2Settings}
            onSettingsChange={setFile2Settings}
          />
        </div>
        
        {/* Compare Button */}
        <CompareButton
          onClick={handleCompare}
          disabled={!file1Data || !file2Data}
          isLoading={isComparing}
        />
        
        {/* Results Section */}
        <div ref={resultsRef}>
          {showResults && comparisonResults && (
            <ResultsDisplay 
              results={comparisonResults}
              onDownload={handleDownloadExcel}
              file1Workbook={file1Workbook}
              file2Workbook={file2Workbook}
              file1Name={file1?.name || 'file1.xlsx'}
              file2Name={file2?.name || 'file2.xlsx'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
