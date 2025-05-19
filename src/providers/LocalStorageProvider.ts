import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { type StorageProvider } from '../types/StorageProvider'

const mkdirAsync = promisify(fs.mkdir)
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const unlinkAsync = promisify(fs.unlink)
const readdirAsync = promisify(fs.readdir)
const statAsync = promisify(fs.stat)

export interface LocalStorageOptions {
  basePath: string
  baseUrl: string
}

/**
 * Local filesystem storage provider
 */
export class LocalStorageProvider implements StorageProvider {
  name: string = 'local'
  private basePath: string
  private baseUrl: string

  constructor(options: LocalStorageOptions) {
    this.basePath = options.basePath
    this.baseUrl = options.baseUrl
  }

  /**
   * Ensure a directory exists
   */
  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await mkdirAsync(dirPath, { recursive: true })
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }

  /**
   * Upload a file to local storage
   */
  async upload(file: Buffer, fileName: string, context: any = {}): Promise<any> {
    const { directory = '' } = context
    const dirPath = path.join(this.basePath, directory)

    // Ensure directory exists
    await this.ensureDir(dirPath)

    // Write file
    const filePath = path.join(dirPath, fileName)
    await writeFileAsync(filePath, file)

    // Generate file URL
    const urlPath = path.join(directory, fileName).replace(/\\/g, '/')
    const fileUrl = `${this.baseUrl}/${urlPath}`

    return {
      url: fileUrl,
      path: urlPath,
      provider: 'local'
    }
  }

  /**
   * Download a file from local storage
   */
  async download(fileName: string, context: any = {}): Promise<Buffer> {
    const { directory = '' } = context
    const filePath = path.join(this.basePath, directory, fileName)

    try {
      return await readFileAsync(filePath)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${fileName}`)
      }
      throw error
    }
  }

  /**
   * Delete a file from local storage
   */
  async delete(fileName: string, context: any = {}): Promise<any> {
    const { directory = '' } = context
    const filePath = path.join(this.basePath, directory, fileName)

    try {
      await unlinkAsync(filePath)
      return { success: true }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return { success: false, message: 'File not found' }
      }
      throw error
    }
  }

  /**
   * List files in local storage
   */
  async list(context: any = {}): Promise<string[]> {
    const { directory = '' } = context
    const dirPath = path.join(this.basePath, directory)

    try {
      const files = await readdirAsync(dirPath)
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file)
          const stat = await statAsync(filePath)
          return { name: file, isDirectory: stat.isDirectory() }
        })
      )

      return fileStats.filter((file) => !file.isDirectory).map((file) => file.name)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  /**
   * Get URL for a file in local storage
   */
  async getUrl(fileName: string, context: any = {}): Promise<string> {
    const { directory = '' } = context
    const urlPath = path.join(directory, fileName).replace(/\\/g, '/')
    return `${this.baseUrl}/${urlPath}`
  }

  /**
   * Test connection to local storage
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to access the directory to test if it's writable
      const testDir = this.basePath
      await this.ensureDir(testDir)

      return { success: true, message: 'Local storage directory accessible' }
    } catch (error: any) {
      console.error('Local storage test connection error:', error)
      return {
        success: false,
        message: `Connection failed: ${error.message || 'Unknown error'}`
      }
    }
  }
}
