import { request } from './http';

export interface FSEntryResponse {
    name: string;
    path: string;
    directory: boolean;
    sizeInBytes?: number; // Size in bytes, only present for files
}

export interface PathRequest {
    relativePath: string;
}
export interface MoveRequest {
    src: string;
    dst: string;
}

// list contents of a folder
export function listFolder(projectId: string, path = ''): Promise<FSEntryResponse[]> {
    return request(`/projects/${projectId}/folders`, {
        params: { path },
    })
    .then(response => {
        const entries = response as FSEntryResponse[];
        return entries.filter(entry => !entry.name.startsWith('.'));
    });
}

// create a folder
export function createFolder(projectId: string, payload: PathRequest): Promise<void> {
    return request(`/projects/${projectId}/folders`, {
        method: 'POST',
        data: payload,
    });
}

// delete a folder
export function deleteFolder(projectId: string, path: string): Promise<void> {
    return request(`/projects/${projectId}/folders`, {
        method: 'DELETE',
        params: { path },
    });
}

// move/rename a folder
export function moveFolder(projectId: string, payload: MoveRequest): Promise<void> {
    return request(`/projects/${projectId}/folders/move`, {
        method: 'PUT',
        data: payload,
    });
}
