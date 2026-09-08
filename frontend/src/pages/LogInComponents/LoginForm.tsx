type LoginFormProps = {
    onSubmit: (data: { login: string; password: string }) => void;
};

import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginForm({ onSubmit }: LoginFormProps) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Don't submit if login or password is empty
        if (!login.trim() || !password.trim()) {
            return;
        }

        onSubmit({ login, password });
    };

    return (
        <div className="bg-white p-8 rounded-md shadow-md w-108">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Nice to see you again !</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="login" className="block text-sm text-gray-600 mb-1">
                        Login
                    </label>
                    <input
                        id="login"
                        type="text"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        placeholder="Email or phone number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm text-gray-600 mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between"></div>

                <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-md"
                >
                    Log in
                </button>
            </form>
        </div>
    );
}
