import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import {
    updateUser,
    deleteUser,
    type UpdateUserRequest,
    type UserResponse,
} from '../../../api/user';

interface UserEditOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
    user: UserResponse | null;
}

export default function UserEditOverlay({
    isOpen,
    onClose,
    onUserUpdated,
    user,
}: UserEditOverlayProps) {
    const [formData, setFormData] = useState<UpdateUserRequest & { displayName: string }>({
        displayName: '',
        password: '',
        avatar: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                password: '',
                avatar: user.avatar || '',
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        if (!formData.displayName.trim()) {
            setError('Display name is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const updatePayload: UpdateUserRequest = {
                displayName: formData.displayName.trim(),
                password: formData.password ? formData.password.trim() : '',
                avatar: formData.avatar ? formData.avatar.trim() : '',
            };

            await updateUser(user.id, updatePayload);
            onUserUpdated();
            onClose();
        } catch (err) {
            setError('Failed to update user');
            console.error('Error updating user:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleClose = () => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                password: '',
                avatar: user.avatar || '',
            });
        }
        setError(null);
        setShowDeleteConfirm(false);
        setIsDeleting(false);
        onClose();
    };

    const handleDelete = async () => {
        if (!user || isDeleting) return;

        setIsDeleting(true);
        setError(null);

        try {
            await deleteUser(user.id);
            onUserUpdated();
            onClose();
        } catch (err) {
            setError('Failed to delete user');
            console.error('Error deleting user:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div
            className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-primary">Edit User</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        aria-label="Close"
                        disabled={loading || isDeleting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Read-only fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username (read-only)
                        </label>
                        <input
                            type="text"
                            value={user.login}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            disabled
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Status (read-only)
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                            {user.isAdmin ? 'Administrator' : 'Regular User'}
                        </div>
                    </div>

                    {/* Editable fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Enter display name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password (optional)
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Leave empty to keep current password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avatar URL (optional)
                        </label>
                        <input
                            type="url"
                            name="avatar"
                            value={formData.avatar}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Enter avatar URL"
                        />
                    </div>

                    {/* Delete Section */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h3>
                            <p className="text-xs text-red-600 mb-3">
                                Deleting this user will permanently remove their account and all
                                associated data. This action cannot be undone.
                            </p>
                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                    disabled={loading || isDeleting}
                                >
                                    <Trash2 size={16} />
                                    <span>Delete User</span>
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-red-800">
                                        Are you sure you want to delete this user?
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

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={loading || isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isDeleting || !formData.displayName.trim()}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Updating...' : 'Update User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
