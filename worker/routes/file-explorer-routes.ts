import { Context, Hono } from "hono";
import { FileStorageService } from "../services/file-storage-service";
import { formatSuccessResponse, formatErrorResponse } from "../utils";

// Create a new Hono app for file explorer routes
const fileExplorerRoutes = new Hono();

/**
 * Get hierarchical tree view of all files in R2
 * GET /api/files/tree
 */
fileExplorerRoutes.get("/api/files/tree", async (c: Context<{ Bindings: Env }>) => {
  try {
    console.log(`[FILE_EXPLORER_START] operation=get_tree`);
    
    // List all objects in the bucket (try both with and without documents/ prefix)
    let result = await FileStorageService.listObjects("documents/", c.env);
    
    // If no files found in documents/, try listing from root
    if (result.objects.length === 0) {
      console.log(`[FILE_EXPLORER_DEBUG] No files in documents/, trying root`);
      result = await FileStorageService.listObjects("", c.env);
    }
    
    // Build hierarchical tree structure
    const tree = buildFileTree(result.objects);
    
    console.log(`[FILE_EXPLORER_SUCCESS] operation=get_tree total_files=${result.objects.length}`);
    
    return c.json(formatSuccessResponse({
      tree,
      totalFiles: result.objects.length,
      truncated: result.truncated
    }));
  } catch (error: unknown) {
    console.error(`[FILE_EXPLORER_ERROR] operation=get_tree error_type=tree_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
    return c.json(formatErrorResponse("Failed to get file tree"), 500);
  }
});

/**
 * Browse files in a specific directory
 * GET /api/files/browse?path=documents/abc123/
 */
fileExplorerRoutes.get("/api/files/browse", async (c: Context<{ Bindings: Env }>) => {
  try {
    const path = c.req.query("path") || "documents/";
    const delimiter = c.req.query("delimiter") || undefined;
    
    console.log(`[FILE_EXPLORER_START] operation=browse_directory path=${path} delimiter=${delimiter || 'none'}`);
    
    // List objects with the specified path
    const result = await FileStorageService.listObjects(path, c.env, delimiter);
    
    // Process the results to separate folders and files
    const folders = result.delimitedPrefixes || [];
    const files = result.objects.map(obj => ({
      key: obj.key,
      name: obj.key.split('/').pop() || obj.key,
      size: obj.size,
      lastModified: obj.uploaded,
      contentType: getContentTypeFromPath(obj.key),
      isFile: true
    }));
    
    const folderItems = folders.map(prefix => ({
      key: prefix,
      name: prefix.split('/').filter(Boolean).pop() || prefix,
      isFile: false
    }));
    
    console.log(`[FILE_EXPLORER_SUCCESS] operation=browse_directory path=${path} folders=${folders.length} files=${files.length}`);
    
    return c.json(formatSuccessResponse({
      path,
      folders: folderItems,
      files,
      totalItems: files.length + folderItems.length,
      truncated: result.truncated
    }));
  } catch (error: unknown) {
    console.error(`[FILE_EXPLORER_ERROR] operation=browse_directory error_type=browse_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
    return c.json(formatErrorResponse("Failed to browse directory"), 500);
  }
});

/**
 * Get file content for preview/download
 * GET /api/files/content?path=documents/abc123/metadata.json
 */
fileExplorerRoutes.get("/api/files/content", async (c: Context<{ Bindings: Env }>) => {
  try {
    const path = c.req.query("path");
    const download = c.req.query("download") === "true";
    
    if (!path) {
      return c.json(formatErrorResponse("Path parameter is required"), 400);
    }
    
    console.log(`[FILE_EXPLORER_START] operation=get_content path=${path} download=${download}`);
    
    // Get the file from R2
    const fileObject = await FileStorageService.getFile(path, c.env);
    
    if (!fileObject) {
      console.log(`[FILE_EXPLORER_NOT_FOUND] operation=get_content path=${path}`);
      return c.json(formatErrorResponse("File not found"), 404);
    }
    
    // Get content type
    const contentType = fileObject.httpMetadata?.contentType || getContentTypeFromPath(path);
    
    // Set headers
    c.header("Content-Type", contentType);
    c.header("Content-Length", fileObject.size.toString());
    
    if (download) {
      const fileName = path.split('/').pop() || 'download';
      c.header("Content-Disposition", `attachment; filename="${fileName}"`);
    } else {
      c.header("Content-Disposition", "inline");
    }
    
    // For text-based files, return as text for preview
    if (isTextFile(contentType)) {
      // @ts-ignore - R2Object has text() method but not in types
      const text = await fileObject.text();
      console.log(`[FILE_EXPLORER_SUCCESS] operation=get_content path=${path} type=text size=${text.length}`);
      return c.text(text);
    }
    
    // For binary files, return as binary
    // @ts-ignore - R2Object has arrayBuffer() method but not in types
    const arrayBuffer = await fileObject.arrayBuffer();
    console.log(`[FILE_EXPLORER_SUCCESS] operation=get_content path=${path} type=binary size=${arrayBuffer.byteLength}`);
    return c.body(arrayBuffer);
    
  } catch (error: unknown) {
    console.error(`[FILE_EXPLORER_ERROR] operation=get_content error_type=content_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
    return c.json(formatErrorResponse("Failed to get file content"), 500);
  }
});

/**
 * Get file metadata
 * GET /api/files/info?path=documents/abc123/metadata.json
 */
fileExplorerRoutes.get("/api/files/info", async (c: Context<{ Bindings: Env }>) => {
  try {
    const path = c.req.query("path");
    
    if (!path) {
      return c.json(formatErrorResponse("Path parameter is required"), 400);
    }
    
    console.log(`[FILE_EXPLORER_START] operation=get_info path=${path}`);
    
    // Get the file from R2
    const fileObject = await FileStorageService.getFile(path, c.env);
    
    if (!fileObject) {
      console.log(`[FILE_EXPLORER_NOT_FOUND] operation=get_info path=${path}`);
      return c.json(formatErrorResponse("File not found"), 404);
    }
    
    const info = {
      key: fileObject.key,
      name: path.split('/').pop() || path,
      size: fileObject.size,
      lastModified: fileObject.uploaded,
      contentType: fileObject.httpMetadata?.contentType || getContentTypeFromPath(path),
      etag: fileObject.etag,
      checksums: fileObject.checksums
    };
    
    console.log(`[FILE_EXPLORER_SUCCESS] operation=get_info path=${path} size=${info.size}`);
    
    return c.json(formatSuccessResponse(info));
  } catch (error: unknown) {
    console.error(`[FILE_EXPLORER_ERROR] operation=get_info error_type=info_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
    return c.json(formatErrorResponse("Failed to get file info"), 500);
  }
});

/**
 * Build hierarchical tree structure from flat file list
 */
function buildFileTree(objects: R2Object[]): FileTreeNode {
  const root: FileTreeNode = {
    name: "documents",
    path: "documents/",
    isFile: false,
    children: []
  };
  
  for (const obj of objects) {
    const parts = obj.key.split('/').filter(Boolean);
    let current = root;
    
    // Build path incrementally
    let currentPath = "";
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += part + "/";
      
      const isLastPart = i === parts.length - 1;
      const isFile = isLastPart && !obj.key.endsWith('/');
      
      // Find existing child or create new one
      let child = current.children?.find(c => c.name === part);
      
      if (!child) {
        child = {
          name: part,
          path: currentPath,
          isFile,
          children: isFile ? undefined : []
        };
        
        if (isFile) {
          child.size = obj.size;
          child.lastModified = obj.uploaded;
          child.contentType = getContentTypeFromPath(obj.key);
        }
        
        current.children?.push(child);
      }
      
      if (!isFile) {
        current = child;
      }
    }
  }
  
  return root;
}

/**
 * Get content type from file path
 */
function getContentTypeFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json';
    case 'md':
    case 'markdown':
      return 'text/markdown';
    case 'txt':
      return 'text/plain';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'base64':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Check if content type is text-based
 */
function isTextFile(contentType: string): boolean {
  return contentType.startsWith('text/') || 
         contentType === 'application/json' ||
         contentType === 'text/markdown';
}

/**
 * File tree node interface
 */
interface FileTreeNode {
  name: string;
  path: string;
  isFile: boolean;
  size?: number;
  lastModified?: Date;
  contentType?: string;
  children?: FileTreeNode[];
}

export default fileExplorerRoutes;
