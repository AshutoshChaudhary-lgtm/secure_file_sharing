import { useState } from "react";
import { FileItem } from "@/types";
import { FileCard } from "@/components/ui/file-card";
import { Input } from "@/components/ui/input";
import { Search, File as FileIcon } from "lucide-react";
import { useFiles } from "@/contexts/FileContext";
import { Button } from "@/components/ui/button";

interface FileGridProps {
  files: FileItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function FileGrid({ files, isLoading = false, emptyMessage = "No files found" }: FileGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { refreshFiles } = useFiles();

  const filteredFiles = searchTerm 
    ? files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : files;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refreshFiles()}
          className="ml-2"
        >
          Refresh Files
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((_, i) => (
            <div 
              key={i} 
              className="h-52 rounded-lg border border-border bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      ) : (
        <div className="flex h-52 flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-4">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">{emptyMessage}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm ? "Try a different search term" : "Upload files to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
