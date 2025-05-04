
import { useState } from "react";
import { FileItem } from "@/types";
import { FileActionMenu } from "@/components/ui/file-action-menu";
import { formatFileSize, getFileTypeIcon } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  File,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  Search,
  Star,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FileListProps {
  files: FileItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function FileList({ files, isLoading = false, emptyMessage = "No files found" }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFiles = searchTerm 
    ? files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : files;

  const getFileIcon = (fileType: string) => {
    const type = getFileTypeIcon(fileType);
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'presentation':
        return <Presentation className="h-4 w-4 text-orange-500" />;
      case 'video':
        return <Film className="h-4 w-4 text-purple-500" />;
      case 'audio':
        return <Music className="h-4 w-4 text-pink-500" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-yellow-600" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-40 rounded-md bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 rounded-md bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-4 rounded-md bg-muted animate-pulse" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="p-3">
                    <div className="flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {file.name}
                      {file.isStarred && <Star className="h-3 w-3 text-yellow-500" />}
                      {file.sharedWith && file.sharedWith.length > 0 && (
                        <div className="flex -space-x-1 overflow-hidden">
                          {file.sharedWith.slice(0, 3).map((user) => (
                            <Avatar key={user.id} className="h-4 w-4 border border-background">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="text-[8px]">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {file.sharedWith.length > 3 && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full border border-background bg-muted text-[8px] font-medium">
                              +{file.sharedWith.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={file.owner.avatar} alt={file.owner.name} />
                        <AvatarFallback className="text-[10px]">
                          {file.owner.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{file.owner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">{formatDate(file.updatedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatFileSize(file.size)}
                  </TableCell>
                  <TableCell>
                    <FileActionMenu fileId={file.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-52 flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-4">
            <File className="h-6 w-6 text-muted-foreground" />
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
