import { request } from './http';

export interface UserSummaryResponse {
    id: string;
    displayName: string;
    avatar: string;
}
export interface ProjectResponse {
    id: string;
    name: string;
    owner: UserSummaryResponse;
    members: UserSummaryResponse[];
}

export interface NewProjectRequest {
    name: string;
}
export interface UpdateProjectRequest {
    name?: string;
    newOwnerId?: string;
}
export interface UserProjectRequest {
    userId: string;
}
export interface ProjectStorageResponse {
    id: string;
    name: string;
    sizeInBytes: number;
}

export interface ProjectStorageListResponse extends Array<ProjectStorageResponse> {}
export interface ExecFeatureRequest {
    feature: string;
    command: string;
    params?: string[];
}

export interface FileVersion {
    hash: string;
    author: string;
    date: string;
    message: string;
    versionNumber?: number;
    isHead?: boolean;
}

export function listMyProjects(onlyOwned?: boolean): Promise<ProjectResponse[]> {
    return request('/projects', { params: { onlyOwned: onlyOwned ? 1 : 0 } });
}

export function listAllProjects(): Promise<ProjectResponse[]> {
    return request('/projects/all');
}

export async function createProject(payload: NewProjectRequest): Promise<ProjectResponse> {
    const project = (await request('/projects', {
        method: 'POST',
        data: payload,
    })) as ProjectResponse;

    try {
        await initGitRepo(project.id);
    } catch (error) {
        console.error(
            `Erreur lors de l'initialisation du dépôt Git pour le projet ${project.id}:`,
            error
        );
    }

    return project;
}

export function getProject(id: string): Promise<ProjectResponse> {
    return request(`/projects/${id}`);
}

export function updateProject(id: string, payload: UpdateProjectRequest): Promise<ProjectResponse> {
    return request(`/projects/${id}`, { method: 'PUT', data: payload });
}

export function deleteProject(id: string): Promise<void> {
    return request(`/projects/${id}`, { method: 'DELETE' });
}

export function addUserToProject(
    id: string,
    payload: UserProjectRequest
): Promise<ProjectResponse> {
    return request(`/projects/${id}/add-user`, { method: 'POST', data: payload });
}

export function removeUserFromProject(id: string, payload: UserProjectRequest): Promise<void> {
    return request(`/projects/${id}/remove-user`, { method: 'POST', data: payload });
}

export function execProjectFeature(id: string, payload: ExecFeatureRequest): Promise<unknown> {
    return request(`/projects/${id}/exec`, { method: 'POST', data: payload });
}

export function getProjectsStorage(): Promise<ProjectStorageListResponse> {
    return request('/projects/storage');
}

export function execGitCommand(
    projectId: string,
    command: string,
    params: string[] = []
): Promise<unknown> {
    return request(`/projects/${projectId}/exec`, {
        method: 'POST',
        data: {
            feature: 'git',
            command: command,
            params: params,
        },
    }).catch((error) => {
        console.error(`Error executing git ${command}:`, error);
        throw error;
    });
}

export function initGitRepo(projectId: string): Promise<unknown> {
    try {
        return execGitCommand(projectId, 'init');
    } catch (error) {
        console.error('Error verifying Git repository:', error);
        return execGitCommand(projectId, 'init');
    }
}

export function addFile(projectId: string, filePath: string): Promise<unknown> {
    console.log('adding to git :', filePath);
    return execGitCommand(projectId, 'add', ['*']); //[escapedPath]);
}

export async function commitFile(
    projectId: string,
    _filePath: string,
    description: string = 'update'
): Promise<unknown> {
    console.log('commiting to git :', _filePath);
    return execGitCommand(projectId, 'commit', [
        `[ping] ${description} - ${new Date().toISOString()}`,
    ]);
}

export async function listFileVersions(
    projectId: string,
    filePath: string
): Promise<FileVersion[]> {
    try {
        const response = await execGitCommand(projectId, 'log', [filePath]);
        let output: string;
        if (response && typeof response === 'object' && 'output' in response) {
            output = (response as { output: string }).output;
        } else {
            output = response as string;
        }

        if (!output || typeof output !== 'string') {
            return [];
        }

        const commits = [];
        const commitPattern = /commit ([a-f0-9]+)\nAuthor: ([^\n]+)\nDate: ([^\n]+)\n\n([^\n]+)/g;

        let match;
        while ((match = commitPattern.exec(output)) !== null) {
            commits.push({
                hash: match[1],
                author: match[2],
                date: match[3],
                message: match[4].trim(),
            });
        }

        const numberedCommits = commits.map((commit, index) => ({
            ...commit,
            versionNumber: commits.length - 1 - index,
            isHead: index === 0,
        }));

        return numberedCommits;
    } catch (error) {
        console.error(`Error executing git log for ${filePath}:`, error);
        return [];
    }
}

export function getFileVersionContent(
    projectId: string,
    filePath: string,
    hash: string
): Promise<string> {
    if (hash === 'HEAD') {
        return getCurrentFileContent(projectId, filePath);
    }

    return execGitCommand(projectId, 'show', [`${hash}:${filePath}`])
        .then((response) => {
            if (response && typeof response === 'object' && 'output' in response) {
                return (response as { output: string }).output;
            } else {
                return response as string;
            }
        })
        .catch((error) => {
            console.error(`Error retrieving content for version ${hash}:`, error);
            return getCurrentFileContent(projectId, filePath);
        });
}

export function getCurrentFileContent(projectId: string, filePath: string): Promise<string> {
    return request(`/projects/${projectId}/files/download`, {
        method: 'GET',
        params: { path: filePath },
        responseType: 'text',
    })
        .then((response) => {
            if (response && typeof response === 'object' && 'output' in response) {
                return (response as { output: string }).output;
            } else {
                return response as string;
            }
        })
        .catch((error) => {
            console.error(`Error loading file content:`, error);
            return `// The file ${filePath} could not be loaded.
// Error: ${error.message}`;
        });
}
