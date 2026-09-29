import React, { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle2, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';

export interface PhotoPreset {
  id: string;
  label: string;
  url: string;
  caption?: string;
  category?: string;
}

interface PhotoUploadPickerProps {
  label?: string;
  currentPhotoUrl: string;
  onChangePhotoUrl: (url: string, isCustomUpload: boolean, fileMeta?: { name: string; size: number }) => void;
  presets?: PhotoPreset[];
  helpText?: string;
}

export const PhotoUploadPicker: React.FC<PhotoUploadPickerProps> = ({
  label = 'Photo Evidence Reference',
  currentPhotoUrl,
  onChangePhotoUrl,
  presets = [],
  helpText = 'Upload actual photographic evidence from your device camera or files.',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [isDragOver, setIsDragDropOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setFileMeta({ name: file.name, size: file.size });
      setIsCustomUpload(true);
      onChangePhotoUrl(dataUrl, true, { name: file.name, size: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragDropOver(false);
    if (e.dataTransfer.files && e.target) {
      if (e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    }
  };

  const handleRemovePhoto = () => {
    setFileMeta(null);
    setIsCustomUpload(false);
    if (presets.length > 0) {
      onChangePhotoUrl(presets[0].url, false);
    } else {
      onChangePhotoUrl('', false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-sky-600" />
          <span>{label} *</span>
        </label>
        {isCustomUpload && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>UPLOADED MEDIA (REAL FILE)</span>
          </span>
        )}
      </div>

      {uploadError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Upload Box & Preview */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragDropOver(true);
        }}
        onDragLeave={() => setIsDragDropOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-4 transition text-center ${
          isDragOver
            ? 'border-sky-500 bg-sky-50/80'
            : currentPhotoUrl
            ? 'border-emerald-300 bg-emerald-50/30'
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
        }`}
      >
        {currentPhotoUrl ? (
          <div className="space-y-3">
            <div className="relative inline-block max-w-full">
              <img
                src={currentPhotoUrl}
                alt="Selected evidence preview"
                className="max-h-48 w-auto mx-auto rounded-xl object-cover border border-slate-200 shadow-sm"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 p-1.5 bg-slate-900 text-white rounded-full hover:bg-rose-600 transition shadow-md cursor-pointer"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="text-left font-mono text-[11px]">
                {fileMeta ? (
                  <>
                    <span className="font-bold text-slate-900 block truncate max-w-xs">{fileMeta.name}</span>
                    <span className="text-slate-500">{formatFileSize(fileMeta.size)} • Real Local Upload</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-slate-800 block truncate max-w-xs">Field Evidence Photo</span>
                    <span className="text-slate-500">Verified Photo Reference</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace Photo</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer py-4 space-y-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">
                Click to upload photo or drag & drop file here
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, WebP up to 10MB (Stored in Digital Thread)
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      <p className="text-[10px] text-slate-500 italic">{helpText}</p>
    </div>
  );
};
