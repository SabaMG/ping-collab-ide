import { useEffect, useState } from 'react';
import { getLogs, type LogResponse } from '../../api';
import { getCurrentUser, type UserResponse } from '../../api/user';
import { IoReload } from 'react-icons/io5';

export default function LogCard() {
    const [logs, setLogs] = useState<LogResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserResponse | null>(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null); // Clear previous errors

            // First, get current user info to check admin status
            const user = await getCurrentUser();
            setUserInfo(user);

            if (!user.isAdmin) {
                setError('Admin access required to view logs');
                return;
            }

            const fetchedLogs = await getLogs();
            // Reverse the logs to show most recent first
            setLogs([...fetchedLogs].reverse());
        } catch (err) {
            console.error('LogCard: Error fetching logs:', err);
            if (err instanceof Error) {
                if (err.message.includes('HTTP 404')) {
                    setError('Logs endpoint not found. Check if backend is running.');
                } else if (err.message.includes('HTTP 401')) {
                    setError('Authentication required. Please log in.');
                } else if (err.message.includes('HTTP 403')) {
                    setError('Admin access required to view logs.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Failed to fetch logs');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="bg-white h-full w-full rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden">
            {/* Header with reload button and centered title */}
            <div className="px-4 pt-4 relative">
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="absolute right-4 top-4 p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reload logs"
                >
                    <IoReload
                        className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
                    />
                </button>
                <h2 className="w-full text-center font-semibold text-primary text-2xl">Logs</h2>
            </div>

            {/* Divider directly under title */}
            <div className="border-b border-gray-200 w-11/12 mx-auto mt-1 mb-2" />

            {/* Scrollable log list */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2 text-sm pb-4">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <span className="text-gray-500">Loading logs...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col justify-center items-center h-32 space-y-2">
                        <span className="text-red-500 text-center">Error: {error}</span>
                        {userInfo && (
                            <span className="text-gray-500 text-xs text-center">
                                Current user: {userInfo.login}{' '}
                                {userInfo.isAdmin ? '(Admin)' : '(Non-Admin)'}
                            </span>
                        )}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                        <span className="text-gray-500">No logs available</span>
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <div
                            key={idx}
                            className="flex justify-between border p-2 rounded bg-gray-100"
                        >
                            <span className="break-words flex-1 mr-2">
                                {typeof log === 'object' && log.message ? log.message : String(log)}
                            </span>
                            <span className="text-gray-400 whitespace-nowrap">
                                {typeof log === 'object' && log.timestamp ? log.timestamp : 'N/A'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
