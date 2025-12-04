import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File) => Promise<void>;
  accept?: string;
  description: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, accept = ".xlsx, .xls", description }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = async (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setStatus('processing');
    try {
      await onFileSelect(file);
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e.message || 'Error procesando archivo');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
        ${status === 'error' ? 'border-red-400 bg-red-50' : 
          status === 'success' ? 'border-green-400 bg-green-50' : 
          'border-gray-300 hover:border-alfonsa hover:bg-orange-50'}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={inputRef} 
        className="hidden" 
        accept={accept} 
        onChange={(e) => e.target.files && handleFile(e.target.files[0])} 
      />
      
      <div className="flex flex-col items-center justify-center space-y-2">
        {status === 'processing' && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-alfonsa"></div>}
        {status === 'idle' && <FileSpreadsheet className="h-10 w-10 text-gray-400" />}
        {status === 'success' && <CheckCircle className="h-10 w-10 text-green-500" />}
        {status === 'error' && <AlertCircle className="h-10 w-10 text-red-500" />}

        <h3 className="font-semibold text-gray-700">{label}</h3>
        <p className="text-xs text-gray-500 max-w-xs">{fileName || description}</p>
        
        {status === 'error' && <p className="text-xs text-red-600 font-bold">{errorMsg}</p>}
      </div>
    </div>
  );
};

export default FileUpload;