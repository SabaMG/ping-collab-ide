const API_BASE = import.meta.env.VITE_API_URL;

// Simple JWT decoder to get user ID from token
export function getUserIdFromToken(): string | null {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null; // 'sub' is the standard JWT subject claim
    } catch {
        return null;
    }
}

export function getToken(): string | null {
    return localStorage.getItem('jwt_token');
}

export function setToken(token: string) {
    localStorage.setItem('jwt_token', token);
}

export function clearToken() {
    localStorage.removeItem('jwt_token');
}

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
    data?: unknown;
    params?: Record<string, string | number>;
    headers?: HeadersInit;
    responseType?: 'json' | 'blob' | 'text';
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function makeRequest<T>(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: string | FormData | Blob | ArrayBuffer | null,
    rest?: { responseType?: 'json' | 'blob' | 'text' } & Record<string, unknown>
): Promise<T> {
    const res = await fetch(url, {
        method,
        headers,
        body,
        ...rest,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    // Handle response based on responseType or content-type
    if (rest?.responseType === 'blob') {
        return (await res.blob()) as unknown as T;
    } else if (rest?.responseType === 'text') {
        return (await res.text()) as unknown as T;
    } else {
        // Default behavior: try JSON, else return blob
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json')
            ? await res.json()
            : ((await res.blob()) as unknown as T);
    }
}

export async function request<T>(
    path: string,
    { method = 'GET', data, params, headers = {}, ...rest }: RequestOptions = {}
): Promise<T> {
    // build URL + querystring
    let url = `${API_BASE}${path}`;
    if (params) {
        const qs = new URLSearchParams(
            Object.entries(params).map(([k, v]) => [k, String(v)])
        ).toString();
        url += `?${qs}`;
    }

    console.log(`API Request: ${method} ${url}`);

    // headers + auth
    // Ensure headers is always a plain object for property assignment
    const h: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (headers instanceof Headers) {
        headers.forEach((value, key) => {
            h[key] = value;
        });
    } else if (typeof headers === 'object' && headers !== null) {
        Object.entries(headers).forEach(([key, value]) => {
            h[key] = String(value);
        });
    }
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;

    const body =
        data != null
            ? h['Content-Type'] === 'application/json'
                ? JSON.stringify(data)
                : (data as string | FormData | Blob | ArrayBuffer)
            : undefined;

    try {
        return await makeRequest<T>(url, method, h, body, rest);
    } catch (error) {
        // Handle token expiration (401 Unauthorized)
        if (
            error instanceof Error &&
            error.message.includes('HTTP 401') &&
            path !== '/user/refresh' &&
            path !== '/user/login'
        ) {
            console.log('Token expired, attempting refresh...');

            try {
                // Prevent multiple simultaneous refresh attempts
                if (!isRefreshing) {
                    isRefreshing = true;
                    const { refreshToken } = await import('./auth');
                    refreshPromise = refreshToken();
                }

                if (refreshPromise) {
                    const newToken = await refreshPromise;
                    h['Authorization'] = `Bearer ${newToken}`;

                    // Retry the original request with new token
                    return await makeRequest<T>(url, method, h, body, rest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                clearToken();
                // Redirect to login or emit logout event
                window.location.href = '/login';
                throw new Error('Authentication failed. Please log in again.');
            } finally {
                isRefreshing = false;
                refreshPromise = null;
            }
        }

        throw error;
    }
}
