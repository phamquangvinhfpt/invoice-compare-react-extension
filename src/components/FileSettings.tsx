import React from 'react';

export interface FileSettingsValues {
  invoiceCol: number;
  sellerCol: number;
  startRow: number;
}

interface FileSettingsProps {
  values: FileSettingsValues;
  onChange: (values: FileSettingsValues) => void;
}

const FileSettings: React.FC<FileSettingsProps> = ({ values, onChange }) => {
  const handleChange = (field: keyof FileSettingsValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onChange({
        ...values,
        [field]: value
      });
    }
  };

  return (
    <div className="rounded-md bg-white">
      <div className="grid grid-cols-1 gap-3 mt-3">
        <div className="relative rounded-md">
          <label htmlFor="invoice-col" className="block text-sm font-medium text-gray-700 mb-1">Cột Số Hóa Đơn</label>
          <div className="relative">
            <input
              type="number"
              id="invoice-col"
              min="1"
              value={values.invoiceCol}
              onChange={handleChange('invoiceCol')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative rounded-md">
          <label htmlFor="seller-col" className="block text-sm font-medium text-gray-700 mb-1">Cột Tên Người Bán</label>
          <div className="relative">
            <input
              type="number"
              id="seller-col"
              min="1"
              value={values.sellerCol}
              onChange={handleChange('sellerCol')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="relative rounded-md">
          <label htmlFor="start-row" className="block text-sm font-medium text-gray-700 mb-1">Dòng Bắt Đầu</label>
          <div className="relative">
            <input
              type="number"
              id="start-row"
              min="1"
              value={values.startRow}
              onChange={handleChange('startRow')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSettings;
