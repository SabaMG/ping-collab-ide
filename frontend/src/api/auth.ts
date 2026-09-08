import { request, setToken, clearToken } from './http';
import { refreshToken as apiRefreshToken } from './user';

interface LoginResponse {
    token: string;
}

export async function login(username: string, password: string): Promise<void> {
    const { token } = await request<LoginResponse>('/user/login', {
        method: 'POST',
        data: { login: username, password },
    });
    setToken(token);
}

export async function refreshToken(): Promise<string> {
    const { token } = await apiRefreshToken();
    setToken(token);
    return token;
}

export function logout(): void {
    clearToken();
}
