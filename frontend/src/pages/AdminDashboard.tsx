import PagesLayout from '../global_components/PagesLayout';
import DatabaseStorageCard from './DashboardComponents/DatabaseStorageCard';
import ProjectCard from './DashboardComponents/ProjectCard/ProjectCard';
import UserCard from './DashboardComponents/UserCard/UserCard';
import LogCard from './DashboardComponents/LogCard';

export default function AdminDashboard() {
    return (
        <PagesLayout active="dashboard" title="Admin Dashboard" disableScroll={true}>
            <div className="flex flex-col h-full">
                {/* Top Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 flex-shrink-0">
                    <DatabaseStorageCard freeSpace={1000} executable={425} confidential={550} />
                    <ProjectCard />
                    <UserCard />
                </div>

                {/* Log Section - takes remaining space */}
                <div className="flex-1 min-h-0">
                    <LogCard />
                </div>
            </div>
        </PagesLayout>
    );
}
