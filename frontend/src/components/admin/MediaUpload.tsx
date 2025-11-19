'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { mediaApi } from '@/lib/api';
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import toast from 'react-hot-toast';

interface MediaUploadProps {
  onUploadComplete?: (urls: string[]) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
}

export function MediaUpload({
  onUploadComplete,
  multiple = false,
  accept = 'image/*,video/*',
  maxFiles = 10,
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (filesToUpload: File[]) => {
      if (filesToUpload.length === 1) {
        const response = await mediaApi.upload(filesToUpload[0]);
        return [response.data.secure_url || response.data.url];
      } else {
        const response = await mediaApi.uploadMultiple(filesToUpload);
        return response.data.uploads.map((f: any) => f.secure_url || f.url);
      }
    },
    onSuccess: (urls) => {
      setUploadedUrls([...uploadedUrls, ...urls]);
      if (onUploadComplete) {
        onUploadComplete([...uploadedUrls, ...urls]);
      }
      toast.success('Files uploaded successfully');
      setFiles([]);
      setPreviews([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload files');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = selectedFiles.slice(0, remainingSlots);

    setFiles([...files, ...filesToAdd]);

    // Create previews
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }
    uploadMutation.mutate(files);
  };

  const isImage = (file: File) => file.type.startsWith('image/');
  const isVideo = (file: File) => file.type.startsWith('video/');

  return (
    <div className="card-luxury">
      <h3 className="text-xl font-display font-bold mb-4 text-accent-primary">
        Upload Media
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Select {multiple ? 'Files' : 'File'}
          </label>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={files.length >= maxFiles || uploadMutation.isPending}
            className="input-elegant w-full"
          />
          <p className="text-text-secondary text-xs mt-1">
            Max {maxFiles} files. Images and videos supported.
          </p>
        </div>

        {/* Preview */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                {isImage(files[index]) ? (
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : isVideo(files[index]) ? (
                  <div className="w-full h-32 bg-surface-muted rounded-lg flex items-center justify-center">
                    <Video size={32} className="text-accent-primary" />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-surface-muted rounded-lg flex items-center justify-center">
                    <ImageIcon size={32} className="text-accent-primary" />
                  </div>
                )}
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 p-1 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                  {files[index].name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded URLs */}
        {uploadedUrls.length > 0 && (
          <div>
            <label className="block text-sm font-semibold mb-2">
              Uploaded URLs
            </label>
            <div className="space-y-2">
              {uploadedUrls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-surface-muted rounded"
                >
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className="input-elegant flex-1 text-sm"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      toast.success('URL copied to clipboard');
                    }}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="btn-primary w-full"
          >
            {uploadMutation.isPending ? (
              'Uploading...'
            ) : (
              <>
                <Upload size={20} className="mr-2" />
                Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

