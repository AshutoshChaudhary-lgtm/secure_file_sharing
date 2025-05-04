import { apiClient } from './apiClient';
import { User, Friend } from '@/types';

export const userService = {
  /**
   * Get all friends for the current user
   */
  async getFriends(): Promise<Friend[]> {
    return await apiClient.get<Friend[]>('/api/friends/');
  },

  /**
   * Send a friend request to a user by email
   */
  async sendFriendRequest(email: string): Promise<Friend> {
    return await apiClient.post<Friend>('/api/friends/request/', { email });
  },

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(friendId: string): Promise<Friend> {
    return await apiClient.post<Friend>(`/api/friends/${friendId}/accept/`, {});
  },

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(friendId: string): Promise<void> {
    await apiClient.post<void>(`/api/friends/${friendId}/reject/`, {});
  },

  /**
   * Remove a friend
   */
  async removeFriend(friendId: string): Promise<void> {
    await apiClient.delete(`/api/friends/${friendId}/`);
  },

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<User[]> {
    return await apiClient.get<User[]>(`/api/users/search/?q=${encodeURIComponent(query)}`);
  },
  
  /**
   * Get user profile details
   */
  async getUserProfile(): Promise<User> {
    return await apiClient.get<User>('/api/users/profile/');
  },
  
  /**
   * Update user profile details
   */
  async updateUserProfile(profileData: Partial<User>): Promise<User> {
    return await apiClient.patch<User>('/api/users/profile/', profileData);
  }
};