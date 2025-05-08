import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';

interface FileUploaderProps {
  id: string;
  label: string;
  onFileLoaded: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ id, label, onFileLoaded }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      onFileLoaded(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      onFileLoaded(file);
      
      // Update the file input value for consistency
      if (fileInputRef.current) {
        // Create a DataTransfer object to set files
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
        <h2 className="text-lg font-medium text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {label}
        </h2>
      </div>
      
      <div className="p-4">
        <div 
          className={`file-drop-area mb-4 ${isDragOver ? 'bg-blue-100 border-blue-400' : 'bg-blue-50 border-blue-300'} cursor-pointer`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {!fileName ? (
            <div className="file-message">
              <svg className="mx-auto h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm font-medium text-blue-600">Kéo thả hoặc nhấp để chọn file Excel/CSV</p>
              <p className="mt-1 text-xs text-gray-500">Hỗ trợ: .xlsx, .xls, .csv</p>
            </div>
          ) : (
            <div className="file-selected">
              <svg className="mx-auto h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-green-600">{fileName}</p>
            </div>
          )}
          <input 
            type="file" 
            id={id} 
            className="hidden" 
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
