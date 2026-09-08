import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import {
    updateProject,
    getProject,
    addUserToProject,
    removeUserFromProject,
    deleteProject,
} from '../../../api/projects';
import { listUsers, type UserResponse } from '../../../api/user';

interface ProjectEditOverlayProps {
    isOpen: boolean;
    projectId: string | null;
    onClose: () => void;
    onProjectUpdated: () => void;
}

export default function ProjectEditOverlay({
    isOpen,
    projectId,
    onClose,
    onProjectUpdated,
}: ProjectEditOverlayProps) {
    const [projectName, setProjectName] = useState('');
    const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [originalMembers, setOriginalMembers] = useState<string[]>([]);
    const [selectedOwner, setSelectedOwner] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState('');

    // Load project data when overlay opens
    useEffect(() => {
        if (isOpen && projectId) {
            loadProjectData();
        }
    }, [isOpen, projectId]);

    const loadProjectData = async () => {
        if (!projectId) return;

        setIsLoading(true);
        setError('');

        try {
            const [projectData, usersData] = await Promise.all([
                getProject(projectId),
                listUsers(),
            ]);

            setProjectName(projectData.name);
            setSelectedOwner(projectData.owner.id);
            const memberIds = projectData.members.map((m) => m.id);
            setSelectedMembers(memberIds);
            setOriginalMembers(memberIds);
            setAllUsers(usersData);
        } catch (err) {
            setError('Failed to load project data');
            console.error('Error loading project:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isUpdating || !projectId) return;

        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setIsUpdating(true);
        setError('');

        try {
            // Ensure the new owner is included in the members list
            let finalSelectedMembers = [...selectedMembers];
            if (!finalSelectedMembers.includes(selectedOwner)) {
                finalSelectedMembers.push(selectedOwner);
            }

            // First, handle member additions - especially important if the new owner isn't already a member
            const membersToAdd = finalSelectedMembers.filter((id) => !originalMembers.includes(id));
            const membersToRemove = originalMembers.filter(
                (id) => !finalSelectedMembers.includes(id)
            );

            // Add new members first (including the new owner if they weren't already a member)
            for (const userId of membersToAdd) {
                await addUserToProject(projectId, { userId });
            }

            // Now update project name and owner (owner should now be a member)
            await updateProject(projectId, {
                name: projectName.trim(),
                newOwnerId: selectedOwner,
            });

            // Finally, remove members (but only after ownership change to avoid removing the new owner)
            for (const userId of membersToRemove) {
                await removeUserFromProject(projectId, { userId });
            }

            onProjectUpdated();
            onClose();
        } catch (err) {
            setError('Failed to update project');
            console.error('Error updating project:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleClose = () => {
        setProjectName('');
        setSelectedMembers([]);
        setOriginalMembers([]);
        setSelectedOwner('');
        setShowDeleteConfirm(false);
        setIsDeleting(false);
        setError('');
        onClose();
    };

    const handleDelete = async () => {
        if (!projectId || isDeleting) return;

        setIsDeleting(true);
        setError('');

        try {
            await deleteProject(projectId);
            onProjectUpdated();
            onClose();
        } catch (err) {
            setError('Failed to delete project');
            console.error('Error deleting project:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] flex items-center justify-center"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl p-6 w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">Edit Project</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        disabled={isUpdating}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-gray-500">Loading project data...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Project Name */}
                        <div>
                            <label
                                htmlFor="editProjectName"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Project Name
                            </label>
                            <input
                                type="text"
                                id="editProjectName"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Enter project name..."
                                disabled={isUpdating}
                            />
                        </div>

                        {/* Owner Selection */}
                        <div>
                            <label
                                htmlFor="projectOwner"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Owner
                            </label>
                            <select
                                id="projectOwner"
                                value={selectedOwner}
                                onChange={(e) => {
                                    const newOwnerId = e.target.value;
                                    setSelectedOwner(newOwnerId);
                                    // Automatically add the new owner to members if not already included
                                    if (!selectedMembers.includes(newOwnerId)) {
                                        setSelectedMembers((prev) => [...prev, newOwnerId]);
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                disabled={isUpdating}
                            >
                                {allUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.displayName} ({user.login})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                The owner will automatically be added as a project member.
                            </p>
                        </div>

                        {/* Members Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Members
                            </label>
                            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
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
                                            disabled={isUpdating}
                                        />
                                        <span className="text-sm">
                                            {user.displayName} ({user.login})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Delete Section */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-red-800 mb-2">
                                    Danger Zone
                                </h3>
                                <p className="text-xs text-red-600 mb-3">
                                    Deleting this project will permanently remove all associated
                                    data. This action cannot be undone.
                                </p>
                                {!showDeleteConfirm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                        disabled={isUpdating || isDeleting}
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete Project</span>
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-red-800">
                                            Are you sure you want to delete this project?
                                        </p>
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                disabled={isDeleting}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={isUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isUpdating || !projectName.trim()}
                            >
                                {isUpdating ? 'Updating...' : 'Update Project'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
