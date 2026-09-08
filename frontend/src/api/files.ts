import { request } from './http';
import type { FSEntryResponse, PathRequest, MoveRequest } from './folder';
import { addFile, commitFile, execGitCommand } from './projects';

// list folder/file entries
export function listFiles(projectId: string, path = ''): Promise<FSEntryResponse[]> {
    return request(`/projects/${projectId}/files`, {
        params: { path },
    });
}

// download as blob
export function downloadFile(projectId: string, path: string): Promise<Blob> {
    return request(`/projects/${projectId}/files`, {
        params: { path },
        responseType: 'blob',
    });
}

// Upload file
export async function uploadFile(projectId: string, file: File, path = ''): Promise<void> {
    await request(`/projects/${projectId}/files/upload`, {
        method: 'POST',
        params: { path },
        data: file,
        headers: {
            'Content-Type': 'application/octet-stream',
        },
    });
    
    try {
        const isInSubfolder = path.includes('/');
        
        if (isInSubfolder) {
            await execGitCommand(projectId, 'add', ['*']);
            await commitFile(projectId, path, 'add');
        } else {
            await addFile(projectId, path);
            await commitFile(projectId, path, 'add');
        }
    } catch (error) {
        console.error(`Error adding/committing file ${path} to Git:`, error);
    }
}

// create empty file
export async function createFile(projectId: string, payload: PathRequest): Promise<void> {
    await request(`/projects/${projectId}/files`, {
        method: 'POST',
        data: payload,
    });
    
    try {
        await addFile(projectId, payload.relativePath);
        await commitFile(projectId, payload.relativePath, 'create');
    } catch (error) {
        console.error(`Error adding/committing file ${payload.relativePath} to Git:`, error);
    }
}

// move/rename file
export function moveFile(projectId: string, payload: MoveRequest): Promise<void> {
    return request(`/projects/${projectId}/files/move`, {
        method: 'PUT',
        data: payload,
    });
}

// delete file
export function deleteFile(projectId: string, path: string): Promise<void> {
    return request(`/projects/${projectId}/files`, {
        method: 'DELETE',
        params: { path },
    });
}
