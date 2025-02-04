import React, { useState, useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../config'; 

interface ImageUploaderProps {
  currentImage: string;
  onImageUpdate: (newUrl: string) => void;
  restaurantName: string;
  itemName: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageUpdate,
  restaurantName,
  itemName
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadToServer = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);  // ✅ Use 'file' to match backend multer field
      formData.append('restaurantName', restaurantName);
      formData.append('itemName', itemName);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.success) throw new Error('Upload failed');

      return data.fileUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Image size should be less than 50MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    try {
      const imageUrl = await uploadToServer(file);
      onImageUpdate(imageUrl);
      setPreviewImage(imageUrl);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {previewImage ? (
        <img
          src={previewImage}
          alt={itemName}
          className="w-24 h-24 object-cover rounded"
        />
      ) : (
        <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}

      <button
        type="button"
        onClick={handleUploadClick}
        className={`px-4 py-2 ${
          isUploading ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 cursor-pointer hover:bg-gray-200'
        } rounded`}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;
