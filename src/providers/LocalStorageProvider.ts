import { StorageProvider } from '../types/StorageProvider';
import * as path from 'path';
import * as fs from 'node:fs/promises';

export class LocalStorageProvider implements StorageProvider {
  private baseDirectory: string;


  constructor(config: { baseDirectory?: string, rootBase?: string } = {}) {
    // root base
    this.baseDirectory = config.baseDirectory || path.resolve(process.cwd(), 'storage');
  }

  /**
   * Ensures the base directory exists.
   */
  private async ensureBaseDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.baseDirectory, { recursive: true });
    } catch (err) {
      console.error(`Failed to create base directory "${this.baseDirectory}": ${err}`);
      throw err;
    }
  }

  /**
   * Uploads a file to the local storage.
   * @param file - The file buffer to upload.
   * @param fileName - The name to assign to the uploaded file.
   * @param context - Additional context or metadata.
   * @returns The file path of the uploaded file.
   */
  async upload(file: Buffer, fileName: string, context: object): Promise<string> {
    await this.ensureBaseDirectory();
    const filePath = path.join(this.baseDirectory, fileName);

    try {
      await fs.writeFile(filePath, file);
      return filePath;
    } catch (err) {
      console.error(`Failed to upload file "${fileName}": ${err}`);
      throw err;
    }
  }

  /**
   * Downloads a file from the local storage.
   * @param fileName - The name of the file to download.
   * @param context - Additional context or metadata.
   * @returns The file content as a Buffer.
   */
  async download(fileName: string, context: object): Promise<Buffer> {
    const filePath = path.join(this.baseDirectory, fileName);

    try {
      return await fs.readFile(filePath);
    } catch (err) {
      console.error(`Failed to download file "${fileName}": ${err}`);
      throw err;
    }
  }

  /**
   * Deletes a file from the local storage.
   * @param fileName - The name of the file to delete.
   * @param context - Additional context or metadata.
   */
  async delete(fileName: string, context: object): Promise<void> {
    const filePath = path.join(this.baseDirectory, fileName);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(`File "${fileName}" does not exist.`);
      } else {
        console.error(`Failed to delete file "${fileName}": ${err}`);
        throw err;
      }
    }
  }

  /**
   * Lists all files in the local storage.
   * @param context - Additional context or metadata.
   * @returns An array of file names.
   */
  async list(context: object): Promise<string[]> {
    try {
      return await fs.readdir(this.baseDirectory);
    } catch (err) {
      console.error(`Failed to list files in "${this.baseDirectory}": ${err}`);
      throw err;
    }
  }

  /**
   * Gets the file URL or identifier in the local storage.
   * @param fileName - The name of the file.
   * @param context - Additional context or metadata.
   * @returns The `file://` URL of the file.
   */
  async getUrl(fileName: string, context: object): Promise<string> {
    const filePath = path.join(this.baseDirectory, fileName);
    return filePath;
  }
}
