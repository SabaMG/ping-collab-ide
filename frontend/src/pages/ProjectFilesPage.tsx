import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import PagesLayout from '../global_components/PagesLayout';
import { uploadFile } from '../api/files';
import { listFolder, createFolder } from '../api/folder';
import { listMyProjects } from '../api/projects';
import { FiFolder, FiFile, FiArrowLeft, FiPlus } from 'react-icons/fi';
import type { FSEntryResponse, PathRequest } from '../api/folder';
import FolderCreateOverlay from './FilesComponents/FolderCreateOverlay';
import { useAuth } from '../Auth';
import { listUsers, type UserResponse } from '../api/user';
import { addUserToProject, removeUserFromProject } from '../api/projects';

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function ProjectFilesPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const [files, setFiles] = useState<FSEntryResponse[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<FSEntryResponse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [projectName, setProjectName] = useState<string>('');
    const [currentPath, setCurrentPath] = useState<string>(''); // gestion dynamique du path
    const [showCreateFolderOverlay, setShowCreateFolderOverlay] = useState(false);
    const [folderCreationLoading, setFolderCreationLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [projectOwnerId, setProjectOwnerId] = useState<string | null>(null);
    const { currentUser } = useAuth();
    const [showAccessOverlay, setShowAccessOverlay] = useState(false);
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [originalMembers, setOriginalMembers] = useState<string[]>([]);
    const [isAccessUpdating, setIsAccessUpdating] = useState(false);

    const fetchFiles = async (path = '') => {
        if (!projectId) return;
        setLoading(true);
        try {
            const data = await listFolder(projectId, path);
            setFiles(data);
            setFilteredFiles(data); // Initialize filtered files
        } catch (error) {
            console.error('Failed to fetch folder contents:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectName = async () => {
        if (!projectId) return;
        try {
            const projects = await listMyProjects();
            const project = projects.find((p) => p.id === projectId);
            setProjectName(project?.name || 'Unknown Project');
            setProjectOwnerId(project?.owner.id || null);
        } catch (error) {
            console.error('Failed to fetch project name:', error);
            setProjectName('Unknown Project');
        }
    };

    const accessControlButton =
        currentUser && projectOwnerId === currentUser.id ? (
            <button
                onClick={() => setShowAccessOverlay(true)}
                className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
            >
                Manage Access
            </button>
        ) : null;

    useEffect(() => {
        fetchFiles(currentPath);
        fetchProjectName();
    }, [projectId, currentPath]);

    // Filter files based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredFiles(files);
        } else {
            const filtered = files.filter((file) =>
                file.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredFiles(filtered);
        }
    }, [searchQuery, files]);

    useEffect(() => {
        if (showAccessOverlay && projectId) {
            loadAccessManagementData();
        }
    }, [showAccessOverlay, projectId]);

    const loadAccessManagementData = async () => {
        try {
            const users = await listUsers();
            setAllUsers(users);

            // Load current members
            const projects = await listMyProjects();
            const project = projects.find((p) => p.id === projectId);
            const memberIds = project?.members.map((m) => m.id) || [];
            setSelectedMembers(memberIds);
            setOriginalMembers(memberIds);
        } catch (error) {
            console.error('Failed to load users or project members:', error);
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleAccessSave = async () => {
        if (!projectId) return;
        setIsAccessUpdating(true);
        try {
            const membersToAdd = selectedMembers.filter((id) => !originalMembers.includes(id));
            const membersToRemove = originalMembers.filter((id) => !selectedMembers.includes(id));

            for (const userId of membersToAdd) {
                await addUserToProject(projectId, { userId });
            }
            for (const userId of membersToRemove) {
                await removeUserFromProject(projectId, { userId });
            }

            setShowAccessOverlay(false);
        } catch (error) {
            console.error('Failed to update project members:', error);
        } finally {
            setIsAccessUpdating(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !projectId) return;

        try {
            const uploadPath = currentPath ? `${currentPath}/${file.name}` : file.name;
            await uploadFile(projectId, file, uploadPath);
            await fetchFiles(currentPath);
        } catch (error) {
            console.error('File upload failed:', error);
        }
    };

    const handleFolderClick = (folderPath: string) => {
        setCurrentPath(folderPath);
    };

    const handleBackClick = () => {
        if (!currentPath) return;
        const parts = currentPath.split('/');
        parts.pop();
        const newPath = parts.join('/');
        setCurrentPath(newPath);
    };

    const handleCreateFolder = async (folderName: string) => {
        if (!projectId) return;

        const relativePath = currentPath ? `${currentPath}/${folderName}` : folderName;
        const payload: PathRequest = { relativePath };

        try {
            setFolderCreationLoading(true);
            await createFolder(projectId, payload);
            await fetchFiles(currentPath);
        } catch (error) {
            console.error('Failed to create folder:', error);
            throw error; // Re-throw so the overlay can handle the error
        } finally {
            setFolderCreationLoading(false);
        }
    };

    return (
        <PagesLayout
            active="files"
            title={`Project: ${projectName}`}
            showSearch
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search files and folders..."
            customControls={accessControlButton}
        >
            {loading ? (
                <p>Loading files...</p>
            ) : (
                <div className="bg-white w-full h-full shadow rounded-lg p-6 space-y-3">
                    {currentPath && (
                        <div className="flex items-center space-x-4 mb-4 p-3">
                            <button
                                onClick={handleBackClick}
                                className="flex items-center space-x-2 text-primary hover:text-blue-700 transition-colors"
                            >
                                <FiArrowLeft className="w-4 h-4" />
                                <span className="font-medium">Back</span>
                            </button>
                            <div className="flex items-center text-gray-700">
                                <span className="ml-2 px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-sm italic text-primary shadow-sm border border-blue-200">
                                    /{currentPath}
                                </span>
                            </div>
                        </div>
                    )}

                    {filteredFiles.length === 0 ? (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-gray-500">
                                {searchQuery
                                    ? 'No files or folders found matching your search.'
                                    : 'This folder is empty.'}
                            </p>
                        </div>
                    ) : (
                        filteredFiles.map((file) => (
                            <div
                                key={file.path}
                                className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-lg p-4 cursor-pointer transition"
                                onClick={() => {
                                    if (file.directory) {
                                        handleFolderClick(file.path);
                                    } else {
                                        const encodedPath = encodeURIComponent(file.path);
                                        console.log('Chemin encodé:', encodedPath);
                                        navigate(`/projects/${projectId}/files?file=${encodedPath}`);
                                        console.log('Navigation vers le fichier:', file.path);
                                    }
                                }}
                            >
                                <div className="flex items-center space-x-3">
                                    {file.directory ? (
                                        <FiFolder className="text-primary w-5 h-5" />
                                    ) : (
                                        <FiFile className="text-primary w-5 h-5" />
                                    )}
                                    <span className="text-primary font-medium">{file.name}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {!file.directory &&
                                        file.sizeInBytes !== undefined &&
                                        formatFileSize(file.sizeInBytes)}
                                </div>
                            </div>
                        ))
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex space-x-2 mt-4">
                        <button
                            onClick={handleImportClick}
                            className="w-full py-2 rounded bg-gray-200 hover:bg-gray-300 text-center text-primary transition flex items-center justify-center space-x-2"
                        >
                            <FiPlus />
                            <span>Import File</span>
                        </button>
                        <button
                            onClick={() => setShowCreateFolderOverlay(true)}
                            className="w-full py-2 rounded bg-gray-200 hover:bg-gray-300 text-center text-primary transition flex items-center justify-center space-x-2"
                        >
                            <FiPlus />
                            <span>Create Folder</span>
                        </button>
                    </div>
                </div>
            )}
            {showAccessOverlay && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-4 text-primary">
                            Manage Project Access
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Select the members who should have access to this project.
                        </p>
                        <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1 mb-4">
                            {allUsers.map((user) => (
                                <label
                                    key={user.id}
                                    className="flex items-center space-x-2 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(user.id)}
                                        onChange={() => toggleMember(user.id)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                        disabled={isAccessUpdating}
                                    />
                                    <span className="text-sm">
                                        {user.displayName} ({user.login})
                                    </span>
                                </label>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowAccessOverlay(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                disabled={isAccessUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAccessSave}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isAccessUpdating}
                            >
                                {isAccessUpdating ? 'Saving...' : 'Save Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <FolderCreateOverlay
                isOpen={showCreateFolderOverlay}
                onClose={() => setShowCreateFolderOverlay(false)}
                onFolderCreate={handleCreateFolder}
                loading={folderCreationLoading}
            />
        </PagesLayout>
    );
}
