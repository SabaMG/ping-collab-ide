import React from 'react';

type MainBoxProps = {
    title: string;
    showSearch?: boolean;
    children: React.ReactNode;
    disableScroll?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    customControls?: React.ReactNode;
};

export default function MainBox({
    title,
    showSearch = false,
    children,
    disableScroll = false,
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    customControls,
}: MainBoxProps) {
    return (
        <div
            className={`m-6 bg-white rounded-3xl shadow-md ${
                disableScroll ? 'pt-6 px-6' : 'p-6'
            } w-full h-[calc(100vh-48px)] ${disableScroll ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <h1 className="text-3xl lg:text-5xl font-bold text-primary">{title}</h1>
                <div className="flex items-center gap-4">
                    {showSearch && (
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="w-full lg:w-128 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    )}
                    {customControls}
                </div>
            </div>
            <div className={disableScroll ? 'h-[calc(100%-120px)]' : ''}>{children}</div>
        </div>
    );
}
