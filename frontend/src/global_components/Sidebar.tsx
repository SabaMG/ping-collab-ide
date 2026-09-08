import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGrid, FiFolder, FiSettings, FiInfo } from 'react-icons/fi';
import logo from '../assets/Logo.svg';
import { useAuth } from '../Auth'; // adjust path
import { getCurrentUser, type UserResponse } from '../api/user';
import InfoOverlay from './InfoOverlay';
import LogoutOverlay from './LogoutOverlay';
import SettingsOverlay from './SettingsOverlay';
import AdminAccessPopup from './AdminAccessPopup';

type SidebarProps = {
    active: 'dashboard' | 'files' | 'notifications' | 'settings' | 'info';
};

export default function Sidebar({ active }: SidebarProps) {
    const navigate = useNavigate();
    const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
    const [showInfoOverlay, setShowInfoOverlay] = useState(false);
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
    const [showAdminRequiredPopup, setShowAdminRequiredPopup] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const { logout, isAdmin } = useAuth();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.error('Failed to fetch current user:', error);
            }
        };

        fetchCurrentUser();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setShowLogoutPrompt(false);
    };

    return (
        <>
            <aside className="w-22 pl-4 py-6 h-screen">
                <div className="w-full h-full overflow-y-auto bg-white flex flex-col justify-between items-center py-4 rounded-3xl shadow-md">
                    <div className="flex flex-col gap-6 items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white">
                            <img src={logo} alt="Logo" className="w-6 h-6" />
                        </div>
                        {isAdmin ? (
                            <NavIcon
                                icon={<FiGrid />}
                                active={active === 'dashboard'}
                                to="/dashboard"
                                navigate={navigate}
                            />
                        ) : (
                            <button
                                onClick={() => setShowAdminRequiredPopup(true)}
                                className="p-2 rounded-full text-gray-300 hover:text-gray-400 transition"
                            >
                                <FiGrid />
                            </button>
                        )}
                        <NavIcon
                            icon={<FiFolder />}
                            active={active === 'files'}
                            to="/projects"
                            navigate={navigate}
                        />
                    </div>
                    <div className="flex flex-col gap-6 items-center mt-10">
                        <button
                            onClick={() => setShowSettingsOverlay(true)}
                            className={`p-2 rounded-full ${
                                active === 'settings' ? 'bg-button text-primary' : 'text-gray-500'
                            } hover:bg-violet-50 transition`}
                        >
                            <FiSettings />
                        </button>
                        <button
                            onClick={() => setShowInfoOverlay(true)}
                            className={`p-2 rounded-full ${
                                active === 'info' ? 'bg-button text-primary' : 'text-gray-500'
                            } hover:bg-violet-50 transition`}
                        >
                            <FiInfo />
                        </button>
                    </div>
                    <div className="mb-2">
                        <button onClick={() => setShowLogoutPrompt(true)}>
                            <img
                                src={currentUser?.avatar || '/profile.png'}
                                alt={currentUser?.displayName.charAt(0) || 'User'}
                                className="w-10 h-10 rounded-full border hover:opacity-80 transition object-cover"
                            />
                        </button>
                    </div>
                </div>
            </aside>

            <LogoutOverlay
                isOpen={showLogoutPrompt}
                onClose={() => setShowLogoutPrompt(false)}
                onConfirm={handleLogout}
            />

            <SettingsOverlay
                isOpen={showSettingsOverlay}
                onClose={() => setShowSettingsOverlay(false)}
            />

            <InfoOverlay isOpen={showInfoOverlay} onClose={() => setShowInfoOverlay(false)} />

            <AdminAccessPopup
                isOpen={showAdminRequiredPopup}
                onClose={() => setShowAdminRequiredPopup(false)}
            />
        </>
    );
}

function NavIcon({
    icon,
    active = false,
    to,
    navigate,
}: {
    icon: React.ReactNode;
    active?: boolean;
    to: string;
    navigate: ReturnType<typeof useNavigate>;
}) {
    const handleClick = () => {
        navigate(to);
    };

    return (
        <button
            onClick={handleClick}
            className={`p-2 rounded-full transition ${
                active ? 'bg-button text-primary' : 'text-gray-500 hover:bg-violet-50'
            }`}
        >
            {icon}
        </button>
    );
}
