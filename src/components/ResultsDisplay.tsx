import React, { useState } from 'react';
import { ComparisonResult, InvoiceItem, MismatchedSellerItem } from '../services/comparisonService';
import CleanExcelButton from './CleanExcelButton';
import DuplicatedInvoiceTab from './DuplicatedInvoiceTab';

interface ResultsDisplayProps {
  results: ComparisonResult | null;
  onDownload: () => void;
  file1Workbook: any | null;
  file2Workbook: any | null;
  file1Name: string;
  file2Name: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  results, 
  onDownload, 
  file1Workbook, 
  file2Workbook, 
  file1Name, 
  file2Name 
}) => {
  const [activeTab, setActiveTab] = useState<'missing' | 'mismatched' | 'duplicated'>('missing');

  if (!results) {
    return null;
  }

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
  
  const totalDifferences = totalMismatches + duplicatedItemsCount;

  // Thành phần hiển thị các hóa đơn thiếu
  const renderMissingInvoice = (item: InvoiceItem, index: number) => (
    <div key={index} className="p-3 mb-2 bg-white border border-gray-200 rounded-md shadow-sm">
      <p className="font-semibold text-gray-800">Số hóa đơn: {item.invoiceOriginal}</p>
      <p className="text-gray-600 text-sm mt-1">Người bán: {item.seller}</p>
      <p className="text-gray-500 text-xs mt-1">Dòng: {item.position}</p>
    </div>
  );

  // Thành phần hiển thị các hóa đơn không khớp người bán
  const renderMismatchedSeller = (item: MismatchedSellerItem, index: number) => {
    // Kiểm tra xem có data từ cả hai file không
    if (!item.file1 || !item.file1.length || !item.file2 || !item.file2.length) {
      return null;
    }
    
    // Lấy tất cả mã số thuế từ file 1
    const file1TaxCodes = item.file1.map(f => f.taxCode).filter(Boolean);
    
    // Lấy tất cả mã số thuế từ file 2
    const file2TaxCodes = item.file2.map(f => f.taxCode).filter(Boolean);
    
    // Loại bỏ các mã trùng nhau chỉ khi file có nhiều hơn 1 mã MST
    let taxCodesToShowInFile1 = file1TaxCodes;
    let taxCodesToShowInFile2 = file2TaxCodes;
    
    // Chỉ lọc bỏ các mã trùng nếu file đó có nhiều hơn 1 mã
    if (file1TaxCodes.length > 1) {
      taxCodesToShowInFile1 = file1TaxCodes.filter(taxCode => !file2TaxCodes.includes(taxCode));
    }
    
    if (file2TaxCodes.length > 1) {
      taxCodesToShowInFile2 = file2TaxCodes.filter(taxCode => !file1TaxCodes.includes(taxCode));
    }
    
    return (
      <div key={index} className="p-4 mb-3 bg-white border border-l-4 border-l-yellow-500 rounded-md shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-800">Số hóa đơn: {item.key}</p>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">{index + 1}/{results.mismatchedSellers.length}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0 md:pr-3">
            <div className="flex items-center mb-1">
              <svg className="h-4 w-4 text-blue-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-medium text-blue-600">File 1:</p>
            </div>
            
            {/* Hiển thị mục từ file 1 theo điều kiện lọc */}
            {item.file1.filter(f1Item => taxCodesToShowInFile1.includes(f1Item.taxCode)).map((f1Item, idx) => (
              <div key={`f1-${idx}`} className="mb-2">
                <p className="bg-yellow-50 py-2 px-3 rounded text-sm border border-yellow-100">
                  <span className="text-xs text-gray-500 block mb-1">Dòng {f1Item.position}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{f1Item.seller}</span>
                    <span className="text-xs text-gray-600 mt-1">MST: {f1Item.taxCode}</span>
                  </div>
                </p>
              </div>
            ))}
            
            {/* Hiển thị thông báo nếu không có MST để hiển thị */}
            {taxCodesToShowInFile1.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-3">
                Không có mã số thuế khác biệt để hiển thị
              </div>
            )}
          </div>
          
          <div className="pt-3 md:pt-0 md:pl-3">
            <div className="flex items-center mb-1">
              <svg className="h-4 w-4 text-green-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-medium text-green-600">File 2:</p>
            </div>
            
            {/* Hiển thị thông tin doanh nghiệp theo điều kiện lọc */}
            {item.file2.filter(f2Item => taxCodesToShowInFile2.includes(f2Item.taxCode)).map((f2Item, idx) => (
              <div key={`f2-${idx}`} className="mb-2">
                <p className="bg-yellow-50 py-2 px-3 rounded text-sm border border-yellow-100">
                  <span className="text-xs text-gray-500 block mb-1">Dòng {f2Item.position}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{f2Item.seller}</span>
                    <span className="text-xs text-gray-600 mt-1">MST: {f2Item.taxCode}</span>
                  </div>
                </p>
              </div>
            ))}
            
            {/* Hiển thị thông báo nếu không có MST để hiển thị */}
            {taxCodesToShowInFile2.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-3">
                Không có mã số thuế khác biệt để hiển thị
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 py-4 border-t border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Kết Quả So Sánh</h2>
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Results Tabs with Download Button */}
        <div className="flex justify-between items-center border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'missing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('missing')}
            >
              Hóa Đơn Thiếu
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'mismatched' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('mismatched')}
            >
              {results.mismatchedSellers.length > 0 ? (
                <>
                  Người Bán Không Khớp
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {results.mismatchedSellers.length}
                  </span>
                </>
              ) : (
                'Người Bán Không Khớp'
              )}
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'duplicated' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('duplicated')}
            >
              {results.duplicatedItems.length > 0 ? (
                <>
                  Hóa Đơn Trùng Lặp
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    {results.duplicatedItems.length}
                  </span>
                </>
              ) : (
                'Hóa Đơn Trùng Lặp'
              )}
            </button>
          </div>
          <div className="mx-4 flex space-x-2">
            <button 
              className="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={onDownload}
            >
              <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Tải Excel (Cũ)
            </button>
            
            {results && 
              <CleanExcelButton 
                file1Workbook={file1Workbook}
                file2Workbook={file2Workbook}
                file1Name={file1Name}
                file2Name={file2Name}
                missingInFile1={results.missingInFile1.map(item => item.row)}
                missingInFile2={results.missingInFile2.map(item => item.row)}
                mismatchedRowsFile1={results.mismatchedSellers.flatMap(item => 
                  item.file1 && Array.isArray(item.file1) ? item.file1.map(f => f.row) : [])}
                mismatchedRowsFile2={results.mismatchedSellers.flatMap(item => 
                  item.file2 && Array.isArray(item.file2) ? item.file2.map(f => f.row) : [])}
                duplicatedRowsFile1={results.duplicatedItems
                  .filter(item => item.file1 !== null)
                  .map(item => item.file1!.row)}
                duplicatedRowsFile2={results.duplicatedItems
                  .filter(item => item.file2 !== null)
                  .map(item => item.file2!.row)}
                isDisabled={!file1Workbook || !file2Workbook}
              />
            }
          </div>
        </div>
        
        {/* Missing Invoices Tab */}
        {activeTab === 'missing' && (
          <div className="tab-content p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-base font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  File 1 có nhưng File 2 không có
                </h3>
                <div className="max-h-80 overflow-y-auto">
                  {results.missingInFile2.length > 0 ? (
                    <>
                      {results.missingInFile2.map((item, index) => renderMissingInvoice(item, index))}
                      <div className="mt-3 py-2 px-3 bg-blue-50 text-blue-700 font-medium rounded-md text-center text-sm">
                        <p>Tổng số: {results.missingInFile2.length} hóa đơn</p>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 text-center text-gray-500">Không có hóa đơn thiếu trong File 2</div>
                  )}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-base font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  File 2 có nhưng File 1 không có
                </h3>
                <div className="max-h-80 overflow-y-auto">
                  {results.missingInFile1.length > 0 ? (
                    <>
                      {results.missingInFile1.map((item, index) => renderMissingInvoice(item, index))}
                      <div className="mt-3 py-2 px-3 bg-blue-50 text-blue-700 font-medium rounded-md text-center text-sm">
                        <p>Tổng số: {results.missingInFile1.length} hóa đơn</p>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 text-center text-gray-500">Không có hóa đơn thiếu trong File 1</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Mismatched Sellers Tab */}
        {activeTab === 'mismatched' && (
          <div className="tab-content p-4">
            <div className="max-h-96 overflow-y-auto w-full">
              {results.mismatchedSellers.length > 0 ? (
                <>
                  <div className="bg-yellow-50 p-4 mb-4 rounded-lg border border-yellow-200 text-yellow-800">
                    <div className="flex items-center mb-2">
                      <svg className="h-5 w-5 text-yellow-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-semibold text-yellow-800">Phát hiện {results.mismatchedSellers.length} hóa đơn có người bán không khớp</h3>
                    </div>
                    <p className="text-sm">Danh sách dưới đây hiển thị các hóa đơn có cùng số nhưng người bán khác nhau giữa hai file.</p>
                  </div>
                  
                  {results.mismatchedSellers.map((item, index) => renderMismatchedSeller(item, index))}
                  
                  <div className="mt-3 py-3 px-4 bg-yellow-50 text-yellow-800 font-medium rounded-md text-center text-sm flex items-center justify-center">
                    <svg className="h-5 w-5 text-yellow-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 01-1 1H7a1 1 0 110-2h3a1 1 0 011 1z" clipRule="evenodd" />
                    </svg>
                    <p>Tổng số: {results.mismatchedSellers.length} hóa đơn có người bán không khớp</p>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium">Không có trường hợp người bán không khớp</p>
                  <p className="text-sm mt-1">Tất cả hóa đơn đều có tên người bán giống nhau giữa hai file.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Duplicated Invoices Tab */}
        {activeTab === 'duplicated' && (
          <DuplicatedInvoiceTab 
            duplicatedItems={results.duplicatedItems}
            file1Name={file1Name}
            file2Name={file2Name}
          />
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
