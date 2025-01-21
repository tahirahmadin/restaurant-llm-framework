import { create } from 'zustand';

interface UploadStatus {
  isUploading: boolean;
  uploadProgress: number;
  setUploading: (status: boolean) => void;
  setUploadProgress: (progress: number) => void;
}

const useUploadStatus = create<UploadStatus>((set) => ({
  isUploading: false,
  uploadProgress: 0,
  setUploading: (status) => set({ isUploading: status }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
}));

export default useUploadStatus;
