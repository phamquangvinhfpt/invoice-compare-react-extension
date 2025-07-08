import React, { useState, useRef, useEffect } from 'react';
import { Workbook } from 'exceljs';
import FileContainer from './FileContainer';
import CompareButton from './CompareButton';
import ResultsDisplay from './ResultsDisplay';
import InfoSection from './InfoSection';
import UpdateNotifier from './UpdateNotifier';
import MellowtelSettings from './MellowtelSettings';
import { FileSettingsValues } from './FileSettings';
import { showNotification } from '../services/notificationService';
import {
  readExcelFile,
  workbookToArray,
  createAndDownloadZip
} from '../services/excelService';
import {
  validateInput,
  compareInvoiceData,
  ComparisonResult,
  isNumber
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
    taxCodeCol: 3,
    netPriceCol: 4,
    startRow: 1
  });
  const [file2Settings, setFile2Settings] = useState<FileSettingsValues>({
    invoiceCol: 1,
    sellerCol: 2,
    taxCodeCol: 3,
    netPriceCol: 4,
    startRow: 1
  });

  // State cho kết quả so sánh
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // State cho tùy chọn so sánh netPrice
  const [enableNetPriceComparison, setEnableNetPriceComparison] = useState(true);

  // State cho Mellowtel
  const [showMellowtelSettings, setShowMellowtelSettings] = useState(false);

  // Kiểm tra xem đang chạy trong tab riêng hay không
  const [isFullPage, setIsFullPage] = useState(false);

  useEffect(() => {
    // Kiểm tra xem đang ở trong popup hay tab đầy đủ
    setIsFullPage(window.location.pathname.includes('index.html'));

    // Kiểm tra nếu là first install và chưa opt-in thì tự động hiện Mellowtel settings
    chrome.runtime.sendMessage({ type: 'CHECK_MELLOWTEL_OPTIN' }, (response) => {
      if (response && response.firstInstall && !response.hasOptedIn) {
        // Delay một chút để UI load xong
        setTimeout(() => {
          setShowMellowtelSettings(true);
        }, 1000);
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        setShowMellowtelSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
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
      // console.log(data)

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
      // console.log(data)

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
      const file1TaxCodeCol = file1Settings.taxCodeCol - 1;
      const file1NetPriceCol = file1Settings.netPriceCol - 1;

      const file2InvoiceCol = file2Settings.invoiceCol - 1;
      const file2StartRow = file2Settings.startRow - 1;
      const file2SellerCol = file2Settings.sellerCol - 1;
      const file2TaxCodeCol = file2Settings.taxCodeCol - 1;
      const file2NetPriceCol = file2Settings.netPriceCol - 1;

      // Kiểm tra dữ liệu đầu vào
      if (!validateInput(file1InvoiceCol, file1StartRow, file1SellerCol, file1TaxCodeCol, file1NetPriceCol, file1Data)) {
        showNotification({
          message: 'Cấu hình File 1 không hợp lệ. Vui lòng kiểm tra lại.',
          type: 'error'
        });
        setIsComparing(false);
        return;
      }

      if (!validateInput(file2InvoiceCol, file2StartRow, file2SellerCol, file2TaxCodeCol, file2NetPriceCol, file2Data)) {
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
        file1TaxCodeCol,
        file1NetPriceCol,
        file2StartRow,
        file2InvoiceCol,
        file2SellerCol,
        file2TaxCodeCol,
        file2NetPriceCol,
        enableNetPriceComparison
      );
      // Loại bỏ các mã trùng nhau chỉ khi file có nhiều hơn 1 mã MST, Chỉ lọc bỏ các mã trùng nếu file đó có nhiều hơn 1 mã vd: file1 có 3 mã MST, file2 có 2 mã MST mà trong đó 2 mã MST của file1 trùng với 2 mã MST của file2 vừa trùng mst lại trùng số hóa đơn thì loại bỏ khỏi file1
      const filteredMismatchedSellers = results.mismatchedSellers.map((item: any) => {
        const file1 = item.file1;
        const file2 = item.file2;

        if (!file1 || !file2) {
          return item; // Giữ nguyên nếu không có file1 hoặc file2
        }

        // Lọc file1 để loại bỏ các hóa đơn vừa trùng số vừa trùng MST với file2
        const filteredFile1 = file1.filter((inv1: any) => {
          // Kiểm tra xem hóa đơn có trùng số với bất kỳ hóa đơn nào trong file2 không
          const hasMatchingInvoice = file2.some((inv2: any) =>
            String(inv1.invoiceOriginal).replace(/^0+/, '') === String(inv2.invoiceOriginal).replace(/^0+/, '') && inv1.taxCode === inv2.taxCode
          );

          // Giữ lại hóa đơn nếu: không trùng số, hoặc trùng số nhưng khác MST

          return !hasMatchingInvoice;
        });

        // Tương tự cho file2 nếu cần
        const filteredFile2 = file2.filter((inv2: any) => {
          // Kiểm tra xem hóa đơn có trùng số với bất kỳ hóa đơn nào trong file1 không
          const hasMatchingInvoice = file1.some((inv1: any) =>
            String(inv2.invoiceOriginal).replace(/^0+/, '') === String(inv1.invoiceOriginal).replace(/^0+/, '') && inv2.taxCode === inv1.taxCode
          );

          // Giữ lại hóa đơn nếu: không trùng số, hoặc trùng số nhưng khác MST
          return !hasMatchingInvoice;
        });

        return {
          ...item,
          file1: filteredFile1,
          file2: filteredFile2
        };
      }).filter((item: any) => {
        // Loại bỏ các mục không còn hóa đơn nào sau khi lọc
        return (item.file1 && item.file1.length > 0) || (item.file2 && item.file2.length > 0);
      });

      const filteredResults = {
        ...results,
        mismatchedSellers: filteredMismatchedSellers
      };
      console.log('Kết quả so sánh:', filteredResults.mismatchedSellers);
      setComparisonResults(filteredResults);
      setShowResults(true);

      // Hiển thị thông báo
      // Tính tổng các khác biệt
      const totalMismatches = results.missingInFile1.length +
        results.missingInFile2.length +
        results.mismatchedSellers.length;

      // Đếm số hóa đơn trùng lặp thực sự (chỉ số)
      const duplicatedItemsCount = Object.keys(
        results.duplicatedItems
          .filter(item => /^\d+$/.test(item.key))
          .reduce<Record<string, boolean>>((acc, item) => {
            acc[item.key] = true;
            return acc;
          }, {})
      ).length;

      // const totalDifferences = totalMismatches + duplicatedItemsCount;

      showNotification({
        message: `So sánh hoàn tất! Đã tìm thấy ${totalMismatches} khác biệt và ${duplicatedItemsCount} hóa đơn trùng lặp.`,
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

      // Chỉ xử lý các trường hợp mismatchedSellers có giá trị hợp lệ
      const file1MismatchRows = comparisonResults.mismatchedSellers
        .filter(item => item && item.file1 && Array.isArray(item.file1))
        .flatMap(item => item.file1.map(inv => inv.row));

      const file2MismatchRows = comparisonResults.mismatchedSellers
        .filter(item => item && item.file2 && Array.isArray(item.file2))
        .flatMap(item => item.file2.map(inv => inv.row));

      // Lọc các mục trùng lặp có giá trị hợp lệ
      const file1DuplicatedRows = comparisonResults.duplicatedItems
        .filter(item => item.file1 !== null && isNumber(item.key))
        .map(item => item.file1!.row);

      const file2DuplicatedRows = comparisonResults.duplicatedItems
        .filter(item => item.file2 !== null && isNumber(item.key))
        .map(item => item.file2!.row);

      // In ra log để debug
      // console.log('Highlight info:');
      // console.log('File 1 Missing Rows:', file1MissingRows.length);
      // console.log('File 2 Missing Rows:', file2MissingRows.length);
      // console.log('File 1 Mismatch Rows:', file1MismatchRows.length);
      // console.log('File 2 Mismatch Rows:', file2MismatchRows.length);
      // console.log('File 1 Duplicated Rows:', file1DuplicatedRows.length);
      // console.log('File 2 Duplicated Rows:', file2DuplicatedRows.length);

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
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white text-center">So Sánh Hóa Đơn Excel</h1>
              <p className="text-blue-100 text-sm text-center mt-2">Công cụ so sánh số hóa đơn và thông tin người bán</p>
            </div>
            <button
              onClick={() => setShowMellowtelSettings(true)}
              className="text-white hover:text-gray-200 p-2 rounded-md hover:bg-white hover:bg-opacity-10 transition-colors ml-4"
              title="Mellowtel Bandwidth Sharing Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
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

        {/* Update Notifier - Hiển thị thông tin phiên bản */}
        <div className="px-6 py-2">
          <UpdateNotifier />
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

        {/* NetPrice Comparison Option */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableNetPriceComparison}
                onChange={(e) => setEnableNetPriceComparison(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Bật so sánh doanh số chưa thuế (tìm hóa đơn có giá gấp đôi)
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Khi bật, hệ thống sẽ tìm các hóa đơn có cùng số và người bán nhưng doanh số chưa thuế của một bên gấp đôi bên kia
          </p>
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

      {/* Mellowtel Settings Modal */}
      <MellowtelSettings
        isOpen={showMellowtelSettings}
        onClose={() => setShowMellowtelSettings(false)}
      />
    </div>
  );
};

export default App;
