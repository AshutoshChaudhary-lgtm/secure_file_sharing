
import { useState } from "react";
import { FileItem } from "@/types";
import { formatFileSize } from "@/lib/utils";
import { FileActionMenu } from "@/components/ui/file-action-menu";
import { cn } from "@/lib/utils";
import { 
  File, 
  FileText, 
  Image, 
  Film, 
  Music, 
  Archive, 
  FileSpreadsheet,
  Presentation,
  Download,
  Star
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFiles } from "@/contexts/FileContext";

interface FileCardProps {
  file: FileItem;
  className?: string;
}

export function FileCard({ file, className }: FileCardProps) {
  const { starFile } = useFiles();
  const [isHovering, setIsHovering] = useState(false);

  const getFileIcon = () => {
    // Determine icon based on file type
    if (file.type.includes('image')) {
      return <Image className="h-10 w-10 text-blue-500" />;
    }
    if (file.type.includes('pdf')) {
      return <FileText className="h-10 w-10 text-red-500" />;
    }
    if (file.type.includes('word') || file.type.includes('doc')) {
      return <FileText className="h-10 w-10 text-blue-600" />;
    }
    if (file.type.includes('sheet') || file.type.includes('excel') || file.type.includes('csv')) {
      return <FileSpreadsheet className="h-10 w-10 text-green-600" />;
    }
    if (file.type.includes('slide') || file.type.includes('presentation')) {
      return <Presentation className="h-10 w-10 text-orange-500" />;
    }
    if (file.type.includes('video')) {
      return <Film className="h-10 w-10 text-purple-500" />;
    }
    if (file.type.includes('audio')) {
      return <Music className="h-10 w-10 text-pink-500" />;
    }
    if (file.type.includes('zip') || file.type.includes('archive')) {
      return <Archive className="h-10 w-10 text-yellow-600" />;
    }
    return <File className="h-10 w-10 text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleStarToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await starFile(file.id, !file.isStarred);
    } catch (error) {
      console.error("Error toggling star status:", error);
    }
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 file-card-hover",
        isHovering ? "shadow-md" : "shadow-sm",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div 
        className={cn(
          "absolute right-2 top-2 z-10 flex items-center gap-1", 
          isHovering ? "opacity-100" : "opacity-0",
          "transition-opacity duration-200"
        )}
      >
        <button
          className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground/80 backdrop-blur hover:bg-background hover:text-foreground"
          onClick={handleStarToggle}
        >
          <Star 
            className={cn(
              "h-4 w-4", 
              file.isStarred ? "fill-yellow-400 text-yellow-400" : ""
            )} 
          />
        </button>
        <FileActionMenu fileId={file.id} />
      </div>
      
      <CardContent className="p-4">
        <div className={cn(
          "flex items-center justify-center rounded-md p-4 mb-2",
          "bg-gradient-to-br from-accent to-accent/50"
        )}>
          {getFileIcon()}
        </div>
        <div className="space-y-1">
          <h3 className="truncate font-medium leading-none">{file.name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between border-t p-2 bg-muted/40">
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={file.owner.avatar} alt={file.owner.name} />
            <AvatarFallback className="text-[10px]">{file.owner.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{formatDate(file.updatedAt)}</span>
        </div>
        
        {file.sharedWith && file.sharedWith.length > 0 && (
          <div className="flex -space-x-1 overflow-hidden">
            {file.sharedWith.slice(0, 3).map((user) => (
              <Avatar key={user.id} className="h-5 w-5 border border-background">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-[10px]">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {file.sharedWith.length > 3 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-medium">
                +{file.sharedWith.length - 3}
              </div>
            )}
          </div>
        )}
        
        <button className="rounded-full p-1 hover:bg-background/80">
          <Download className="h-4 w-4 text-muted-foreground" />
        </button>
      </CardFooter>
    </Card>
  );
}
