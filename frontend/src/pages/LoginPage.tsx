import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';
import { login as apiLogin } from '../api';
import logo from '../assets/Logo.svg';
import LoginForm from './LogInComponents/LoginForm';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, checkAdminStatus } = useAuth();

    const handleLogin = async ({
        login: userLogin,
        password,
    }: {
        login: string;
        password: string;
    }) => {
        try {
            await apiLogin(userLogin, password);
            await login(); // This will check admin status automatically
            
            // Check admin status directly and navigate accordingly
            const isUserAdmin = await checkAdminStatus();
            navigate(isUserAdmin ? '/dashboard' : '/projects');
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-between items-center px-4 py-8">
            <div className="flex-grow flex items-center justify-center">
                <LoginForm onSubmit={handleLogin} />
            </div>
            <img src={logo} alt="Logo" className="w-16 h-16 mb-4" />
        </div>
    );
}
