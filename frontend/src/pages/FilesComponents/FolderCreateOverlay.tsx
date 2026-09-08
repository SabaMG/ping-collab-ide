import { useState } from 'react';
import { X } from 'lucide-react';

interface FolderCreateOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onFolderCreate: (folderName: string) => void;
    loading?: boolean;
}

export default function FolderCreateOverlay({
    isOpen,
    onClose,
    onFolderCreate,
    loading = false,
}: FolderCreateOverlayProps) {
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!folderName.trim()) {
            setError('Folder name is required');
            return;
        }

        // Basic validation for folder name
        if (!/^[a-zA-Z0-9._-]+$/.test(folderName)) {
            setError(
                'Folder name can only contain letters, numbers, dots, hyphens, and underscores'
            );
            return;
        }

        try {
            setError(null);
            await onFolderCreate(folderName.trim());
            handleClose();
        } catch (err) {
            setError('Failed to create folder');
            console.error('Error creating folder:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFolderName(e.target.value);
        if (error) setError(null); // Clear error when user starts typing
    };

    const handleClose = () => {
        setFolderName('');
        setError(null);
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
            className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-primary">Create New Folder</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={folderName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter folder name"
                            required
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Only letters, numbers, dots, hyphens, and underscores are allowed
                        </p>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !folderName.trim()}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Folder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
