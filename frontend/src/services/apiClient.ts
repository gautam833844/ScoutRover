class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  }

  private getHeaders(contentType: string | undefined): HeadersInit {
    const headers: Record<string, string> = {};
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('scoutrover_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    contentType: string | undefined = 'application/json'
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      ...this.getHeaders(contentType),
      ...(options.headers || {}),
    } as HeadersInit;

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, config);

    // Handle token refresh on 401 unauthorized
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh')
    ) {
      const refreshed = await this.attemptTokenRefresh();
      if (refreshed) {
        // Retry request with new headers
        const retryHeaders = {
          ...this.getHeaders(contentType),
          ...(options.headers || {}),
        } as HeadersInit;
        response = await fetch(url, { ...config, headers: retryHeaders });
      } else {
        // Clear expired credentials and redirect
        localStorage.removeItem('scoutrover_token');
        localStorage.removeItem('scoutrover_refresh_token');
        localStorage.removeItem('scoutrover_session');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    }

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Request execution failed.');
    }

    return responseData.data as T;
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('scoutrover_refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const body = await res.json();
        const { accessToken, refreshToken: newRefreshToken } = body.data;
        localStorage.setItem('scoutrover_token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('scoutrover_refresh_token', newRefreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: formData,
      },
      undefined // Let fetch set boundary for multipart
    );
  }
}

export const apiClient = new ApiClient();
export default apiClient;
