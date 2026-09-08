import { X } from 'lucide-react';

interface InfoOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InfoOverlay({ isOpen, onClose }: InfoOverlayProps) {
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
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-primary">About AilCloud</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-primary mb-4">
                            Welcome to AilCloud
                        </h3>
                        <div className="space-y-4 text-gray-700">
                            <p className="text-lg leading-relaxed">
                                AilCloud is a collaborative project management platform designed to
                                streamline file sharing, project organization, and team
                                collaboration.
                            </p>
                            <p className="leading-relaxed">
                                Our platform provides secure file management, real-time
                                collaboration tools, and intuitive project organization features to
                                help teams work more efficiently.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-semibold text-primary mb-4 text-center">
                            Development Team
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-primary">Backend Development</h4>
                                <p className="text-sm mt-1">Quarkus Framework (Java 21)</p>
                                <p className="text-sm">PostgreSQL Database</p>
                                <p className="text-sm">JWT Authentication</p>
                                <p className="text-sm">Apache Lucene Search</p>
                                <p className="text-sm">JGit Git Integration</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-primary">Frontend Development</h4>
                                <p className="text-sm mt-1">React 19 & TypeScript</p>
                                <p className="text-sm">React Router for Navigation</p>
                                <p className="text-sm">Tailwind CSS Styling</p>
                                <p className="text-sm">Lucide & React Icons</p>
                                <p className="text-sm">Chart Visualizations</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-semibold text-primary mb-4 text-center">
                            Technology Stack
                        </h3>

                        <div className="flex flex-wrap justify-center gap-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                React 19
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                TypeScript
                            </span>
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                Quarkus
                            </span>
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                                Java 21
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                Tailwind CSS
                            </span>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                PostgreSQL
                            </span>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                Vite
                            </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                                Apache Lucene
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Built by Thomas Polverelli, Tristan Faure, Arthur Garraud, Shams Rezgui,
                            Iliane Formet, Ronan Roy{' '}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">© 2025 PING Project EPITA</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
