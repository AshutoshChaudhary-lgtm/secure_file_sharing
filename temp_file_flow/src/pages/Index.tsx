import { useState } from "react";
import { useFiles } from "@/contexts/FileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { FileGrid } from "@/components/layout/FileGrid";
import { FileList } from "@/components/layout/FileList";
import { UploadDialog } from "@/components/dialogs/UploadDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LayoutGrid,
  List,
  Clock,
  Star,
  Upload,
  File as FileIcon
} from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const { files, isLoading, starredFiles, recentFiles } = useFiles();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className={cn(
      "flex min-h-screen bg-background",
      isSidebarOpen ? "sidebar-open" : "sidebar-closed"
    )}>
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        isSidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 p-6">
          <div className="container mx-auto space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="mt-1 text-muted-foreground">
                  Manage your files and shared content
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex">
                  <Button 
                    variant={view === "grid" ? "secondary" : "ghost"} 
                    size="icon" 
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant={view === "list" ? "secondary" : "ghost"} 
                    size="icon" 
                    onClick={() => setView("list")}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                </div>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Recent Files</CardTitle>
                    <CardDescription>Recently modified files</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentFiles.length > 0 ? (
                      recentFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 rounded-lg border p-2 hover:bg-accent/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
                            <FileIcon className="h-5 w-5 text-accent-foreground" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="truncate font-medium">{file.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {new Date(file.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No recent files
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <CardTitle>Starred Files</CardTitle>
                    <CardDescription>Your important files</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {starredFiles.length > 0 ? (
                      starredFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 rounded-lg border p-2 hover:bg-accent/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
                            <FileIcon className="h-5 w-5 text-accent-foreground" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="truncate font-medium">{file.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {new Date(file.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No starred files
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2 xl:col-span-1">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <div className="rounded-full bg-primary/20 p-1">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Storage</CardTitle>
                    <CardDescription>Your storage usage</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Used</span>
                      <span className="text-sm font-medium">5 GB</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full w-1/2 rounded-full bg-primary"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>0 GB</span>
                      <span>10 GB</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      Upgrade Storage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">All Files</TabsTrigger>
                  <TabsTrigger value="shared">Shared with me</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="all" className="space-y-4">
                {view === "grid" ? (
                  <FileGrid files={files} isLoading={isLoading} />
                ) : (
                  <FileList files={files} isLoading={isLoading} />
                )}
              </TabsContent>
              <TabsContent value="shared" className="space-y-4">
                {view === "grid" ? (
                  <FileGrid 
                    files={files.filter(file => 
                      file.owner.id !== "user-1" && 
                      file.sharedWith?.some(user => user.id === "user-1")
                    )} 
                    isLoading={isLoading}
                    emptyMessage="No files have been shared with you yet" 
                  />
                ) : (
                  <FileList 
                    files={files.filter(file => 
                      file.owner.id !== "user-1" && 
                      file.sharedWith?.some(user => user.id === "user-1")
                    )} 
                    isLoading={isLoading}
                    emptyMessage="No files have been shared with you yet"
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <UploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
    </div>
  );
};

export default Index;
