import { apiClient } from "./apiClient";

export interface FriendRequest {
  id: string;
  username: string;
  timestamp: number;
}

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
}

export const friendService = {
  /**
   * Get a list of all friends and friend requests
   */
  getFriends: async () => {
    const response = await apiClient.get("/api/friends/");
    return response.data;
  },

  /**
   * Send a friend request to a user by username
   */
  sendFriendRequest: async (username: string) => {
    const formData = new FormData();
    formData.append("add_friend", "true");
    formData.append("username", username);
    
    // Use custom headers to ensure proper content type for form data
    const response = await apiClient.post("/api/friends/", formData, {
      headers: {
        // Let the browser set the content type with boundary for FormData
        'Content-Type': undefined
      }
    });
    return response;
  },

  /**
   * Accept a friend request
   */
  acceptFriendRequest: async (friendId: string) => {
    const formData = new FormData();
    formData.append("accept_request", "true");
    formData.append("friend_id", friendId);
    
    const response = await apiClient.post("/api/friends/", formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    return response;
  },

  /**
   * Reject a friend request
   */
  rejectFriendRequest: async (friendId: string) => {
    const formData = new FormData();
    formData.append("reject_request", "true");
    formData.append("friend_id", friendId);
    
    const response = await apiClient.post("/api/friends/", formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    return response;
  },

  /**
   * Remove a friend
   */
  removeFriend: async (friendId: string) => {
    const formData = new FormData();
    formData.append("remove_friend", "true");
    formData.append("friend_id", friendId);
    
    const response = await apiClient.post("/api/friends/", formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    return response;
  },

  /**
   * Share a file with a friend
   */
  shareFileWithFriend: async (fileId: string, friendId: string) => {
    const formData = new FormData();
    formData.append("file_id", fileId);
    formData.append("friend_id", friendId);
    
    const response = await apiClient.post("/api/share/", formData, {
      headers: {
        'Content-Type': undefined
      }
    });
    return response;
  }
};