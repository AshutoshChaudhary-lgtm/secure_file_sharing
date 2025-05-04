import { apiClient } from './apiClient';
import { User } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
  success: boolean;
}

interface RegisterResponse {
  token: string;
  user: User;
  success: boolean;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // Use the apiClient for login to leverage error handling
      const data = await apiClient.post<LoginResponse>('/api/auth/login/', { 
        email, 
        password 
      });
      
      // Save token if it exists
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Save user info
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      // Use the apiClient for registration
      const data = await apiClient.post<RegisterResponse>('/api/auth/register/', {
        name,
        email, 
        password
      });
      
      // Save token if it exists
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Save user info
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
      
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      // Call Django's logout URL
      await apiClient.get('/logout/');
      
      // Clear any local storage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Check if user is authenticated and get current user data
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Try to get user from localStorage first
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        
        // Verify the user is still logged in with the backend
        try {
          await apiClient.get('/api/check-auth/');
          return user;
        } catch (error) {
          console.error('Error checking authentication status:', error);
          // Keep the user logged in if server is temporarily unreachable
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return user;
          }
          
          // Otherwise clear authentication
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
};