import api from '@/services/api';
import type { ApiResponse } from '@/features/auth/types/auth';

export interface FileUploadResponse {
  url: string;
  publicId: string;
  resourceType: 'image' | 'raw';
  contentType: string;
  originalFilename?: string | null;
  bytes: number;
}

export const uploadFile = async (
  file: File,
  folder?: string
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  if (folder) {
    formData.append('folder', folder);
  }

  const response = await api.post<ApiResponse<FileUploadResponse>>('/api/v1/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};
