import { apiClient } from './apiClient';
import { FileItem } from '@/types';

export const fileService = {
  /**
   * Get all files for the current user
   */
  getAllFiles: async (): Promise<FileItem[]> => {
    const response = await apiClient.get("/api/files/");
    return response.data;
  },

  /**
   * Get files shared with the current user
   */
  getSharedFiles: async (): Promise<FileItem[]> => {
    const response = await apiClient.get("/api/files/shared/");
    return response.data;
  },

  /**
   * Get starred files for the current user
   */
  getStarredFiles: async (): Promise<FileItem[]> => {
    const response = await apiClient.get("/api/files/starred/");
    return response.data;
  },

  /**
   * Get recently accessed files
   */
  getRecentFiles: async (): Promise<FileItem[]> => {
    const response = await apiClient.get("/api/files/recent/");
    return response.data;
  },

  /**
   * Upload a new file
   */
  uploadFile: async (file: File): Promise<FileItem> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await apiClient.post("/api/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  },

  /**
   * Delete a file
   */
  deleteFile: async (fileId: string): Promise<void> => {
    await apiClient.delete(`/api/files/${fileId}/`);
  },

  /**
   * Rename a file
   */
  renameFile: async (fileId: string, newName: string): Promise<FileItem> => {
    const response = await apiClient.patch(`/api/files/${fileId}/`, {
      name: newName,
    });
    
    return response.data;
  },

  /**
   * Star or unstar a file
   */
  starFile: async (fileId: string, isStarred: boolean): Promise<FileItem> => {
    const response = await apiClient.patch(`/api/files/${fileId}/star/`, {
      is_starred: isStarred,
    });
    
    return response.data;
  },

  /**
   * Share a file with specified users
   */
  shareFile: async (fileId: string, userIds: string[]): Promise<FileItem> => {
    const response = await apiClient.post(`/api/files/${fileId}/share/`, {
      user_ids: userIds,
    });
    
    return response.data;
  },
  
  /**
   * Share a file with a friend (uses our enhanced backend)
   */
  shareFileWithFriend: async (fileId: string, friendId: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file_id", fileId);
    formData.append("friend_id", friendId);
    
    const response = await apiClient.post("/api/share/", formData);
    return response.data;
  },

  /**
   * Download a file
   */
  downloadFile: async (fileId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/files/${fileId}/download/`, {
      responseType: "blob",
    });
    
    return response.data;
  },
};