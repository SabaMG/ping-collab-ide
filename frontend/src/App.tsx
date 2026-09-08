import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/AdminDashboard';
import ProjectPage from './pages/ProjectExplorer';
import ProjectFilesPage from './pages/ProjectFilesPage';
import FilePage from './pages/FilePage';
import { useAuth } from './Auth';

export default function App() {
    const { isAuthenticated, isAdmin } = useAuth();

    const devBypass = false; // Set to true to bypass authentication for development

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={
                        isAuthenticated && !devBypass ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <LoginPage />
                        )
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        devBypass ? (
                            <DashboardPage />
                        ) : isAuthenticated && isAdmin ? (
                            <DashboardPage />
                        ) : isAuthenticated ? (
                            <Navigate to="/projects" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/projects/:projectId"
                    element={
                        devBypass || isAuthenticated ? (
                            <ProjectFilesPage />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/projects"
                    element={
                        devBypass || isAuthenticated ? (
                            <ProjectPage />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="/projects/:projectId/files"
                    element={
                        devBypass || isAuthenticated ? (
                            <FilePage />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route
                    path="*"
                    element={
                        devBypass ? (
                            <Navigate to="/dashboard" replace />
                        ) : isAuthenticated ? (
                            <Navigate to={isAdmin ? '/dashboard' : '/projects'} replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
            </Routes>
        </Router>
    );
}
