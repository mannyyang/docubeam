import { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { 
  FolderIcon, 
  FileIcon, 
  DownloadIcon, 
  SearchIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FileTextIcon,
  ImageIcon,
  FileJsonIcon
} from "lucide-react";

interface FileTreeNode {
  name: string;
  path: string;
  isFile: boolean;
  size?: number;
  lastModified?: string;
  contentType?: string;
  children?: FileTreeNode[];
}

interface FileItem {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  contentType: string;
  isFile: boolean;
}

interface FolderItem {
  key: string;
  name: string;
  isFile: boolean;
}

interface BrowseResponse {
  path: string;
  folders: FolderItem[];
  files: FileItem[];
  totalItems: number;
  truncated: boolean;
}

export default function FilesPage() {
  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [currentPath, setCurrentPath] = useState("documents/");
  const [currentFiles, setCurrentFiles] = useState<FileItem[]>([]);
  const [currentFolders, setCurrentFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["documents/"]));
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load file tree on component mount
  useEffect(() => {
    loadFileTree();
    loadDirectory(currentPath);
  }, []);

  const loadFileTree = async () => {
    try {
      const response = await fetch("/api/files/tree");
      const data = await response.json();
      
      if (data.status === "success") {
        setTree(data.data.tree);
      }
    } catch (error) {
      console.error("Failed to load file tree:", error);
    }
  };

  const loadDirectory = async (path: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files/browse?path=${encodeURIComponent(path)}&delimiter=/`);
      const data: { status: string; data: BrowseResponse } = await response.json();
      
      if (data.status === "success") {
        setCurrentFiles(data.data.files);
        setCurrentFolders(data.data.folders);
        setCurrentPath(path);
      }
    } catch (error) {
      console.error("Failed to load directory:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const handleFileClick = async (file: FileItem) => {
    setSelectedFile(file);
    
    // Load preview for text files
    if (isTextFile(file.contentType)) {
      setPreviewLoading(true);
      try {
        const response = await fetch(`/api/files/content?path=${encodeURIComponent(file.key)}`);
        const content = await response.text();
        setPreviewContent(content);
      } catch (error) {
        console.error("Failed to load file preview:", error);
        setPreviewContent("Failed to load preview");
      } finally {
        setPreviewLoading(false);
      }
    } else {
      setPreviewContent(null);
    }
  };

  const downloadFile = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/content?path=${encodeURIComponent(file.key)}&download=true`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const renderTreeNode = (node: FileTreeNode, level: number = 0): React.ReactElement => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer rounded ${
            currentPath === node.path ? "bg-gray-600" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (!node.isFile) {
              toggleNode(node.path);
              loadDirectory(node.path);
            }
          }}
        >
          {!node.isFile && hasChildren && (
            <span className="mr-1">
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </span>
          )}
          {!node.isFile && !hasChildren && <span className="w-5" />}
          
          {node.isFile ? (
            getFileIcon(node.contentType || "")
          ) : (
            <FolderIcon className="h-4 w-4 text-blue-600 mr-2" />
          )}
          
          <span className="text-sm truncate">{node.name}</span>
        </div>
        
        {!node.isFile && isExpanded && hasChildren && (
          <div>
            {node.children?.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 text-green-600 mr-2" />;
    } else if (contentType === "application/json") {
      return <FileJsonIcon className="h-4 w-4 text-yellow-600 mr-2" />;
    } else if (contentType.startsWith("text/") || contentType === "text/markdown") {
      return <FileTextIcon className="h-4 w-4 text-blue-600 mr-2" />;
    } else {
      return <FileIcon className="h-4 w-4 text-gray-600 mr-2" />;
    }
  };

  const isTextFile = (contentType: string): boolean => {
    return contentType.startsWith('text/') || 
           contentType === 'application/json' ||
           contentType === 'text/markdown';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const filteredFiles = currentFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = currentFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">File Explorer</h1>
          <p className="text-gray-600">Browse and view files in your R2 bucket</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Tree Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Directory Tree</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {tree && renderTreeNode(tree)}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Current Directory</CardTitle>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span>documents</span>
                      {breadcrumbs.slice(1).map((crumb, index) => (
                        <span key={index}>
                          <ChevronRightIcon className="h-4 w-4 mx-1" />
                          {crumb}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    {/* Folders */}
                    {filteredFolders.map((folder) => (
                      <div
                        key={folder.key}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-700 cursor-pointer"
                        onClick={() => loadDirectory(folder.key)}
                      >
                        <div className="flex items-center">
                          <FolderIcon className="h-5 w-5 text-blue-600 mr-3" />
                          <span className="font-medium">{folder.name}</span>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}

                    {/* Files */}
                    {filteredFiles.map((file) => (
                      <div
                        key={file.key}
                        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-700 cursor-pointer ${
                          selectedFile?.key === file.key ? "bg-gray-600 border-gray-500" : ""
                        }`}
                        onClick={() => handleFileClick(file)}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {getFileIcon(file.contentType)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(file);
                          }}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {filteredFiles.length === 0 && filteredFolders.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm ? "No files match your search" : "This directory is empty"}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Preview */}
            {selectedFile && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">File Preview: {selectedFile.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {previewLoading ? (
                    <div className="text-center py-4">Loading preview...</div>
                  ) : isTextFile(selectedFile.contentType) && previewContent ? (
                    <ScrollArea className="h-64">
                      <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded text-gray-900">
                        {previewContent}
                      </pre>
                    </ScrollArea>
                  ) : selectedFile.contentType.startsWith("image/") ? (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-2">Image preview not available</p>
                      <Button onClick={() => downloadFile(selectedFile)}>
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download to view
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-2">Preview not available for this file type</p>
                      <Button onClick={() => downloadFile(selectedFile)}>
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download file
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
