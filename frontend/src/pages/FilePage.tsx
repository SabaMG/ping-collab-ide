import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import PagesLayout from '../global_components/PagesLayout';
import { FiFile, FiDownload, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { FaFolder } from 'react-icons/fa';
import { listFolder, type FSEntryResponse } from '../api/folder';
import { downloadFile } from '../api/files';
import { listFileVersions, getFileVersionContent, type FileVersion } from '../api/projects';

interface TreeFile {
    name: string;
    path: string;
    directory: false;
}

interface TreeFolder {
    name: string;
    path: string;
    isOpen: boolean;
    directory: true;
    children: (TreeFile | TreeFolder)[];
}

type TreeDataItem = TreeFile | TreeFolder;

export default function FilePage() {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    const urlParams = new URLSearchParams(location.search);
    const fileFromUrl = urlParams.get('file');

    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<string>('HEAD');
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);
    const versionDropdownRef = useRef<HTMLDivElement>(null);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [versions, setVersions] = useState<FileVersion[]>([]);
    const [treeData, setTreeData] = useState<TreeDataItem[]>([]);
    const [fileContent, setFileContent] = useState<string>('');
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
                setShowVersionDropdown(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const loadVersions = useCallback(async (filePath: string) => {
        if (!projectId || !filePath) return;
        
        setLoadingVersions(true);
        try {
            const fileVersions = await listFileVersions(projectId, filePath);
            setVersions(fileVersions && fileVersions.length > 0 ? fileVersions : []);
        } catch (err) {
            console.error(`Error loading versions:`, err);
            setVersions([]);
        } finally {
            setLoadingVersions(false);
        }
    }, [projectId]);

    const loadFileContent = useCallback(async (path: string, version: string = 'HEAD') => {
        if (!projectId) {
            setFileContent('Error: Missing project ID');
            return;
        }
        
        setFileContent('Loading content...');
        
        try {
            let content;
            if (version === 'HEAD') {
                try {
                    const blob = await downloadFile(projectId, path);
                    content = await blob.text();
                } catch {
                    content = await getFileVersionContent(projectId, path, version);
                }
            } else {
                content = await getFileVersionContent(projectId, path, version);
            }
            
            setFileContent(content);
        } catch (err) {
            if (err instanceof Error) {
                setFileContent(`Error loading file content: ${err.message}`);
            } else {
                setFileContent('Error loading file content');
            }
        }
    }, [projectId]);
    
    const buildTreeFromFSEntries = useCallback((entries: FSEntryResponse[]): TreeDataItem[] => {
        const sortedEntries = [...entries].sort((a, b) => {
            if (a.directory && !b.directory) return -1;
            if (!a.directory && b.directory) return 1;
            return a.name.localeCompare(b.name);
        });
        
        return sortedEntries.map(entry => {
            if (entry.directory) {
                return {
                    name: entry.name,
                    path: entry.path,
                    isOpen: false,
                    directory: true,
                    children: []
                } as TreeFolder;
            } else {
                return {
                    name: entry.name,
                    path: entry.path,
                    directory: false
                } as TreeFile;
            }
        });
    }, []);
    
    const openFolderPath = useCallback(async (folderPath: string, items: TreeDataItem[]): Promise<TreeDataItem[]> => {
        if (!projectId || !folderPath) return items;
        
        const pathParts = folderPath.split('/');
        const currentFolder = pathParts[0];
        
        const result = [];
        let folderFound = false;
        
        for (const item of items) {
            if (item.directory && item.name === currentFolder) {
                folderFound = true;
                
                if (pathParts.length === 1) {
                    try {
                        const folderContents = await listFolder(projectId, item.path);
                        const children = buildTreeFromFSEntries(folderContents);
                        result.push({
                            ...item,
                            isOpen: true,
                            children
                        });
                    } catch (err) {
                        console.error(`Failed to load contents of folder ${item.path}`, err);
                        result.push({
                            ...item,
                            isOpen: true
                        });
                    }
                } else {
                    const remainingPath = pathParts.slice(1).join('/');
                    let children: TreeDataItem[] = [];
                    
                    if (item.children.length === 0) {
                        try {
                            const folderContents = await listFolder(projectId, item.path);
                            children = buildTreeFromFSEntries(folderContents);
                        } catch (err) {
                            console.error(`Failed to load contents of folder ${item.path}`, err);
                            children = [];
                        }
                    } else {
                        children = item.children;
                    }
                    
                    const updatedChildren = await openFolderPath(remainingPath, children);
                    
                    result.push({
                        ...item,
                        isOpen: true,
                        children: updatedChildren
                    });
                }
            } else {
                result.push(item);
            }
        }
        
        return folderFound ? result : items;
    }, [projectId, buildTreeFromFSEntries]);
    
    useEffect(() => {
        const fetchRootFolderContents = async () => {
            if (!projectId) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const data = await listFolder(projectId);
                const tree = buildTreeFromFSEntries(data);
                setTreeData(tree);
                
                if (fileFromUrl) {
                    try {
                        const decodedPath = decodeURIComponent(fileFromUrl);
                        
                        const pathParts = decodedPath.split('/');
                        if (pathParts.length > 1) {
                            pathParts.pop();
                            const folderPath = pathParts.join('/');
                            const updatedTree = await openFolderPath(folderPath, tree);
                            setTreeData(updatedTree);
                        }
                        
                        setSelectedFile(decodedPath);
                        setSelectedFileName(decodedPath.split('/').pop() || '');
                        setSelectedVersion('HEAD');
                        
                        await loadFileContent(decodedPath, 'HEAD');
                        await loadVersions(decodedPath);
                    } catch (error) {
                        setError(`Error treating the file: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                    }
                }
            } catch {
                setError('Error loading the file');
            } finally {
                setLoading(false);
            }
        };
        
        fetchRootFolderContents();
    }, [projectId, buildTreeFromFSEntries, fileFromUrl, loadFileContent, loadVersions, openFolderPath]);
    
    // Function to update the tree with folder children
    const updateTreeWithChildren = useCallback((tree: TreeDataItem[], folderPath: string, children: TreeDataItem[]): TreeDataItem[] => {
        return tree.map(item => {
            if (item.directory && item.path === folderPath) {
                return { ...item, children };
            } else if (item.directory) {
                return { ...item, children: updateTreeWithChildren(item.children, folderPath, children) };
            }
            return item;
        });
    }, []);
    
    
    // Function to find a folder in the tree
    const findFolderInTree = useCallback((items: TreeDataItem[], path: string): TreeFolder | null => {
        for (const item of items) {
            if (item.directory && item.path === path) {
                return item;
            } else if (item.directory) {
                const found = findFolderInTree(item.children, path);
                if (found) return found;
            }
        }
        return null;
    }, []);
    
    // Function to update the open/closed state of a folder
    const updateTreeWithFolderToggle = useCallback((items: TreeDataItem[], path: string): TreeDataItem[] => {
        return items.map(item => {
            if (item.directory && item.path === path) {
                return { ...item, isOpen: !item.isOpen };
            } else if (item.directory) {
                return { ...item, children: updateTreeWithFolderToggle(item.children, path) };
            }
            return item;
        });
    }, []);
    
    // Function to filter the tree based on search
    const filterTree = useCallback((items: TreeDataItem[], query: string): TreeDataItem[] => {
        if (!query) return items;
        
        const lowerCaseQuery = query.toLowerCase();
        
        return items.reduce<TreeDataItem[]>((filtered, item) => {
            if (item.directory) {
                const filteredChildren = filterTree(item.children, query);
                
                if (item.name.toLowerCase().includes(lowerCaseQuery) || filteredChildren.length > 0) {
                    filtered.push({
                        ...item,
                        children: filteredChildren,
                        isOpen: filteredChildren.length > 0
                    });
                }
            } else if (item.name.toLowerCase().includes(lowerCaseQuery)) {
                filtered.push(item);
            }
            return filtered;
        }, []);
    }, []);

    // Function to handle click on a tree item
    const handleTreeItemClick = useCallback(async (path: string, isFolder: boolean, name: string) => {
        if (isFolder) {
            // Open/close the folder
            const updatedTree = treeData.map(item => {
                if (item.directory && item.path === path) {
                    return { ...item, isOpen: !item.isOpen };
                } else if (item.directory) {
                    return { 
                        ...item, 
                        children: updateTreeWithFolderToggle(item.children, path) 
                    };
                }
                return item;
            });
            
            setTreeData(updatedTree);
            
            // Si le dossier est fermé, on ne fait rien de plus
            const folder = findFolderInTree(updatedTree, path);
            if (!folder || !folder.isOpen) return;
            
            // If the folder is open and has no children, load its content
            if (folder.children.length === 0) {
                try {
                    const folderContents = await listFolder(projectId!, path);
                    const children = buildTreeFromFSEntries(folderContents);
                    
                    const newTree = updateTreeWithChildren(updatedTree, path, children);
                    setTreeData(newTree);
                } catch (err) {
                    console.error(`Failed to load contents of folder ${path}`, err);
                }
            }
        } else {
            // Sélectionner le fichier
            setSelectedFile(path);
            setSelectedFileName(name);
            setSelectedVersion('HEAD');
            
            // Load the file content
            await loadFileContent(path, 'HEAD');
            await loadVersions(path);
        }
    }, [projectId, treeData, updateTreeWithChildren, buildTreeFromFSEntries, loadFileContent, loadVersions, findFolderInTree, updateTreeWithFolderToggle]);
    
    // Fonction pour rendre un élément de l'arborescence
    const renderTreeItem = useCallback((item: TreeDataItem, indent: number = 0) => {
        const isFolder = item.directory;
        const path = item.path;
        
        return (
            <div key={path}>
                <div 
                    className={`flex items-center py-1 ${!isFolder && selectedFile === path ? 'bg-gray-200' : 'hover:bg-gray-100'} cursor-pointer`}
                    style={{ paddingLeft: `${indent * 24}px` }}
                    onClick={() => handleTreeItemClick(path, isFolder, item.name || '')}
                >
                    {isFolder && (
                        <span className="mr-1">
                            {(item as TreeFolder).isOpen ? 
                                <FiChevronDown className="inline text-gray-500" /> : 
                                <FiChevronRight className="inline text-gray-500" />
                            }
                        </span>
                    )}
                    <span className="mr-2">
                        {isFolder ? 
                            <FaFolder className="inline text-[#6366F1]" /> : 
                            <FiFile className="inline text-[#93C5FD]" style={{ fill: 'currentColor', strokeWidth: 1 }} />
                        }
                    </span>
                    <span>{item.name}</span>
                </div>
                
                {isFolder && (item as TreeFolder).isOpen && (item as TreeFolder).children.map((child) => 
                    renderTreeItem(child, indent + 1)
                )}
            </div>
        );
    }, [selectedFile, handleTreeItemClick]);
    
    // Filtrer l'arborescence en fonction de la recherche
    const filteredTreeData = useMemo(() => {
        return filterTree(treeData, searchQuery);
    }, [treeData, searchQuery, filterTree]);
    
    // Effect to load initial content
    useEffect(() => {
        const fetchRootFolderContents = async () => {
            if (!projectId) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const data = await listFolder(projectId);
                const tree = buildTreeFromFSEntries(data);
                setTreeData(tree);
                
                if (fileFromUrl) {
                    try {
                        const decodedPath = decodeURIComponent(fileFromUrl);
                        
                        const pathParts = decodedPath.split('/');
                        if (pathParts.length > 1) {
                            pathParts.pop();
                            const folderPath = pathParts.join('/');
                            const updatedTree = await openFolderPath(folderPath, tree);
                            setTreeData(updatedTree);
                        }
                        
                        setSelectedFile(decodedPath);
                        setSelectedFileName(decodedPath.split('/').pop() || '');
                        setSelectedVersion('HEAD');
                        
                        await loadFileContent(decodedPath, 'HEAD');
                        await loadVersions(decodedPath);
                    } catch (error) {
                        setError(`Error treating the file: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                    }
                }
            } catch {
                setError('Error loading the file');
            } finally {
                setLoading(false);
            }
        };
        
        fetchRootFolderContents();
    }, [projectId, buildTreeFromFSEntries, fileFromUrl, loadFileContent, loadVersions, openFolderPath]);
    
    return (
        <PagesLayout 
            active="files" 
            title={selectedFile ? selectedFile.split('/').pop() || 'File Explorer' : 'File Explorer'} 
            showSearch 
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search...">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading...</p>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">{error}</p>
                </div>
            ) : (
                <div className="flex gap-6 h-full">
                    {/* Arborescence de fichiers (côté gauche) */}
                    <div className="w-1/4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-lg p-6 overflow-y-auto h-[calc(100vh-200px)]">
                        <div className="overflow-y-auto">
                            {filteredTreeData.map(item => renderTreeItem(item))}
                        </div>
                    </div>
                    
                    {/* File content (right side) */}
                    <div className="w-3/4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-lg overflow-hidden h-[calc(100vh-200px)]">
                        {selectedFile ? (
                            <>
                                {/* Version bar and download - fixed at top */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10 shadow-sm">
                                    <div className="flex items-center">
                                        {/* Dropdown pour sélectionner la version */}
                                        <div className="relative" ref={versionDropdownRef}>
                                            <button 
                                                className="bg-white hover:bg-gray-100 p-2 rounded-lg border border-gray-200 flex items-center"
                                                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                                                disabled={loadingVersions}
                                            >
                                                <span className="mr-2">
                                                    {selectedVersion === 'HEAD' 
                                                        ? 'Actual version' 
                                                        : `Version ${versions.find(v => v.hash === selectedVersion)?.versionNumber !== undefined 
                                                            ? versions.find(v => v.hash === selectedVersion)?.versionNumber 
                                                            : '0'}`
                                                    }
                                                </span>
                                                <FiChevronDown className="w-4 h-4" />
                                            </button>
                                            {showVersionDropdown && (
                                                <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-80 overflow-y-auto">
                                                    <ul className="py-1">
                                                        <li key="HEAD">
                                                                <button
                                                                    className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedVersion === 'HEAD' ? 'bg-gray-50' : ''}`}
                                                                    onClick={() => {
                                                                        setSelectedVersion('HEAD');
                                                                        setShowVersionDropdown(false);
                                                                        if (selectedFile) {
                                                                            loadFileContent(selectedFile, 'HEAD');
                                                                        }
                                                                    }}
                                                                >
                                                                    <span>Actual version</span>
                                                                </button>
                                                        </li>
                                                        {/* Filtrer la version HEAD si elle est déjà affichée séparément */}
                                                        {versions
                                                            .filter(version => !version.isHead) // Exclure la version HEAD pour éviter les doublons
                                                            .map(version => (
                                                            <li key={version.hash}>
                                                                <button
                                                                    className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedVersion === version.hash ? 'bg-gray-50' : ''}`}
                                                                    onClick={() => {
                                                                        setSelectedVersion(version.hash);
                                                                        setShowVersionDropdown(false);
                                                                        if (selectedFile) {
                                                                            loadFileContent(selectedFile, version.hash);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <span>Version {version.versionNumber}</span>
                                                                    </div>
                                                                </button>
                                                            </li>
                                                        ))}
                                                        
                                                        {versions.length === 0 && !loadingVersions && (
                                                            <li className="px-4 py-2 text-gray-500 italic text-sm">No versions available</li>
                                                        )}
                                                        {loadingVersions && (
                                                            <li className="px-4 py-2 text-gray-500 italic text-sm">Loading versions...</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        className="bg-white hover:bg-gray-100 p-2 rounded-lg border border-gray-200 ml-2"
                                        onClick={() => {
                                            if (projectId && selectedFile) {
                                                if (selectedVersion === 'HEAD') {
                                                    // Download current version using existing function
                                                    downloadFile(projectId, selectedFile)
                                                        .then(blob => {
                                                            // Create a download link
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = selectedFileName || 'download';
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            window.URL.revokeObjectURL(url);
                                                            document.body.removeChild(a);
                                                        })
                                                        .catch(err => console.error('Failed to download file', err));
                                                } else {
                                                    // Download specific version
                                                    getFileVersionContent(projectId, selectedFile, selectedVersion)
                                                        .then(content => {
                                                            // Create a blob from the content
                                                            const blob = new Blob([content], { type: 'text/plain' });
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = selectedFileName || 'download';
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            window.URL.revokeObjectURL(url);
                                                            document.body.removeChild(a);
                                                        })
                                                        .catch(err => console.error('Failed to download file version', err));
                                                }
                                            }
                                        }}
                                    >
                                        <FiDownload className="w-5 h-5 text-[#6366F1]" />
                                    </button>
                                </div>
                                {/* File content with scrolling */}
                                <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
                                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                                        {fileContent || <p className="text-gray-500 italic">Loading content...</p>}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-[calc(100%-3rem)] text-gray-400">
                                Select a file to display its content
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PagesLayout>
    );
}
