import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateUser, getCurrentUser, type UpdateUserRequest, type UserResponse } from '../api/user';

interface SettingsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsOverlay({ isOpen, onClose }: SettingsOverlayProps) {
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [formData, setFormData] = useState({
        displayName: '',
        password: '',
        avatar: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load current user data when overlay opens
    useEffect(() => {
        if (isOpen && !currentUser) {
            loadCurrentUser();
        }
    }, [isOpen]);

    const loadCurrentUser = async () => {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user);
            setFormData({
                displayName: user.displayName || '',
                password: '',
                avatar: user.avatar || '',
            });
        } catch (err) {
            console.error('Failed to load current user:', err);
            setError('Failed to load user information');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        if (!formData.displayName.trim()) {
            setError('Display name is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const updatePayload: UpdateUserRequest = {
                displayName: formData.displayName.trim(),
                password: formData.password ? formData.password.trim() : '',
                avatar: formData.avatar ? formData.avatar.trim() : '',
            };

            await updateUser(currentUser.id, updatePayload);
            setSuccess('Settings updated successfully!');

            // Update local user data
            setCurrentUser((prev) =>
                prev
                    ? {
                          ...prev,
                          displayName: updatePayload.displayName,
                          avatar: updatePayload.avatar,
                      }
                    : null
            );

            // Clear password field after successful update
            setFormData((prev) => ({ ...prev, password: '' }));
        } catch (err) {
            setError('Failed to update settings');
            console.error('Error updating user settings:', err);
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
        // Clear messages when user starts typing
        if (error) setError(null);
        if (success) setSuccess(null);
    };

    const handleClose = () => {
        if (currentUser) {
            setFormData({
                displayName: currentUser.displayName || '',
                password: '',
                avatar: currentUser.avatar || '',
            });
        }
        setError(null);
        setSuccess(null);
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
                    <h2 className="text-xl font-semibold text-primary">User Settings</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {!currentUser ? (
                    <div className="text-center py-4">
                        <p className="text-gray-600">Loading user information...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Read-only username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={currentUser.login}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                disabled
                            />
                        </div>

                        {/* Editable display name */}
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
                                placeholder="Enter your display name"
                                required
                            />
                        </div>

                        {/* Password change */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Leave empty to keep current password"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Only fill this if you want to change your password
                            </p>
                        </div>

                        {/* Avatar URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Avatar URL
                            </label>
                            <input
                                type="url"
                                name="avatar"
                                value={formData.avatar}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Enter avatar image URL (optional)"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="text-green-500 text-sm bg-green-50 p-2 rounded">
                                {success}
                            </div>
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
                                disabled={loading || !formData.displayName.trim()}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
