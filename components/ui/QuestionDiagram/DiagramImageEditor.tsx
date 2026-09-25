import React, { useState, useRef } from 'react';
import { Pencil, Loader2, X } from 'lucide-react';
import api from '@/lib/api';

interface DiagramImageEditorProps {
  currentSpec?: { url: string; storagePath: string };
  onConfirm: (result: { url: string; storagePath: string }) => void;
  onCancel: () => void;
}

export function DiagramImageEditor({ currentSpec, onConfirm, onCancel }: DiagramImageEditorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selectedFile.type)) {
      setError('Invalid file type. Only PNG, JPEG, and WEBP are allowed.');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File is too large. Max size is 5MB.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleConfirm = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/api/diagrams/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onConfirm({ url: response.data.data.url, storagePath: response.data.data.storagePath });
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-6 w-[350px] shadow-2xl flex flex-col gap-4 mx-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-[15px] font-semibold text-[#ECECEA]">Replace Diagram Image</h4>
          <button onClick={handleCancel} className="text-[#8C8C8A] hover:text-[#ECECEA]" disabled={isUploading}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-xs bg-red-400/10 p-2 rounded border border-red-400/20">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          {!previewUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-[150px] border-2 border-dashed border-[#3A3A38] rounded-lg flex flex-col items-center justify-center text-[#8C8C8A] hover:text-[#ECECEA] hover:border-[#ECECEA] transition-colors"
              disabled={isUploading}
            >
              <Pencil size={24} className="mb-2" />
              <span className="text-sm font-medium">Click to select image</span>
              <span className="text-xs mt-1 opacity-70">PNG, JPG, WEBP up to 5MB</span>
            </button>
          ) : (
            <div className="relative w-full h-[150px] rounded-lg border border-[#3A3A38] overflow-hidden bg-black/30 flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-md text-white hover:bg-black/80 transition-colors"
                disabled={isUploading}
                title="Change image"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="px-4 py-2 text-[12px] font-medium text-[#8C8C8A] hover:text-[#ECECEA] transition-colors rounded-lg hover:bg-[#333331]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!file || isUploading}
            className="px-4 py-2 text-[12px] font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
