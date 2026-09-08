import { useRef, useState, useEffect, useCallback } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { listUsers, type UserResponse } from '../../../api/user';
import UserCreateOverlay from './UserCreateOverlay';
import UserEditOverlay from './UserEditOverlay';

export default function UserCard() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateOverlayOpen, setIsCreateOverlayOpen] = useState(false);
    const [isEditOverlayOpen, setIsEditOverlayOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    const [overflowing, setOverflowing] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);

    // Fetch users from API
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedUsers = await listUsers();
            setUsers(fetchedUsers);
        } catch (err) {
            setError('Failed to load users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle opening edit overlay
    const handleEditUser = useCallback((user: UserResponse) => {
        setSelectedUser(user);
        setIsEditOverlayOpen(true);
    }, []);

    // Handle closing edit overlay
    const handleCloseEditOverlay = useCallback(() => {
        setIsEditOverlayOpen(false);
        setSelectedUser(null);
    }, []);

    // Check if content overflows
    const checkOverflow = useCallback(() => {
        const el = listRef.current;
        if (el) {
            setOverflowing(el.scrollHeight > el.clientHeight);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Setup overflow detection
    useEffect(() => {
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [users.length, checkOverflow]);

    // Render loading state
    const renderLoadingState = () => (
        <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading users...</div>
        </div>
    );

    // Render error state
    const renderErrorState = () => (
        <div className="flex justify-center items-center h-full">
            <div className="text-red-500">{error}</div>
        </div>
    );

    // Render empty state
    const renderEmptyState = () => (
        <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">No users found</div>
        </div>
    );

    // Render user item
    const renderUserItem = (user: UserResponse) => (
        <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <img
                    src={user.avatar || '/profile.png'}
                    alt={user.displayName.charAt(0).toUpperCase()}
                    className="w-6 h-6 rounded-full"
                />
                <span className="text-gray-600">{user.displayName || user.login}</span>
            </div>
            <button
                onClick={() => handleEditUser(user)}
                className="text-gray-400 hover:text-gray-800 transition-colors p-1"
                aria-label={`Edit ${user.displayName || user.login}`}
            >
                <MoreHorizontal size={16} />
            </button>
        </div>
    );

    // Render user list content
    const renderUserListContent = () => {
        if (loading) return renderLoadingState();
        if (error) return renderErrorState();
        if (users.length === 0) return renderEmptyState();
        return users.map(renderUserItem);
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] h-[400px] flex flex-col overflow-hidden">
            {/* Header */}
            <h2 className="w-full text-center font-semibold text-primary text-2xl">Users</h2>

            {/* Divider */}
            <div className="border-b border-gray-200 w-full my-3" />

            {/* User List */}
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-1 relative">
                {renderUserListContent()}

                {/* Add User Button */}
                <div className={overflowing ? 'sticky bottom-0 bg-white pt-2 pb-2' : ''}>
                    <button
                        onClick={() => setIsCreateOverlayOpen(true)}
                        className="w-full bg-gray-100 py-2 rounded-3xl text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                        aria-label="Add new user"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Overlays */}
            <UserCreateOverlay
                isOpen={isCreateOverlayOpen}
                onClose={() => setIsCreateOverlayOpen(false)}
                onUserCreated={fetchUsers}
            />

            <UserEditOverlay
                isOpen={isEditOverlayOpen}
                onClose={handleCloseEditOverlay}
                onUserUpdated={fetchUsers}
                user={selectedUser}
            />
        </div>
    );
}
