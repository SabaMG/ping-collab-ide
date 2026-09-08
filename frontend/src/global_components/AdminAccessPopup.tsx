import { X } from 'lucide-react';
import { FiLock } from 'react-icons/fi';

interface AdminAccessPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminAccessPopup({ isOpen, onClose }: AdminAccessPopupProps) {
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-red-600">Access Restricted</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="text-center">
                    <div className="flex justify-center mb-3">
                        <FiLock size={48} className="text-red-500" />
                    </div>
                    <p className="text-gray-700 mb-4">
                        Admin access is required to view the dashboard.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Please contact your administrator if you need access to this feature.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
