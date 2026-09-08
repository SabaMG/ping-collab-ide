import { PieChart } from 'react-minimal-pie-chart';
import { useState, useEffect } from 'react';
import { getProjectsStorage, type ProjectStorageListResponse } from '../../api/projects';

export default function DatabaseStorageCard() {
    const [projectsStorage, setProjectsStorage] = useState<ProjectStorageListResponse>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjectsStorage = async () => {
            try {
                const response = await getProjectsStorage();

                // Add artificial test projects to see the layout with many projects
                /*
                const testProjects = [
                    { id: 'test1', name: 'Test Project Alpha', sizeInBytes: 100 * 1024 * 1024 },
                    { id: 'test2', name: 'Beta Development', sizeInBytes: 250 * 1024 * 1024 },
                    {
                        id: 'test3',
                        name: 'Gamma Analytics Dashboard',
                        sizeInBytes: 180 * 1024 * 1024,
                    },
                    { id: 'test4', name: 'Delta Mobile App', sizeInBytes: 320 * 1024 * 1024 },
                    { id: 'test5', name: 'Epsilon AI Model', sizeInBytes: 500 * 1024 * 1024 },
                    { id: 'test6', name: 'Zeta Web Portal', sizeInBytes: 150 * 1024 * 1024 },
                    { id: 'test7', name: 'Eta Data Pipeline', sizeInBytes: 400 * 1024 * 1024 },
                    { id: 'test8', name: 'Theta Security System', sizeInBytes: 75 * 1024 * 1024 },
                    {
                        id: 'test9',
                        name: 'Iota E-commerce Platform',
                        sizeInBytes: 600 * 1024 * 1024,
                    },
                    {
                        id: 'test10',
                        name: 'Kappa Content Management',
                        sizeInBytes: 220 * 1024 * 1024,
                    },
                    { id: 'test11', name: 'Lambda Microservices', sizeInBytes: 300 * 1024 * 1024 },
                    { id: 'test12', name: 'Mu Documentation Site', sizeInBytes: 50 * 1024 * 1024 },
                ];
                */

                setProjectsStorage(response);
                // setProjectsStorage([...response, ...testProjects]);
            } catch (error) {
                console.error('Failed to fetch projects storage:', error);
                setProjectsStorage([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProjectsStorage();
    }, []);

    const totalDatabaseGB = 5; // 5GB database limit
    const totalUsedBytes = projectsStorage.reduce((sum, project) => sum + project.sizeInBytes, 0);
    const totalUsedGB = totalUsedBytes / (1024 * 1024 * 1024);
    const freeStorageGB = Math.max(0, totalDatabaseGB - totalUsedGB);

    // Sort projects by size (largest first)
    const sortedProjects = [...projectsStorage].sort((a, b) => b.sizeInBytes - a.sizeInBytes);

    // Generate colors for projects
    const colors = [
        '#10b981',
        '#3b82f6',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
        '#06b6d4',
        '#84cc16',
        '#f97316',
        '#ec4899',
        '#6366f1',
    ];

    const data = [
        ...sortedProjects.map((project, index) => ({
            title: project.name,
            value: project.sizeInBytes / (1024 * 1024 * 1024), // Convert to GB
            color: colors[index % colors.length],
        })),
        {
            title: 'Free Storage',
            value: freeStorageGB,
            color: '#e5e7eb',
        },
    ].filter((item) => item.value > 0);

    return (
        <div
            className="
        bg-white rounded-xl p-4
        shadow-[0_4px_20px_rgba(0,0,0,0.15)]
        h-full flex flex-col items-center
      "
        >
            {/* Centered, larger title */}
            <h2 className="w-full text-center font-semibold text-primary text-2xl">
                Database Storage
            </h2>

            {/* Divider with a tiny top & bottom margin */}
            <div className="border-b border-gray-200 w-full mt-3 mb-8" />

            {/* Pie chart */}
            <div className="w-36 h-36 relative">
                {loading ? (
                    <div className="w-36 h-36 flex items-center justify-center text-gray-500">
                        Loading...
                    </div>
                ) : (
                    <PieChart
                        data={data}
                        lineWidth={30}
                        animate
                        label={() => `${totalDatabaseGB}GB`}
                        labelStyle={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            fill: '#4f46e5',
                        }}
                        labelPosition={0}
                    />
                )}
            </div>

            {/* Legend - Fixed height container that scrolls */}
            <div className="mt-3 text-sm text-gray-600 w-full h-24 overflow-hidden">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 h-full overflow-y-auto pr-1">
                        {sortedProjects.map((project, index) => (
                            <div key={project.id} className="flex items-center min-w-0">
                                <span
                                    style={{ color: colors[index % colors.length] }}
                                    className="mr-1 flex-shrink-0"
                                >
                                    ●
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="truncate block">{project.name}</span>
                                    <span className="text-xs text-gray-500">
                                        {(project.sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)}GB
                                    </span>
                                </span>
                            </div>
                        ))}
                        <p className="flex items-center col-span-2">
                            <span className="text-gray-300 mr-1">●</span>
                            <span>Free Storage – {freeStorageGB.toFixed(2)}GB</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
