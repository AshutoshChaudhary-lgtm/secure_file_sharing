import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FileItem } from "@/types";
import { fileService } from "@/services/fileService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface FileContextType {
  files: FileItem[];
  isLoading: boolean;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  shareFile: (fileId: string, userIds: string[]) => Promise<void>;
  shareFileWithFriend: (fileId: string, friendId: string) => Promise<void>;
  starFile: (fileId: string, isStarred: boolean) => Promise<void>;
  getFileById: (fileId: string) => FileItem | undefined;
  sharedFiles: FileItem[];
  starredFiles: FileItem[];
  recentFiles: FileItem[];
  refreshFiles: () => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
  const [starredFiles, setStarredFiles] = useState<FileItem[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Function to fetch all file data from the server
  const refreshFiles = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      // Fetch all files in parallel
      const [allFiles, shared, starred, recent] = await Promise.all([
        fileService.getAllFiles(),
        fileService.getSharedFiles(),
        fileService.getStarredFiles(),
        fileService.getRecentFiles()
      ]);
      
      setFiles(allFiles);
      setSharedFiles(shared);
      setStarredFiles(starred);
      setRecentFiles(recent);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch files when the user is authenticated
    if (isAuthenticated) {
      refreshFiles();
    } else {
      // Reset file state when not authenticated
      setFiles([]);
      setSharedFiles([]);
      setStarredFiles([]);
      setRecentFiles([]);
    }
  }, [isAuthenticated]);

  const uploadFile = async (file: File) => {
    setIsLoading(true);
    try {
      await fileService.uploadFile(file);
      toast.success(`${file.name} uploaded successfully`);
      // Refresh files to get the newly uploaded file
      await refreshFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      // Find file to be deleted for the toast message
      const fileToDelete = files.find(f => f.id === fileId);
      
      await fileService.deleteFile(fileId);
      
      // Optimistically update state
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setSharedFiles(prev => prev.filter(file => file.id !== fileId));
      setStarredFiles(prev => prev.filter(file => file.id !== fileId));
      setRecentFiles(prev => prev.filter(file => file.id !== fileId));
      
      if (fileToDelete) {
        toast.success(`${fileToDelete.name} deleted successfully`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
      // Refresh to restore state in case of error
      await refreshFiles();
      throw error;
    }
  };

  const renameFile = async (fileId: string, newName: string) => {
    try {
      await fileService.renameFile(fileId, newName);
      
      // Update local state
      const updateFileInState = (fileList: FileItem[]): FileItem[] => {
        return fileList.map(file => {
          if (file.id === fileId) {
            return { ...file, name: newName, updatedAt: new Date().toISOString() };
          }
          return file;
        });
      };
      
      setFiles(updateFileInState);
      setSharedFiles(updateFileInState);
      setStarredFiles(updateFileInState);
      setRecentFiles(updateFileInState);
      
      toast.success(`File renamed to ${newName}`);
    } catch (error) {
      console.error("Error renaming file:", error);
      toast.error("Failed to rename file");
      await refreshFiles();
      throw error;
    }
  };

  const shareFile = async (fileId: string, userIds: string[]) => {
    try {
      await fileService.shareFile(fileId, userIds);
      
      // Refresh files to get the updated shared status
      await refreshFiles();
      
      toast.success(`File shared with ${userIds.length} user(s)`);
    } catch (error) {
      console.error("Error sharing file:", error);
      toast.error("Failed to share file");
      throw error;
    }
  };

  // New function to share file with a friend using the enhanced backend
  const shareFileWithFriend = async (fileId: string, friendId: string) => {
    try {
      const response = await fileService.shareFileWithFriend(fileId, friendId);
      
      // Refresh files to get the updated shared status
      await refreshFiles();
      
      if (response.status === 'success') {
        toast.success(response.message || "File shared successfully");
      } else {
        toast.error(response.message || "Failed to share file");
        throw new Error(response.message || "Unknown error occurred");
      }
    } catch (error: any) {
      console.error("Error sharing file with friend:", error);
      toast.error(error?.response?.data?.message || "Failed to share file");
      throw error;
    }
  };

  const starFile = async (fileId: string, isStarred: boolean) => {
    try {
      await fileService.starFile(fileId, isStarred);
      
      // Update local state
      const updateStarredState = (fileList: FileItem[]): FileItem[] => {
        return fileList.map(file => {
          if (file.id === fileId) {
            return { ...file, isStarred, updatedAt: new Date().toISOString() };
          }
          return file;
        });
      };
      
      setFiles(updateStarredState);
      setSharedFiles(updateStarredState);
      
      // Also update starred files list
      if (isStarred) {
        const fileToStar = files.find(file => file.id === fileId);
        if (fileToStar) {
          setStarredFiles(prev => [...prev, {...fileToStar, isStarred: true}]);
        }
      } else {
        setStarredFiles(prev => prev.filter(file => file.id !== fileId));
      }
      
      toast.success(isStarred ? "File added to favorites" : "File removed from favorites");
    } catch (error) {
      console.error("Error starring file:", error);
      toast.error("Failed to update favorites");
      await refreshFiles();
      throw error;
    }
  };

  const getFileById = (fileId: string) => {
    return files.find(file => file.id === fileId);
  };

  return (
    <FileContext.Provider
      value={{
        files,
        isLoading,
        uploadFile,
        deleteFile,
        renameFile,
        shareFile,
        shareFileWithFriend,
        starFile,
        getFileById,
        sharedFiles,
        starredFiles,
        recentFiles,
        refreshFiles
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
}
