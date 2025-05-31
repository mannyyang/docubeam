# Structured Logging for Wrangler Tail

This document explains how to use the structured logging system implemented in this project to easily filter logs with `wrangler tail`.

## Overview

The logging system has been updated to use structured, filterable formats that work seamlessly with `wrangler tail`'s filtering capabilities. All log messages now follow consistent patterns with key-value pairs that can be easily searched and filtered.

## Log Format Structure

All logs follow this general pattern:
```
[CATEGORY] key=value key2=value2 message
```

### Log Categories

- `[UPLOAD_START]` - Document upload initiation
- `[UPLOAD_PROGRESS]` - Upload progress steps
- `[UPLOAD_ERROR]` - Upload validation errors
- `[OCR_START]` - OCR processing initiation
- `[OCR_API_START]` - Mistral API calls
- `[OCR_API_PROGRESS]` - API processing steps
- `[OCR_API_ERROR]` - API-related errors
- `[OCR_ERROR]` - OCR processing errors
- `[ROUTE_ERROR]` - HTTP route errors
- `[FILE_EXPLORER_START]` - File explorer operation initiation
- `[FILE_EXPLORER_SUCCESS]` - Successful file explorer operations
- `[FILE_EXPLORER_ERROR]` - File explorer errors
- `[FILE_EXPLORER_NOT_FOUND]` - File not found events
- `[STORAGE_START]` - R2 storage operation initiation
- `[STORAGE_SUCCESS]` - Successful R2 storage operations
- `[STORAGE_ERROR]` - R2 storage errors

## Filtering with Wrangler Tail

### Basic Usage

Start tailing logs:
```bash
pnpm wrangler tail
```

### Filter by Log Category

Filter for upload-related logs:
```bash
pnpm wrangler tail --search "UPLOAD"
```

Filter for OCR-related logs:
```bash
pnpm wrangler tail --search "OCR"
```

Filter for file explorer logs:
```bash
pnpm wrangler tail --search "FILE_EXPLORER"
```

Filter for storage operations:
```bash
pnpm wrangler tail --search "STORAGE"
```

Filter for errors only:
```bash
pnpm wrangler tail --search "ERROR"
```

### Filter by Specific Operations

Filter for document uploads:
```bash
pnpm wrangler tail --search "UPLOAD_START"
```

Filter for OCR processing:
```bash
pnpm wrangler tail --search "OCR_START"
```

Filter for API calls:
```bash
pnpm wrangler tail --search "OCR_API_START"
```

Filter for file explorer operations:
```bash
pnpm wrangler tail --search "FILE_EXPLORER_START"
```

### Filter by Document ID

Filter logs for a specific document:
```bash
pnpm wrangler tail --search "document_id=abc123"
```

### Filter by File Path

Filter logs for specific file operations:
```bash
pnpm wrangler tail --search "path=documents/abc123/metadata.json"
```

### Filter by Error Types

Filter for file validation errors:
```bash
pnpm wrangler tail --search "invalid_file_type"
```

Filter for file size errors:
```bash
pnpm wrangler tail --search "file_too_large"
```

Filter for API key errors:
```bash
pnpm wrangler tail --search "missing_api_key"
```

Filter for file not found errors:
```bash
pnpm wrangler tail --search "FILE_EXPLORER_NOT_FOUND"
```

### Filter by HTTP Method

Filter for POST requests (uploads):
```bash
pnpm wrangler tail --method POST
```

Filter for GET requests (file explorer, downloads):
```bash
pnpm wrangler tail --method GET
```

### Filter by Status

Filter for error responses:
```bash
pnpm wrangler tail --status error
```

Filter for successful responses:
```bash
pnpm wrangler tail --status ok
```

### Combine Filters

You can combine multiple filters for more specific results:

```bash
# OCR errors only
pnpm wrangler tail --search "OCR_ERROR" --status error

# Upload operations for a specific document
pnpm wrangler tail --search "UPLOAD" --search "document_id=abc123"

# File explorer operations with errors
pnpm wrangler tail --search "FILE_EXPLORER" --search "ERROR"

# Storage operations for a specific path
pnpm wrangler tail --search "STORAGE" --search "path=documents/abc123"
```

## Common Log Patterns

### Document Upload Flow

1. `[UPLOAD_START] document=filename.pdf size=1234567 type=application/pdf`
2. `[UPLOAD_PROGRESS] step=id_generated document_id=abc123`
3. `[STORAGE_START] document_id=abc123 file_name=filename.pdf sub_path=original size=1234567`
4. `[STORAGE_SUCCESS] document_id=abc123 path=documents/abc123/original/filename.pdf operation=file_stored`
5. `[OCR_START] document_id=abc123 operation=ocr_processing`
6. `[OCR_API_START] operation=mistral_ocr buffer_size=1234567`
7. `[OCR_API_PROGRESS] step=api_key_validated key_prefix=sk-abc123`

### File Explorer Flow

1. `[FILE_EXPLORER_START] operation=get_tree`
2. `[STORAGE_START] prefix=documents/ delimiter=none operation=list_objects`
3. `[STORAGE_SUCCESS] prefix=documents/ object_count=42 truncated=false operation=objects_listed`
4. `[FILE_EXPLORER_SUCCESS] operation=get_tree total_files=42`
5. `[FILE_EXPLORER_START] operation=browse_directory path=documents/abc123/ delimiter=/`
6. `[FILE_EXPLORER_SUCCESS] operation=browse_directory path=documents/abc123/ folders=2 files=1`
7. `[FILE_EXPLORER_START] operation=get_content path=documents/abc123/metadata.json download=false`
8. `[STORAGE_START] path=documents/abc123/metadata.json operation=file_retrieve`
9. `[STORAGE_SUCCESS] path=documents/abc123/metadata.json operation=file_retrieved`
10. `[FILE_EXPLORER_SUCCESS] operation=get_content path=documents/abc123/metadata.json type=text size=239`

### Error Scenarios

Upload validation errors:
```
[UPLOAD_ERROR] type=invalid_file_type file_type=image/jpeg
[UPLOAD_ERROR] type=file_too_large size=15728640 max_size=10485760
```

OCR processing errors:
```
[OCR_API_ERROR] type=missing_api_key message=MISTRAL_AI_API_KEY not configured
[OCR_ERROR] document_id=abc123 error_type=processing_failed error_name=TypeError error_message=Cannot read property
```

File explorer errors:
```
[FILE_EXPLORER_ERROR] operation=get_tree error_type=tree_failed error_name=NetworkError error_message=Failed to connect
[FILE_EXPLORER_NOT_FOUND] operation=get_content path=documents/missing/file.pdf
[STORAGE_ERROR] path=documents/abc123/missing.json error_type=retrieval_failed error_name=NotFound error_message=Object not found
```

Route errors:
```
[ROUTE_ERROR] endpoint=upload_document error=File too large
```

## Debugging Workflows

### Debug Upload Issues

1. Start with upload logs:
   ```bash
   pnpm wrangler tail --search "UPLOAD"
   ```

2. If you see errors, filter by error type:
   ```bash
   pnpm wrangler tail --search "UPLOAD_ERROR"
   ```

3. For specific document issues:
   ```bash
   pnpm wrangler tail --search "document_id=YOUR_DOC_ID"
   ```

### Debug File Explorer Issues

1. Filter for file explorer operations:
   ```bash
   pnpm wrangler tail --search "FILE_EXPLORER"
   ```

2. Check for file not found issues:
   ```bash
   pnpm wrangler tail --search "FILE_EXPLORER_NOT_FOUND"
   ```

3. Monitor specific file operations:
   ```bash
   pnpm wrangler tail --search "path=documents/abc123/metadata.json"
   ```

4. Check storage layer issues:
   ```bash
   pnpm wrangler tail --search "STORAGE_ERROR"
   ```

### Debug OCR Issues

1. Filter for OCR operations:
   ```bash
   pnpm wrangler tail --search "OCR"
   ```

2. Check API-specific issues:
   ```bash
   pnpm wrangler tail --search "OCR_API"
   ```

3. Look for processing errors:
   ```bash
   pnpm wrangler tail --search "OCR_ERROR"
   ```

### Debug API Issues

1. Check for API key problems:
   ```bash
   pnpm wrangler tail --search "missing_api_key"
   ```

2. Monitor API calls:
   ```bash
   pnpm wrangler tail --search "OCR_API_START"
   ```

3. Check for API errors:
   ```bash
   pnpm wrangler tail --search "OCR_API_ERROR"
   ```

### Debug Storage Issues

1. Monitor storage operations:
   ```bash
   pnpm wrangler tail --search "STORAGE"
   ```

2. Check for storage errors:
   ```bash
   pnpm wrangler tail --search "STORAGE_ERROR"
   ```

3. Monitor file retrieval:
   ```bash
   pnpm wrangler tail --search "operation=file_retrieve"
   ```

## Performance Monitoring

### Monitor Upload Performance

Track upload start and completion:
```bash
pnpm wrangler tail --search "UPLOAD_START\|UPLOAD_PROGRESS"
```

### Monitor File Explorer Performance

Track file explorer operations:
```bash
pnpm wrangler tail --search "FILE_EXPLORER_START\|FILE_EXPLORER_SUCCESS"
```

### Monitor Storage Performance

Track storage operations and timing:
```bash
pnpm wrangler tail --search "STORAGE_START\|STORAGE_SUCCESS"
```

### Monitor OCR Performance

Track OCR processing times:
```bash
pnpm wrangler tail --search "OCR_START\|OCR_API_START"
```

### Monitor Error Rates

Track all errors:
```bash
pnpm wrangler tail --search "ERROR"
```

## Tips for Effective Logging

1. **Use specific searches**: Instead of searching for "error", use specific error types like "invalid_file_type"

2. **Combine filters**: Use multiple `--search` parameters to narrow down results

3. **Monitor in real-time**: Keep a tail session running during development to catch issues immediately

4. **Use sampling**: For high-traffic scenarios, use `--sampling-rate` to reduce log volume

5. **Filter by IP**: Use `--ip self` to see only your own requests during testing

6. **Track operations**: Use operation-specific filters to follow complete workflows

## Example Debugging Sessions

### Debug File Explorer Issues

```bash
# Start general file explorer monitoring
pnpm wrangler tail --search "FILE_EXPLORER"

# User reports files not showing - check tree operations
pnpm wrangler tail --search "FILE_EXPLORER_START" --search "operation=get_tree"

# Check storage layer for listing issues
pnpm wrangler tail --search "STORAGE" --search "operation=list_objects"

# Monitor specific path browsing
pnpm wrangler tail --search "FILE_EXPLORER" --search "path=documents/abc123"
```

### Debug Upload and Storage Flow

```bash
# Start general monitoring
pnpm wrangler tail

# User reports upload issue - filter for upload errors
pnpm wrangler tail --search "UPLOAD_ERROR"

# Found file size issue - check specific document
pnpm wrangler tail --search "document_id=abc123"

# Monitor storage operations for that document
pnpm wrangler tail --search "STORAGE" --search "document_id=abc123"

# Monitor OCR processing for that document
pnpm wrangler tail --search "OCR" --search "document_id=abc123"

# Check API status
pnpm wrangler tail --search "OCR_API"
```

### Debug File Access Issues

```bash
# Monitor file content requests
pnpm wrangler tail --search "FILE_EXPLORER" --search "operation=get_content"

# Check for file not found errors
pnpm wrangler tail --search "FILE_EXPLORER_NOT_FOUND"

# Monitor storage retrieval operations
pnpm wrangler tail --search "STORAGE" --search "operation=file_retrieve"

# Check specific file path issues
pnpm wrangler tail --search "path=documents/abc123/metadata.json"
```

This structured approach makes debugging much more efficient and allows for precise monitoring of specific operations or error conditions across the entire application stack.
