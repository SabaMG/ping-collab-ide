import Sidebar from './Sidebar';
import MainBox from './MainBox';

type PagesLayoutProps = {
    children: React.ReactNode;
    active: 'dashboard' | 'files' | 'notifications' | 'settings' | 'info';
    title: string;
    showSearch?: boolean;
    disableScroll?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    customControls?: React.ReactNode;
};

export default function PagesLayout({
    children,
    active,
    title,
    showSearch = false,
    disableScroll = false,
    searchValue,
    onSearchChange,
    searchPlaceholder,
    customControls,
}: PagesLayoutProps) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar active={active} />
            <MainBox
                title={title}
                showSearch={showSearch}
                disableScroll={disableScroll}
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                customControls={customControls}
            >
                {children}
            </MainBox>
        </div>
    );
}
