
import { useFiles } from "@/contexts/FileContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Download,
  Trash,
  Share2,
  Edit,
  Users
} from "lucide-react";
import { useState } from "react";

interface FileActionMenuProps {
  fileId: string;
}

export function FileActionMenu({ fileId }: FileActionMenuProps) {
  const { getFileById, deleteFile, renameFile, shareFile } = useFiles();
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [shareEmail, setShareEmail] = useState("");

  const file = getFileById(fileId);

  if (!file) {
    return null;
  }

  const handleOpenRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewFileName(file.name);
    setShowRenameDialog(true);
  };

  const handleRename = async () => {
    if (!newFileName.trim() || newFileName === file.name) {
      setShowRenameDialog(false);
      return;
    }

    try {
      await renameFile(fileId, newFileName.trim());
      setShowRenameDialog(false);
    } catch (error) {
      console.error("Error renaming file:", error);
    }
  };

  const handleOpenShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareEmail("");
    setShowShareDialog(true);
  };

  const handleShare = async () => {
    if (!shareEmail.trim()) {
      setShowShareDialog(false);
      return;
    }

    try {
      // Mock userIds based on UI mockup; in real app, would resolve email to user IDs
      await shareFile(fileId, ["user-2"]);
      setShowShareDialog(false);
    } catch (error) {
      console.error("Error sharing file:", error);
    }
  };

  const handleOpenDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      await deleteFile(fileId);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground/80 backdrop-blur hover:bg-background hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenRename}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleOpenDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Current Access</h4>
              <div className="flex items-center gap-2 p-2 rounded-md border">
                <div className="flex items-center gap-2 flex-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Only you have access</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Add people</h4>
              <Input
                placeholder="Email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{file.name}"? This action cannot be undone.</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
