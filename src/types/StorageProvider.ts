/**
 * Base storage provider interface that all storage providers must implement
 */
export interface StorageProvider {
  name: string
  /**
   * Upload a file to storage
   * @param file The file buffer
   * @param fileName The name of the file
   * @param context Additional context information (like directory)
   * @returns Promise with upload result containing url, path and any provider-specific data
   */
  upload(file: Buffer, fileName: string, context?: any): Promise<any>

  /**
   * Download a file from storage
   * @param fileName The name of the file to download
   * @param context Additional context information (like directory)
   * @returns Promise with the file buffer
   */
  download(fileName: string, context?: any): Promise<Buffer>

  /**
   * Delete a file from storage
   * @param fileName The name of the file to delete
   * @param context Additional context information (like directory)
   * @returns Promise with deletion result
   */
  delete(fileName: string, context?: any): Promise<any>

  /**
   * List files in storage
   * @param context Additional context information (like directory)
   * @returns Promise with array of file names
   */
  list(context?: any): Promise<string[]>

  /**
   * Get URL for a file
   * @param fileName The name of the file
   * @param context Additional context information (like directory)
   * @returns Promise with the file URL
   */
  getUrl(fileName: string, context?: any): Promise<string>

  /**
   * Test the connection to the storage provider
   * @returns Promise with the result of the connection test
   */
  testConnection(): Promise<any>
}
