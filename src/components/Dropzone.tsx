import React, { FormEvent, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2 } from 'lucide-react';
import { Progress } from './ui/progress';
import mammoth from 'mammoth';
import { toast } from 'sonner';
import useUploadStatus from '../store/useUploadStatus';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';

const handleDocumentProcessing = async (textContent: string): Promise<string> => {
  const apiUrl = import.meta.env.VITE_PUBLIC_MILVUS_PROCESS_API_URL;

  if (!apiUrl) {
    throw new Error('Backend API URL is not configured');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ textContent }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.restaurantId) {
    throw new Error('No restaurant ID received from server');
  }

  return data.restaurantId;
};

interface FileUploadState {
  File: File | null;
  restaurantId: string;
}

interface MyDropzoneProps {
  FileUpload: FileUploadState;
  setFileUpload: (file: FileUploadState) => void;
}

const MyDropzone: React.FC<MyDropzoneProps> = ({ FileUpload, setFileUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUploading, setUploadProgress, uploadProgress } = useUploadStatus();

  const resetUploadState = () => {
    setIsUploading(false);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
  };

  const extractTextContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          let textContent = '';

          switch (file.type) {
            case 'application/pdf':
              const loader = new WebPDFLoader(file);
              const docs = await loader.load();
              textContent = docs.map((doc) => doc.pageContent).join('\n');
              break;

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/msword':
              const result = await mammoth.extractRawText({
                arrayBuffer: event.target?.result as ArrayBuffer,
              });
              textContent = result.value;
              break;

            case 'text/plain':
              textContent = new TextDecoder().decode(event.target?.result as ArrayBuffer);
              break;

            default:
              throw new Error(`Unsupported file type: ${file.type}`);
          }

          if (!textContent.trim()) {
            throw new Error('No text content could be extracted from the file');
          }

          resolve(textContent);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      resetUploadState();
      setIsUploading(true);
      setUploading(true);
      toast.info('File uploading started...');
      setFileUpload({ File: file, restaurantId: '' });

      try {
        // Start progress indication
        setUploadProgress(10);

        // Extract text content
        const textContent = await extractTextContent(file);
        setUploadProgress(50);

        // Process document
        const restaurantId = await handleDocumentProcessing(textContent);
        setUploadProgress(90);

        // Update state with success
        setFileUpload({ File: file, restaurantId });
        setUploadProgress(100);
        toast.success('File processed successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setFileUpload({ File: null, restaurantId: '' });
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploading(false);
        }, 500); // Small delay to ensure progress bar completion is visible
      }
    },
    [setFileUpload, setUploading, setUploadProgress]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10242880, // 10MB
    multiple: false,
  });

  const handleRemoveFile = (e: FormEvent) => {
    e.stopPropagation();
    setFileUpload({ File: null, restaurantId: '' });
    resetUploadState();
  };

  return (
    <div className="border-primary p-4 bg-modal-inputBox rounded-xl shadow-md">
      <div {...getRootProps()} className="outline-none">
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="lg:px-24 cursor-pointer flex flex-col text-primary items-center">
            <Upload className="w-8 h-8 text-muted-foreground animate-bounce" />
            <p className="text-center break-words text-sm animate-pulse">
              Drop the file here
            </p>
          </div>
        ) : (
          <>
            {FileUpload.File ? (
              <div className="px-10 lg:px-24 cursor-pointer flex flex-col text-primary items-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-center break-words text-sm">{FileUpload.File.name}</p>
                {!isUploading && (
                  <button
                    type="button"
                    className="mt-2 flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
                    onClick={handleRemoveFile}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove File
                  </button>
                )}
              </div>
            ) : (
              <div className="px-8 lg:px-24 cursor-pointer flex flex-col text-primary items-center">
                <Upload className="w-8 h-8 text-muted-foreground animate-pulse" />
                <p className="text-center break-words text-sm animate-pulse">Upload file</p>
                <p className="text-center break-words text-xs text-muted-foreground mt-2">
                  Drop or click to upload PDF, DOCX, DOC, or TXT files (max 10MB)
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {isUploading && (
        <div className="w-full mt-6">
          <Progress value={uploadProgress} className="w-full h-2 bg-gray-200" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            Processing file... {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-2 bg-red-50 text-red-500 text-sm rounded text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default MyDropzone;
