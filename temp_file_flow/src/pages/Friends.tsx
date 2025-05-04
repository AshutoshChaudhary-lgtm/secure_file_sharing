import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users, Clock, Check, X, Share } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { friendService, Friend, FriendRequest } from "@/services/friendService";
import { useFiles } from "@/contexts/FileContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileItem } from "@/types";

const Friends = () => {
  const { isAuthenticated } = useAuth();
  const { files } = useFiles();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // State for friends and requests
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  
  // State for file sharing dialog
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [sharingFile, setSharingFile] = useState(false);

  // Fetch friends and requests from backend
  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      const data = await friendService.getFriends();
      setFriends(data.friends || []);
      setIncomingRequests(data.incoming_requests || []);
      setOutgoingRequests(data.outgoing_requests || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Friends - FileFlow";
    if (isAuthenticated) {
      fetchFriends();
    }
  }, [isAuthenticated]);

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error("Please enter a username");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await friendService.sendFriendRequest(username);
      toast.success(response.message || "Friend request sent successfully");
      setUsername("");
      // Refresh friend list and requests
      fetchFriends();
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast.error(error?.response?.data?.message || "Failed to send friend request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (friendId: string) => {
    try {
      setIsLoading(true);
      const response = await friendService.acceptFriendRequest(friendId);
      toast.success(response.message || "Friend request accepted");
      fetchFriends();
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      toast.error(error?.response?.data?.message || "Failed to accept friend request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (friendId: string) => {
    try {
      setIsLoading(true);
      const response = await friendService.rejectFriendRequest(friendId);
      toast.success(response.message || "Friend request rejected");
      fetchFriends();
    } catch (error: any) {
      console.error("Error rejecting friend request:", error);
      toast.error(error?.response?.data?.message || "Failed to reject friend request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await friendService.removeFriend(friendId);
      toast.success(response.message || "Friend removed successfully");
      fetchFriends();
    } catch (error: any) {
      console.error("Error removing friend:", error);
      toast.error(error?.response?.data?.message || "Failed to remove friend");
    } finally {
      setIsLoading(false);
    }
  };

  const openShareDialog = (friend: Friend) => {
    setSelectedFriend(friend);
    setSelectedFileId("");
    setShowShareDialog(true);
  };

  const handleShareFile = async () => {
    if (!selectedFriend || !selectedFileId) {
      toast.error("Please select a file to share");
      return;
    }

    try {
      setSharingFile(true);
      const response = await friendService.shareFileWithFriend(selectedFileId, selectedFriend.id);
      toast.success(response.message || `File shared with ${selectedFriend.username}`);
      setShowShareDialog(false);
    } catch (error: any) {
      console.error("Error sharing file:", error);
      toast.error(error?.response?.data?.message || "Failed to share file");
    } finally {
      setSharingFile(false);
    }
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
                <h1 className="text-3xl font-bold">Friends</h1>
                <p className="mt-1 text-muted-foreground">
                  Manage your connections and share files easily
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => document.getElementById("add-friend-form")?.focus()}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Friend
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Friend Requests Section */}
              {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
                <Card className="md:col-span-3">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Friend Requests</h2>
                    
                    {incomingRequests.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Pending Requests
                        </h3>
                        <div className="space-y-3">
                          {incomingRequests.map(request => (
                            <div key={request.id} className="flex items-center justify-between p-3 rounded-md bg-cream/20">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                                  {request.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{request.username}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(request.timestamp).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleAcceptRequest(request.id)}
                                  disabled={isLoading}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Accept
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRejectRequest(request.id)}
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {outgoingRequests.length > 0 && (
                      <div>
                        <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Sent Requests
                        </h3>
                        <div className="space-y-3">
                          {outgoingRequests.map(request => (
                            <div key={request.id} className="flex items-center justify-between p-3 rounded-md bg-cream/10">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                                  {request.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{request.username}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Pending since {new Date(request.timestamp).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Friends List */}
              <Card className={cn(
                (incomingRequests.length > 0 || outgoingRequests.length > 0) 
                  ? "md:col-span-2" 
                  : "md:col-span-2"
              )}>
                <CardContent className="p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-rust" /> 
                      My Friends
                    </h2>
                    <Input 
                      placeholder="Search friends..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-xs bg-cream/30 text-foreground"
                    />
                  </div>
                  
                  {isLoading && friends.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">Loading friends...</p>
                    </div>
                  ) : filteredFriends.length > 0 ? (
                    <div className="space-y-4">
                      {filteredFriends.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between p-3 rounded-md bg-cream/20 hover:bg-cream/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                              {friend.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-medium">{friend.username}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openShareDialog(friend)}
                            >
                              <Share className="h-4 w-4 mr-1" /> Share Files
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRemoveFriend(friend.id)}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery 
                          ? "No friends found matching your search." 
                          : "You don't have any friends yet. Add friends to share files."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Add Friend Form */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-rust" />
                    Add Friend
                  </h2>
                  
                  <form onSubmit={handleSendFriendRequest} className="space-y-4" id="add-friend-form">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Add friends by username to collaborate and share files.
                      </p>
                      <Input
                        type="text"
                        placeholder="Friend's username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-cream/30 text-foreground"
                        disabled={isLoading}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading || !username}
                    >
                      {isLoading ? "Sending..." : "Send Friend Request"}
                    </Button>
                  </form>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="font-medium mb-2">Quick Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Friends can easily share files with you</li>
                      <li>Collaborate on projects in real-time</li>
                      <li>Control access to your shared files</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Share File Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File with {selectedFriend?.username}</DialogTitle>
            <DialogDescription>
              Select a file to share with your friend.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select onValueChange={setSelectedFileId} value={selectedFileId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a file" />
              </SelectTrigger>
              <SelectContent>
                {files.length > 0 ? (
                  files.map((file: FileItem) => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="empty">
                    No files available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShareFile} 
              disabled={sharingFile || !selectedFileId}
            >
              {sharingFile ? "Sharing..." : "Share File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Friends;
