import { createDocumentPath } from "../utils";

/**
 * Service for handling file storage operations with R2
 */
export class FileStorageService {
  /**
   * Store a file in R2 with organized structure
   * @param documentId The document ID
   * @param fileName The file name
   * @param buffer The file buffer
   * @param contentType The content type
   * @param env Environment variables
   * @param subPath Optional sub-path (e.g., 'original', 'ocr')
   */
  static async storeFile(
    documentId: string,
    fileName: string,
    buffer: ArrayBuffer,
    contentType: string,
    env: Env,
    subPath: string = 'original'
  ): Promise<string> {
    console.log(`[STORAGE_START] document_id=${documentId} file_name=${fileName} sub_path=${subPath} size=${buffer.byteLength} content_type=${contentType}`);
    
    const documentPath = createDocumentPath(documentId);
    const fullPath = `${documentPath}/${subPath}/${fileName}`;
    
    try {
      await env.PDF_BUCKET.put(fullPath, buffer, {
        httpMetadata: {
          contentType: contentType,
        },
      });
      
      console.log(`[STORAGE_SUCCESS] document_id=${documentId} path=${fullPath} operation=file_stored`);
      return fullPath;
    } catch (error) {
      console.error(`[STORAGE_ERROR] document_id=${documentId} error_type=storage_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Store JSON data in R2
   * @param documentId The document ID
   * @param fileName The file name
   * @param data The data to store
   * @param env Environment variables
   * @param subPath Optional sub-path
   */
  static async storeJSON(
    documentId: string,
    fileName: string,
    data: unknown,
    env: Env,
    subPath: string = ''
  ): Promise<string> {
    console.log(`[STORAGE_START] document_id=${documentId} file_name=${fileName} sub_path=${subPath} operation=json_store`);
    
    const documentPath = createDocumentPath(documentId);
    const fullPath = subPath ? `${documentPath}/${subPath}/${fileName}` : `${documentPath}/${fileName}`;
    
    try {
      await env.PDF_BUCKET.put(
        fullPath,
        JSON.stringify(data, null, 2),
        {
          httpMetadata: {
            contentType: "application/json",
          },
        }
      );
      
      console.log(`[STORAGE_SUCCESS] document_id=${documentId} path=${fullPath} operation=json_stored`);
      return fullPath;
    } catch (error) {
      console.error(`[STORAGE_ERROR] document_id=${documentId} error_type=json_storage_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Store text data in R2
   * @param documentId The document ID
   * @param fileName The file name
   * @param text The text to store
   * @param contentType The content type
   * @param env Environment variables
   * @param subPath Optional sub-path
   */
  static async storeText(
    documentId: string,
    fileName: string,
    text: string,
    contentType: string,
    env: Env,
    subPath: string = ''
  ): Promise<string> {
    console.log(`[STORAGE_START] document_id=${documentId} file_name=${fileName} sub_path=${subPath} text_length=${text.length} operation=text_store`);
    
    const documentPath = createDocumentPath(documentId);
    const fullPath = subPath ? `${documentPath}/${subPath}/${fileName}` : `${documentPath}/${fileName}`;
    
    try {
      await env.PDF_BUCKET.put(fullPath, text, {
        httpMetadata: {
          contentType: contentType,
        },
      });
      
      console.log(`[STORAGE_SUCCESS] document_id=${documentId} path=${fullPath} operation=text_stored`);
      return fullPath;
    } catch (error) {
      console.error(`[STORAGE_ERROR] document_id=${documentId} error_type=text_storage_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Retrieve a file from R2
   * @param path The file path
   * @param env Environment variables
   * @returns The R2 object or null if not found
   */
  static async getFile(path: string, env: Env): Promise<R2Object | null> {
    console.log(`[STORAGE_START] path=${path} operation=file_retrieve`);
    
    try {
      const object = await env.PDF_BUCKET.get(path);
      
      if (object) {
        console.log(`[STORAGE_SUCCESS] path=${path} operation=file_retrieved`);
      } else {
        console.log(`[STORAGE_NOT_FOUND] path=${path} operation=file_not_found`);
      }
      
      return object;
    } catch (error) {
      console.error(`[STORAGE_ERROR] path=${path} error_type=retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Retrieve JSON data from R2
   * @param path The file path
   * @param env Environment variables
   * @returns The parsed JSON data or null if not found
   */
  static async getJSON<T>(path: string, env: Env): Promise<T | null> {
    console.log(`[STORAGE_START] path=${path} operation=json_retrieve`);
    
    try {
      const object = await env.PDF_BUCKET.get(path);
      
      if (!object) {
        console.log(`[STORAGE_NOT_FOUND] path=${path} operation=json_not_found`);
        return null;
      }

      const data = await object.json<T>();
      console.log(`[STORAGE_SUCCESS] path=${path} operation=json_retrieved`);
      return data;
    } catch (error) {
      console.error(`[STORAGE_ERROR] path=${path} error_type=json_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Retrieve text data from R2
   * @param path The file path
   * @param env Environment variables
   * @returns The text content or null if not found
   */
  static async getText(path: string, env: Env): Promise<string | null> {
    console.log(`[STORAGE_START] path=${path} operation=text_retrieve`);
    
    try {
      const object = await env.PDF_BUCKET.get(path);
      
      if (!object) {
        console.log(`[STORAGE_NOT_FOUND] path=${path} operation=text_not_found`);
        return null;
      }

      const text = await object.text();
      console.log(`[STORAGE_SUCCESS] path=${path} text_length=${text.length} operation=text_retrieved`);
      return text;
    } catch (error) {
      console.error(`[STORAGE_ERROR] path=${path} error_type=text_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * List objects in R2 with a given prefix
   * @param prefix The prefix to search for
   * @param env Environment variables
   * @param delimiter Optional delimiter for folder-like listing
   * @returns The list result
   */
  static async listObjects(
    prefix: string,
    env: Env,
    delimiter?: string
  ): Promise<R2Objects> {
    console.log(`[STORAGE_START] prefix=${prefix} delimiter=${delimiter || 'none'} operation=list_objects`);
    
    try {
      const result = await env.PDF_BUCKET.list({
        prefix,
        delimiter,
      });
      
      console.log(`[STORAGE_SUCCESS] prefix=${prefix} object_count=${result.objects.length} truncated=${result.truncated} operation=objects_listed`);
      return result;
    } catch (error) {
      console.error(`[STORAGE_ERROR] prefix=${prefix} error_type=list_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete a file from R2
   * @param path The file path
   * @param env Environment variables
   */
  static async deleteFile(path: string, env: Env): Promise<void> {
    console.log(`[STORAGE_START] path=${path} operation=file_delete`);
    
    try {
      await env.PDF_BUCKET.delete(path);
      console.log(`[STORAGE_SUCCESS] path=${path} operation=file_deleted`);
    } catch (error) {
      console.error(`[STORAGE_ERROR] path=${path} error_type=deletion_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete all files for a document
   * @param documentId The document ID
   * @param env Environment variables
   */
  static async deleteDocument(documentId: string, env: Env): Promise<void> {
    console.log(`[STORAGE_START] document_id=${documentId} operation=document_delete`);
    
    try {
      // List all objects in the document folder
      const objects = await this.listObjects(`documents/${documentId}/`, env);
      
      console.log(`[STORAGE_PROGRESS] document_id=${documentId} files_to_delete=${objects.objects.length} operation=deletion_started`);
      
      // Delete all objects
      for (const object of objects.objects) {
        await this.deleteFile(object.key, env);
      }
      
      console.log(`[STORAGE_SUCCESS] document_id=${documentId} files_deleted=${objects.objects.length} operation=document_deleted`);
    } catch (error) {
      console.error(`[STORAGE_ERROR] document_id=${documentId} error_type=document_deletion_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
