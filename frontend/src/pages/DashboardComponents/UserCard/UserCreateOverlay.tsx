import { useState } from 'react';
import { X } from 'lucide-react';
import { createUser, type NewUserRequest } from '../../../api/user';

interface UserCreateOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

export default function UserCreateOverlay({
    isOpen,
    onClose,
    onUserCreated,
}: UserCreateOverlayProps) {
    const [formData, setFormData] = useState<NewUserRequest>({
        login: '',
        password: '',
        isAdmin: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.login.trim() || !formData.password.trim()) {
            setError('Login and password are required');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await createUser(formData);
            onUserCreated();
            onClose();
            // Reset form
            setFormData({
                login: '',
                password: '',
                isAdmin: false,
            });
        } catch (err) {
            setError('Failed to create user');
            console.error('Error creating user:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleClose = () => {
        setFormData({
            login: '',
            password: '',
            isAdmin: false,
        });
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
                    <h2 className="text-xl font-semibold text-primary">Create New User</h2>
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
                            Login (name.lastname)
                        </label>
                        <input
                            type="text"
                            name="login"
                            value={formData.login}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter login"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="isAdmin"
                            checked={formData.isAdmin}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-primary"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                            Administrator privileges
                        </label>
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
                            disabled={
                                loading || !formData.login.trim() || !formData.password.trim()
                            }
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
