import { X, Shield } from 'lucide-react';

interface AdminAccessDeniedOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminAccessDeniedOverlay({
    isOpen,
    onClose,
}: AdminAccessDeniedOverlayProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <Shield className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-700">
                        You don't have administrator privileges to access the Admin Dashboard.
                    </p>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-orange-800 text-sm">
                            <strong>Need admin access?</strong>
                            <br />
                            If you believe this is a mistake or you need administrator privileges,
                            please contact your system administrator.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium"
                    >
                        Understood
                    </button>
                </div>
            </div>
        </div>
    );
}
