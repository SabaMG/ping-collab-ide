import { request } from './http';

export interface UserResponse {
    id: string;
    login: string;
    displayName: string;
    isAdmin: boolean;
    avatar?: string;
}
export interface NewUserRequest {
    login: string;
    password: string;
    isAdmin: boolean;
}
export interface UpdateUserRequest {
    password: string;
    displayName: string;
    avatar: string;
}

// get current user profile
export function getCurrentUser(): Promise<UserResponse> {
    return request('/user/me');
}

// create user (admin only)
export function createUser(payload: NewUserRequest): Promise<UserResponse> {
    return request('/user', { method: 'POST', data: payload });
}

// list all users (admin only)
export function listUsers(): Promise<UserResponse[]> {
    return request('/user/all');
}

// get a single user by id
export function getUser(id: string): Promise<UserResponse> {
    return request(`/user/${id}`);
}

// update a user
export function updateUser(id: string, payload: UpdateUserRequest): Promise<UserResponse> {
    return request(`/user/${id}`, { method: 'PUT', data: payload });
}

// delete a user
export function deleteUser(id: string): Promise<void> {
    return request(`/user/${id}`, { method: 'DELETE' });
}

// refresh token
export function refreshToken(): Promise<{ token: string }> {
    return request('/user/refresh');
}
