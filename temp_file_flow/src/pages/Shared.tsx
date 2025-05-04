import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles } from "@/contexts/FileContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { FileGrid } from "@/components/layout/FileGrid";
import { FileList } from "@/components/layout/FileList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, List, Share2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Shared = () => {
  const { isAuthenticated } = useAuth();
  const { files, isLoading } = useFiles();
  const [searchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  
  // Get shared files (those that are shared with the current user)
  const sharedFiles = files.filter(file => 
    file.owner.id !== "user-1" && 
    file.sharedWith?.some(user => user.id === "user-1")
  );
  
  // Filter based on search query
  const filteredFiles = sharedFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    document.title = "Shared Files - FileFlow";
  }, []);
  
  // Get the active tab from URL params
  const activeTab = searchParams.get("tab") || "shared";
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleShareFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    // Mock sharing
    toast.success(`Sharing request sent to ${shareEmail}`);
    setShareEmail("");
  };

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
                <h1 className="text-3xl font-bold">Shared Files</h1>
                <p className="mt-1 text-muted-foreground">
                  Files that have been shared with you
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
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              <div className="lg:col-span-3 space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Search shared files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-cream/30 text-foreground pr-10 max-w-md"
                  />
                </div>

                {view === "grid" ? (
                  <FileGrid 
                    files={filteredFiles} 
                    isLoading={isLoading} 
                    emptyMessage="No files have been shared with you yet"
                  />
                ) : (
                  <FileList 
                    files={filteredFiles} 
                    isLoading={isLoading} 
                    emptyMessage="No files have been shared with you yet"
                  />
                )}
              </div>
              
              <div>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-rust" />
                      <h2 className="text-xl font-semibold">Share Files</h2>
                    </div>
                    
                    <form onSubmit={handleShareFile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="share-email">Share with</Label>
                        <Input
                          id="share-email"
                          type="email"
                          placeholder="Email address"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          className="bg-cream/30 text-foreground"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Share Files
                      </Button>
                    </form>
                    
                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-2">Sharing Tips</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                        <li>You can set view-only or edit permissions</li>
                        <li>Revoke access at any time from file settings</li>
                        <li>Get notified when others view your files</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-4 bg-sage/20 rounded-lg p-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span> 
                    Activity
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Sarah viewed "Project Proposal.pdf" - 2 hours ago</p>
                    <p>Alex commented on "Budget.xlsx" - Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Shared;
