import React from 'react';
import FileUploader from './FileUploader';
import FileSettings, { FileSettingsValues } from './FileSettings';

interface FileContainerProps {
  index: number;
  onFileLoaded: (file: File) => void;
  settings: FileSettingsValues;
  onSettingsChange: (settings: FileSettingsValues) => void;
}

const FileContainer: React.FC<FileContainerProps> = ({ 
  index, 
  onFileLoaded, 
  settings, 
  onSettingsChange 
}) => {
  return (
    <div>
      <FileUploader 
        id={`file${index}`} 
        label={`File ${index}`} 
        onFileLoaded={onFileLoaded} 
      />
      <div className="mt-4">
        <FileSettings 
          values={settings} 
          onChange={onSettingsChange} 
        />
      </div>
    </div>
  );
};

export default FileContainer;
