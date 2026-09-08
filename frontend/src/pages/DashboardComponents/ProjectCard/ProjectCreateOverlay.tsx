import { useState } from 'react';
import { X } from 'lucide-react';
import { createProject } from '../../../api/projects';

interface ProjectCreateOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated: () => void;
}

export default function ProjectCreateOverlay({
    isOpen,
    onClose,
    onProjectCreated,
}: ProjectCreateOverlayProps) {
    const [projectName, setProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent double submission
        if (isCreating) return;

        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            await createProject({ name: projectName.trim() });
            setProjectName('');
            onProjectCreated();
            onClose();
        } catch (err) {
            setError('Failed to create project');
            console.error('Error creating project:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setProjectName('');
        setError('');
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] flex items-center justify-center"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl p-6 w-96 max-w-[90vw] shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">Create New Project</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        disabled={isCreating}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="projectName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Project Name
                        </label>
                        <input
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Enter project name..."
                            disabled={isCreating}
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isCreating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isCreating || !projectName.trim()}
                        >
                            {isCreating ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
