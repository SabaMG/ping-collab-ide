import { useRef, useState, useEffect } from 'react';
import { listAllProjects, type ProjectResponse } from '../../../api/projects';
import ProjectCreateOverlay from './ProjectCreateOverlay';
import ProjectEditOverlay from './ProjectEditOverlay';

export default function ProjectCard() {
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [isEditOverlayOpen, setIsEditOverlayOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const colors = ['bg-red-200', 'bg-green-200', 'bg-blue-200'];

    // ref to the scrollable container
    const listRef = useRef<HTMLDivElement>(null);
    const [overflowing, setOverflowing] = useState(false);

    // Fetch projects on component mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                console.log('Fetching all projects from API...');
                const data = await listAllProjects();
                console.log('Projects fetched:', data.length, 'projects');
                setProjects(data);
            } catch (err) {
                console.error('Failed to fetch projects', err);
            }
        };

        fetchProjects();
    }, []);

    // detect overflow
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const check = () => {
            setOverflowing(el.scrollHeight > el.clientHeight);
        };

        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [projects.length]);

    const handleProjectCreated = async () => {
        // Prevent multiple simultaneous refreshes
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            const data = await listAllProjects();
            console.log('Projects refreshed:', data.length, 'projects');
            setProjects(data);
        } catch (err) {
            console.error('Failed to refresh projects', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleProjectClick = (projectId: string) => {
        setSelectedProjectId(projectId);
        setIsEditOverlayOpen(true);
    };

    const handleEditClose = () => {
        setIsEditOverlayOpen(false);
        setSelectedProjectId(null);
    };

    return (
        <div
            className="
        bg-white rounded-xl p-4
        shadow-[0_4px_20px_rgba(0,0,0,0.15)]
        h-[400px] flex flex-col overflow-hidden
      "
        >
            {/* Title + divider */}
            <h2 className="w-full text-center font-semibold text-primary text-2xl">Projects</h2>
            <div className="border-b border-gray-200 w-full my-3" />

            {/* Scrollable list INCLUDING the “+” button */}
            <div ref={listRef} className="flex-1 overflow-y-auto pr-1 space-y-2 relative">
                {projects.map((project, i) => (
                    <div
                        key={project.id}
                        className={`
              rounded-3xl px-3 py-2 ${colors[i % 3]}
              text-primary font-semibold flex items-center justify-center
              hover:brightness-95 transition-all duration-200
            `}
                    >
                        <button
                            className="w-full text-base hover:font-bold"
                            onClick={() => handleProjectClick(project.id)}
                        >
                            {project.name}
                        </button>
                    </div>
                ))}

                {/* “+” button as one more child */}
                <div
                    className={` 
            ${overflowing ? 'sticky bottom-0 bg-white pt-2 pb-2' : ''}
          `}
                >
                    <button
                        className="w-full bg-gray-100 py-2 rounded-3xl text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                        onClick={() => setIsOverlayOpen(true)}
                        disabled={isOverlayOpen}
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Project Creation Overlay */}
            <ProjectCreateOverlay
                isOpen={isOverlayOpen}
                onClose={() => setIsOverlayOpen(false)}
                onProjectCreated={handleProjectCreated}
            />

            {/* Project Edit Overlay */}
            <ProjectEditOverlay
                isOpen={isEditOverlayOpen}
                projectId={selectedProjectId}
                onClose={handleEditClose}
                onProjectUpdated={handleProjectCreated}
            />
        </div>
    );
}
