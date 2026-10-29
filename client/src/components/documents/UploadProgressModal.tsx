// Client: Upload & Pipeline Progress Modal matching upload_progress/code.html

import React, { useState } from 'react';
import { api } from '../../lib/api/client';

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Select, 1: Uploading, 2: Text Extraction, 3: Chunking, 4: Embeddings, 5: Indexed
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const startUploadPipeline = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setCurrentStep(1);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate step progress increments for user feedback
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 75) return prev + 15;
          return prev;
        });
      }, 400);

      // API request to upload
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressTimer);
      setUploadProgress(100);
      setCurrentStep(5);

      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        setCurrentStep(0);
        setUploadProgress(0);
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please check file format and permissions.');
      setIsUploading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.18)] border border-outline-variant/30 p-lg flex flex-col gap-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            </div>
            <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
              Document Pipeline
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 flex items-center justify-center text-on-surface-variant rounded-full hover:bg-surface-container transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-error-container text-on-error-container text-body-sm rounded-xl flex items-center gap-2 border border-error/20">
            <span className="material-symbols-outlined text-[20px] text-error">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Upload Selection / Dropzone */}
        {!isUploading && currentStep === 0 && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low rounded-2xl p-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <input
              type="file"
              id="documentFileInput"
              accept=".pdf,.docx,.txt,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="documentFileInput" className="cursor-pointer flex flex-col items-center w-full">
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[32px]">upload_file</span>
              </div>

              {file ? (
                <div className="flex flex-col items-center gap-xs">
                  <p className="font-title-lg text-sm text-on-surface font-semibold">{file.name}</p>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-title-lg text-body-md text-on-surface font-bold">
                    Click to select file or drag & drop
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Supports PDF, DOCX, TXT, CSV (Max 50MB)
                  </p>
                </>
              )}
            </label>

            {file && (
              <button
                onClick={startUploadPipeline}
                className="mt-lg px-xl py-md bg-primary text-on-primary font-label-md text-label-md rounded-xl shadow-md hover:bg-on-primary-fixed transition-all"
              >
                Upload & Process Document
              </button>
            )}
          </div>
        )}

        {/* Active Upload Card & Progress */}
        {isUploading && (
          <div className="bg-surface-container rounded-2xl p-md shadow-sm relative overflow-hidden">
            <div className="flex flex-col gap-md">
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-title-lg text-title-lg text-on-surface truncate font-semibold">
                    {file?.name || 'Document.pdf'}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Processing vector embeddings...
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <div className="flex justify-between items-end">
                  <span className="font-label-md text-label-md text-primary font-bold">
                    {uploadProgress}% Complete
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Processing'}
                  </span>
                </div>

                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Stepper Pipeline matching design */}
        {isUploading && (
          <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/30">
            <h3 className="font-title-lg text-sm text-on-surface font-bold mb-md">
              Processing Pipeline
            </h3>
            <div className="flex flex-col gap-md">
              {/* Step 1 */}
              <div className="flex gap-md items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-xs font-bold text-primary">Step 1 • Uploaded</span>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    Secure document transfer finished
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-md items-center">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 animate-pulse">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-xs font-bold text-secondary">
                    Step 2 • Text Extraction & OCR
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    Extracting structural formatting & text passages
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-md items-center opacity-60">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-xs font-bold text-on-surface-variant">
                    Step 3 • Semantic Chunking
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    Parsing sliding window text chunks
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-md items-center opacity-60">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]">scatter_plot</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-xs font-bold text-on-surface-variant">
                    Step 4 • Vector Embeddings
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    Generating 1536-dim embeddings
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Educational Note */}
        <div className="bg-primary-container/20 rounded-xl p-sm flex gap-sm items-start">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
          <div>
            <span className="font-body-sm text-xs text-on-surface font-semibold block mb-0.5">
              Automated RAG Vector Indexing
            </span>
            <span className="font-body-sm text-xs text-on-surface-variant">
              Documents are processed into searchable vector embeddings for high-accuracy RAG synthesis.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
