/**
 * API Client for connecting to Django backend
 */

// No need for base URL since we're using Vite's proxy
const API_BASE_URL = '';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

/**
 * Get the CSRF token from cookies
 */
const getCsrfToken = (): string | undefined => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
};

export const apiClient = {
  /**
   * Base API request function
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization token if available
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    // Add CSRF token for any non-GET request
    if (options.method !== 'GET') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
    }

    // If the request has a body and it's not already a string, stringify it
    const body = options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body) 
      : options.body;

    // Configure fetch options
    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: options.credentials || 'include',
      body,
    };

    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, config);
      
      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }
      
      // For file downloads, return the blob
      if (response.headers.get('Content-Type')?.includes('application/octet-stream')) {
        const blob = await response.blob();
        return blob as unknown as T;
      }
      
      // Handle response properly to avoid "Unexpected end of JSON input"
      const responseText = await response.text();
      let data;
      
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error('Server returned invalid response format');
        }
      } else {
        throw new Error('Server returned empty response');
      }
      
      if (!response.ok) {
        // Handle API error responses
        throw new Error(data.error || data.message || 'An error occurred with the API request');
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  },

  /**
   * Convenience methods for different HTTP methods
   */
  get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  },

  put<T>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  },

  patch<T>(endpoint: string, body: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  delete<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * File upload helper - handles multipart/form-data
   */
  async uploadFile<T>(endpoint: string, file: File, additionalData = {}): Promise<T> {
    console.log(`Starting upload for file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional fields to the form data
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
      console.log('Using auth token for upload');
    } else {
      console.log('No auth token found for upload');
    }

    // Get CSRF token from cookie if available
    const csrfToken = getCsrfToken();
      
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
      console.log('CSRF token included in request');
    } else {
      console.log('No CSRF token found in cookies');
    }

    try {
      console.log(`Sending upload request to: ${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include',
      });
      
      console.log(`Upload response status: ${response.status} ${response.statusText}`);
      
      // Handle different response types
      if (response.status === 204) {
        console.log('Server returned 204 No Content');
        return {} as T;
      }
      
      // Check content type to determine how to parse the response
      const contentType = response.headers.get('Content-Type');
      console.log(`Response content type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        // Parse JSON response
        const responseText = await response.text();
        console.log(`Response text: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        
        let data;
        
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            throw new Error('Server returned invalid response format');
          }
        } else {
          // Empty but successful response
          data = {} as T;
        }
        
        if (!response.ok) {
          console.error('Upload failed with error:', data);
          throw new Error(data.message || data.error || 'File upload failed');
        }
        
        console.log('Upload successful, returning data');
        return data;
      } else {
        // Handle non-JSON responses (like redirect)
        if (!response.ok) {
          console.error(`Upload failed with status: ${response.status}`);
          const errorText = await response.text();
          console.error(`Error details: ${errorText}`);
          throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        // Return a success object for non-JSON responses
        console.log('Upload successful (non-JSON response)');
        return { success: true } as unknown as T;
      }
    } catch (error) {
      console.error('File upload failed:', error);
      // Log more details about the original error
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }
};