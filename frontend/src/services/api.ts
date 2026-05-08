// const API_BASE_URL = 'http://localhost:5000'
// const API_BASE_URL = 'https://127.0.0.1:5443'
// const API_BASE_URL = 'https://localhost:5443'
// const API_BASE_URL = 'https://localhost:5443'
const API_BASE_URL = 'https://127.0.0.1:8443/api'
// const API_BASE_URL = 'http://172.20.127.106:5000'
// const API_BASE_URL = 'https://172.20.127.106:5443'

export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.replace(/^\//, '')
  return `${API_BASE_URL}/${cleanEndpoint}`
}

export interface ApiRequestBody {
  hosts: string[]
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = buildApiUrl(endpoint)

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorText = await response.text()
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        response.status,
        errorText,
      )
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return undefined as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof TypeError) {
      throw new ApiError(`Network error: ${error.message}`, 0)
    }
    throw new ApiError('Unknown error occurred', 0)
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  getWithHosts: <T>(endpoint: string, hosts: string[]) => {
    if (hosts.length === 0) {
      return Promise.resolve([] as T)
    }
    return apiRequest<T>(endpoint, {
      method: 'GET',
      headers: {
        'X-Target-Hosts': JSON.stringify(hosts),
      },
    })
  },
  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  postWithHosts: <T>(endpoint: string, hosts: string[], data?: unknown) => {
    if (hosts.length === 0) {
      return Promise.resolve([] as T)
    }
    const body: ApiRequestBody & { data?: unknown } = { hosts }
    if (data) {
      body.data = data
    }
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  postWithHostsInHeader: <T>(endpoint: string, hosts: string[], data?: unknown) => {
    if (hosts.length === 0) {
      return Promise.resolve([] as T)
    }
    return apiRequest<T>(endpoint, {
      method: 'POST',
      headers: {
        'X-Target-Hosts': JSON.stringify(hosts),
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  },
  put: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, {
      method: 'DELETE',
    }),
}

export type { ApiError }
