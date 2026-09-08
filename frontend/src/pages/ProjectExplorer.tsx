import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PagesLayout from '../global_components/PagesLayout';
import { listMyProjects, type ProjectResponse } from '../api/projects';
import { useAuth } from '../Auth';
import ProjectItem from './ProjectComponents/ProjectItem';

export default function ProjectPage() {
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<ProjectResponse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [onlyOwned, setOnlyOwned] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Always fetch all projects, filtering will be done client-side
                const data = await listMyProjects(false);

                // Sort projects alphabetically by name
                const sortedProjects = data.sort((a, b) =>
                    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                );

                // Generate artificial projects for testing scrolling
                // const artificialProjects: ProjectResponse[] = [];
                // for (let i = 1; i <= 50; i++) {
                //     artificialProjects.push({
                //         id: `artificial-${i}`,
                //         name: `Test Project ${i.toString().padStart(2, '0')}`,
                //         members: [
                //             {
                //                 id: 'user-1',
                //                 displayName: 'Test User',
                //                 avatar: '',
                //             },
                //         ],
                //         owner: {
                //             id: 'owner-1',
                //             displayName: 'Project Owner',
                //             avatar: '',
                //         },
                //     });
                // }

                // Combine real and artificial projects
                // const allProjects = [...sortedProjects, ...artificialProjects].sort((a, b) =>
                //     a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                // );

                setProjects(sortedProjects);
            } catch (err) {
                console.error('Failed to fetch projects', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []); // Remove onlyOwned dependency since we fetch all projects

    // Filter projects based on search query and ownership toggle
    useEffect(() => {
        let filtered = projects;

        // Apply ownership filter
        if (onlyOwned && currentUser) {
            filtered = filtered.filter((project) => project.owner.id === currentUser.id);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(
                (project) =>
                    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    project.owner.displayName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProjects(filtered);
    }, [searchQuery, projects, onlyOwned, currentUser]);

    const toggleButton = (
        <button
            onClick={() => setOnlyOwned(!onlyOwned)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                onlyOwned
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {onlyOwned ? 'Only Owned' : 'All Projects'}
        </button>
    );

    return (
        <PagesLayout
            active="files"
            title="Project Explorer"
            showSearch
            disableScroll
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search projects..."
            customControls={toggleButton}
        >
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <p>Loading projects...</p>
                </div>
            ) : (
                <div className="bg-white w-full h-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-lg flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6">
                        {filteredProjects.length === 0 ? (
                            <div className="flex items-center justify-center h-32">
                                <p className="text-gray-500">
                                    {searchQuery
                                        ? 'No projects found matching your search.'
                                        : 'No projects available.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-6">
                                {filteredProjects.map((project) => (
                                    <ProjectItem
                                        key={project.id}
                                        project={project}
                                        currentUserId={currentUser?.id}
                                        onClick={(projectId) => {
                                            navigate(`/projects/${projectId}`);
                                            console.log('Clicked project:', projectId);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PagesLayout>
    );
}
