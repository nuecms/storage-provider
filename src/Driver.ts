import path from 'path'
import { type StorageProvider } from './types/StorageProvider'

/**
 * Storage Driver that manages storage providers and delegates operations
 */
export class StorageDriver {
  private providers: Map<string, StorageProvider> = new Map()
  private defaultProvider: string = 'local'

  /**
   * Register a storage provider
   * @param name Provider name
   * @param provider Provider instance
   */
  registerProvider(name: string, provider: StorageProvider): void {
    this.providers.set(name, provider)
  }

  /**
   * Remove a storage provider
   * @param name Provider name
   */
  removeProvider(name: string): void {
    this.providers.delete(name)
  }

  /**
   * Get a storage provider by name
   * @param name Provider name
   * @returns The storage provider or undefined if not found
   */
  getProvider(name: string): StorageProvider | undefined {
    return this.providers.get(name)
  }

  /**
   * Set the default storage provider
   * @param name Provider name
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not registered`)
    }
    this.defaultProvider = name
  }

  /**
   * Get the default storage provider
   * @returns The default storage provider
   */
  getDefaultProvider(): StorageProvider {
    const provider = this.providers.get(this.defaultProvider)
    if (!provider) {
      throw new Error(`Default provider ${this.defaultProvider} not found`)
    }
    return provider
  }

  /**
   * Normalize a file path
   * @param filePath File path
   * @returns Normalized path
   */
  normalizePath(filePath: string): string {
    // Remove leading slashes and normalize path separators
    return filePath.replace(/^[\/\\]+/, '').replace(/\\/g, '/')
  }

  /**
   * Upload a file using the default provider
   * @param file The file buffer
   * @param fileName The name of the file
   * @param context Additional context information
   * @returns Promise with upload result
   */
  async uploadFile(file: Buffer, fileName: string, context?: any): Promise<any> {
    return this.getDefaultProvider().upload(file, fileName, context)
  }

  /**
   * Download a file using the default provider
   * @param filePath The path of the file to download
   * @returns Promise with the file buffer
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    const normalizedPath = this.normalizePath(filePath)
    const fileName = path.basename(normalizedPath)
    const directory = path.dirname(normalizedPath)

    return this.getDefaultProvider().download(fileName, { directory })
  }

  /**
   * Delete a file using the default provider
   * @param filePath The path of the file to delete
   * @returns Promise with deletion result
   */
  async deleteFile(filePath: string): Promise<any> {
    const normalizedPath = this.normalizePath(filePath)
    const fileName = path.basename(normalizedPath)
    const directory = path.dirname(normalizedPath)

    return this.getDefaultProvider().delete(fileName, { directory })
  }

  /**
   * Get URL for a file using the default provider
   * @param filePath The path of the file
   * @returns Promise with the file URL
   */
  async getFileUrl(filePath: string): Promise<string> {
    const normalizedPath = this.normalizePath(filePath)
    const fileName = path.basename(normalizedPath)
    const directory = path.dirname(normalizedPath)

    return this.getDefaultProvider().getUrl(fileName, { directory })
  }
}
