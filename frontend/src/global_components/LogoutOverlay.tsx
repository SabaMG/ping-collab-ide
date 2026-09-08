import { X } from 'lucide-react';

interface LogoutOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutOverlay({ isOpen, onClose, onConfirm }: LogoutOverlayProps) {
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
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-primary">Log out?</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">Are you sure you want to disconnect?</p>

                <div className="flex space-x-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Yes, log out
                    </button>
                </div>
            </div>
        </div>
    );
}
