import { ERROR_MESSAGES, STORAGE_CONFIG } from "../config";
import { ValidationError } from "../middleware/error";

/**
 * Service for handling document validation operations
 */
export class DocumentValidationService {
  /**
   * Validate a file for upload
   * @param file The file to validate
   * @throws ValidationError if validation fails
   */
  static validateFile(file: File): void {
    console.log(`[VALIDATION_START] file_name=${file?.name || 'undefined'} file_size=${file?.size || 0} file_type=${file?.type || 'undefined'} operation=file_validation`);
    
    // Check if file exists
    if (!file) {
      console.error(`[VALIDATION_ERROR] error_type=no_file_provided error_message=No file provided`);
      throw new ValidationError("No file provided");
    }
    
    // Check file type
    if (!STORAGE_CONFIG.FILE_LIMITS.ACCEPTED_MIME_TYPES.includes(file.type)) {
      console.error(`[VALIDATION_ERROR] error_type=invalid_file_type file_type=${file.type} accepted_types=${STORAGE_CONFIG.FILE_LIMITS.ACCEPTED_MIME_TYPES.join(',')}`);
      throw new ValidationError(ERROR_MESSAGES.DOCUMENTS.INVALID_FILE_TYPE);
    }
    
    // Check file size
    if (file.size > STORAGE_CONFIG.FILE_LIMITS.MAX_FILE_SIZE) {
      console.error(`[VALIDATION_ERROR] error_type=file_too_large file_size=${file.size} max_size=${STORAGE_CONFIG.FILE_LIMITS.MAX_FILE_SIZE}`);
      throw new ValidationError(ERROR_MESSAGES.DOCUMENTS.FILE_TOO_LARGE);
    }
    
    // Check minimum file size
    if (file.size === 0) {
      console.error(`[VALIDATION_ERROR] error_type=empty_file file_size=${file.size}`);
      throw new ValidationError("File is empty");
    }
    
    console.log(`[VALIDATION_SUCCESS] file_name=${file.name} file_size=${file.size} file_type=${file.type} operation=file_validated`);
  }

  /**
   * Validate document ID format
   * @param documentId The document ID to validate
   * @throws ValidationError if validation fails
   */
  static validateDocumentId(documentId: string): void {
    console.log(`[VALIDATION_START] document_id=${documentId} operation=document_id_validation`);
    
    if (!documentId) {
      console.error(`[VALIDATION_ERROR] error_type=missing_document_id error_message=Document ID is required`);
      throw new ValidationError("Document ID is required");
    }
    
    if (typeof documentId !== 'string') {
      console.error(`[VALIDATION_ERROR] error_type=invalid_document_id_type document_id_type=${typeof documentId}`);
      throw new ValidationError("Document ID must be a string");
    }
    
    // Check for valid UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      console.error(`[VALIDATION_ERROR] error_type=invalid_document_id_format document_id=${documentId}`);
      throw new ValidationError("Invalid document ID format");
    }
    
    console.log(`[VALIDATION_SUCCESS] document_id=${documentId} operation=document_id_validated`);
  }

  /**
   * Validate page number
   * @param pageNumber The page number to validate
   * @param maxPages Optional maximum page count for validation
   * @throws ValidationError if validation fails
   */
  static validatePageNumber(pageNumber: number, maxPages?: number): void {
    console.log(`[VALIDATION_START] page_number=${pageNumber} max_pages=${maxPages || 'undefined'} operation=page_number_validation`);
    
    if (!Number.isInteger(pageNumber)) {
      console.error(`[VALIDATION_ERROR] error_type=invalid_page_number page_number=${pageNumber} error_message=Page number must be an integer`);
      throw new ValidationError("Page number must be an integer");
    }
    
    if (pageNumber < 1) {
      console.error(`[VALIDATION_ERROR] error_type=invalid_page_number page_number=${pageNumber} error_message=Page number must be greater than 0`);
      throw new ValidationError("Page number must be greater than 0");
    }
    
    if (maxPages && pageNumber > maxPages) {
      console.error(`[VALIDATION_ERROR] error_type=page_number_out_of_range page_number=${pageNumber} max_pages=${maxPages}`);
      throw new ValidationError(`Page number ${pageNumber} exceeds document page count of ${maxPages}`);
    }
    
    console.log(`[VALIDATION_SUCCESS] page_number=${pageNumber} operation=page_number_validated`);
  }

  /**
   * Validate file name for security
   * @param fileName The file name to validate
   * @throws ValidationError if validation fails
   */
  static validateFileName(fileName: string): void {
    console.log(`[VALIDATION_START] file_name=${fileName} operation=file_name_validation`);
    
    if (!fileName) {
      console.error(`[VALIDATION_ERROR] error_type=missing_file_name error_message=File name is required`);
      throw new ValidationError("File name is required");
    }
    
    // Check for dangerous characters (avoiding control character literals)
    const dangerousChars = /[<>:"/\\|?*]/;
    const controlChars = /[\u0000-\u001f]/;
    if (dangerousChars.test(fileName) || controlChars.test(fileName)) {
      console.error(`[VALIDATION_ERROR] error_type=invalid_file_name file_name=${fileName} error_message=File name contains invalid characters`);
      throw new ValidationError("File name contains invalid characters");
    }
    
    // Check file name length
    if (fileName.length > 255) {
      console.error(`[VALIDATION_ERROR] error_type=file_name_too_long file_name_length=${fileName.length} max_length=255`);
      throw new ValidationError("File name is too long (maximum 255 characters)");
    }
    
    // Check for reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(fileName)) {
      console.error(`[VALIDATION_ERROR] error_type=reserved_file_name file_name=${fileName}`);
      throw new ValidationError("File name is reserved and cannot be used");
    }
    
    console.log(`[VALIDATION_SUCCESS] file_name=${fileName} operation=file_name_validated`);
  }

  /**
   * Validate environment configuration
   * @param env The environment to validate
   * @throws ValidationError if validation fails
   */
  static validateEnvironment(env: Env): void {
    console.log(`[VALIDATION_START] operation=environment_validation`);
    
    if (!env.PDF_BUCKET) {
      console.error(`[VALIDATION_ERROR] error_type=missing_pdf_bucket error_message=PDF_BUCKET is not configured`);
      throw new ValidationError("PDF storage is not configured");
    }
    
    if (!env.MISTRAL_AI_API_KEY) {
      console.error(`[VALIDATION_ERROR] error_type=missing_mistral_key error_message=MISTRAL_AI_API_KEY is not configured`);
      throw new ValidationError("OCR service is not configured");
    }
    
    console.log(`[VALIDATION_SUCCESS] operation=environment_validated`);
  }

  /**
   * Validate buffer data
   * @param buffer The buffer to validate
   * @param expectedMinSize Optional minimum size in bytes
   * @throws ValidationError if validation fails
   */
  static validateBuffer(buffer: ArrayBuffer, expectedMinSize?: number): void {
    // Check if buffer exists first before accessing properties
    if (!buffer) {
      console.error(`[VALIDATION_ERROR] error_type=missing_buffer error_message=Buffer is required`);
      throw new ValidationError("Buffer is required");
    }
    
    console.log(`[VALIDATION_START] buffer_size=${buffer.byteLength} expected_min_size=${expectedMinSize || 'undefined'} operation=buffer_validation`);
    
    if (buffer.byteLength === 0) {
      console.error(`[VALIDATION_ERROR] error_type=empty_buffer buffer_size=${buffer.byteLength}`);
      throw new ValidationError("Buffer is empty");
    }
    
    if (expectedMinSize && buffer.byteLength < expectedMinSize) {
      console.error(`[VALIDATION_ERROR] error_type=buffer_too_small buffer_size=${buffer.byteLength} expected_min_size=${expectedMinSize}`);
      throw new ValidationError(`Buffer is too small (minimum ${expectedMinSize} bytes required)`);
    }
    
    console.log(`[VALIDATION_SUCCESS] buffer_size=${buffer.byteLength} operation=buffer_validated`);
  }

  /**
   * Validate content type
   * @param contentType The content type to validate
   * @param allowedTypes Optional array of allowed content types
   * @throws ValidationError if validation fails
   */
  static validateContentType(contentType: string, allowedTypes?: string[]): void {
    console.log(`[VALIDATION_START] content_type=${contentType} allowed_types=${allowedTypes?.join(',') || 'any'} operation=content_type_validation`);
    
    if (!contentType) {
      console.error(`[VALIDATION_ERROR] error_type=missing_content_type error_message=Content type is required`);
      throw new ValidationError("Content type is required");
    }
    
    if (allowedTypes && !allowedTypes.includes(contentType)) {
      console.error(`[VALIDATION_ERROR] error_type=invalid_content_type content_type=${contentType} allowed_types=${allowedTypes.join(',')}`);
      throw new ValidationError(`Content type '${contentType}' is not allowed`);
    }
    
    console.log(`[VALIDATION_SUCCESS] content_type=${contentType} operation=content_type_validated`);
  }
}
