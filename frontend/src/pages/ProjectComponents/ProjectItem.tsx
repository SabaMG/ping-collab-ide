import { type ProjectResponse } from '../../api/projects';

interface ProjectItemProps {
    project: ProjectResponse;
    onClick?: (projectId: string) => void;
    currentUserId?: string;
}

const FolderIcon = ({ isOwned }: { isOwned: boolean }) => {
    const primaryColor = isOwned ? '#4338ca' : '#81ABD9'; // Green for owned, original blue for others
    const secondaryColor = isOwned ? '#4f46e5' : '#A0C6E8'; // Darker green for owned, original light blue for others

    return (
        <svg width="96" height="96" viewBox="0 0 1200 1200" className="transition-all duration-200">
            <g>
                <path
                    fill={primaryColor}
                    d="M1095.434,272.873H461.983L376.454,159.23H94.651c-24.49,0-44.342,20.862-44.342,46.596v67.047H50v189.118
                    c0-72.08,58.432-130.512,130.512-130.512h838.976c72.08,0,130.512,58.432,130.512,130.512V334.105
                    C1150,300.288,1125.57,272.873,1095.434,272.873z"
                />
                <path
                    fill={secondaryColor}
                    d="M1019.488,331.479H180.512C108.432,331.479,50,389.912,50,461.991v382.709v65.557
                    c0,72.08,58.432,130.512,130.512,130.512h838.976c72.08,0,130.512-58.432,130.512-130.512v-65.557V461.991
                    C1150,389.912,1091.568,331.479,1019.488,331.479z"
                />
            </g>
        </svg>
    );
};

export default function ProjectItem({ project, onClick, currentUserId }: ProjectItemProps) {
    const handleClick = () => {
        if (onClick) {
            onClick(project.id);
        }
    };

    const isOwned = currentUserId && project.owner.id === currentUserId;

    return (
        <div
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleClick}
        >
            <FolderIcon isOwned={!!isOwned} />
            <p className="mt-2 text-sm font-medium text-center">{project.name}</p>
            <p className="text-xs text-gray-500 text-center">Owner: {project.owner.displayName}</p>
            <p className="text-xs text-gray-400 text-center">
                {project.members.length} member{project.members.length !== 1 ? 's' : ''}
            </p>
        </div>
    );
}
