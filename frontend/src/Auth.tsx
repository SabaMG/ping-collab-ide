import { createContext, useContext, useEffect, useState } from 'react';
import { getToken } from './api/http';
import { logout as apiLogout } from './api/auth';
import { getCurrentUser, type UserResponse } from './api/user';

type AuthContextType = {
    isAuthenticated: boolean;
    isAdmin: boolean;
    currentUser: UserResponse | null;
    login: (checkAdmin?: boolean) => Promise<void>;
    logout: () => void;
    checkAdminStatus: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

    useEffect(() => {
        const token = getToken();
        setIsAuthenticated(!!token);

        // Load current user info on initial load if authenticated
        if (token) {
            loadCurrentUser();
        }
    }, []);

    const loadCurrentUser = async () => {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user);
            setIsAdmin(user.isAdmin);
        } catch (error) {
            console.error('Failed to load current user:', error);
            setCurrentUser(null);
            setIsAdmin(false);
        }
    };

    const checkAdminStatus = async (): Promise<boolean> => {
        try {
            const user = await getCurrentUser();
            return user.isAdmin;
        } catch {
            return false;
        }
    };

    const login = async (checkAdmin: boolean = true): Promise<void> => {
        const token = getToken();
        if (token) {
            setIsAuthenticated(true);

            if (checkAdmin) {
                await loadCurrentUser();
            }
        }
    };

    const logout = (): void => {
        apiLogout();
        setIsAuthenticated(false);
        setIsAdmin(false);
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isAdmin,
                currentUser,
                login,
                logout,
                checkAdminStatus,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
