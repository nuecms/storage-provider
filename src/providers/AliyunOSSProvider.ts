import OSS from 'ali-oss';
import { StorageProvider } from '../types/StorageProvider';

export class AliyunOSSProvider implements StorageProvider {
  private client: OSS;

  constructor(config: {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
  }) {
    if (!config || !config.region || !config.accessKeyId || !config.accessKeySecret || !config.bucket) {
      throw new Error('AliyunOSSProvider: Missing required configuration');
    }

    this.client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
    });
  }

  /**
   * Uploads a file to Aliyun OSS.
   * @param file - The file to upload as a Buffer.
   * @param fileName - The name to assign to the uploaded file.
   * @param context - Additional metadata for the upload.
   * @returns The URL of the uploaded file.
   */
  async upload(file: Buffer, fileName: string, context: object): Promise<string> {
    try {
      const result = await this.client.put(fileName, file);
      return result.url; // The full URL of the uploaded file.
    } catch (err) {
      console.error(`Failed to upload file "${fileName}" to Aliyun OSS: ${err}`);
      throw err;
    }
  }

  /**
   * Downloads a file from Aliyun OSS.
   * @param fileName - The name of the file to download.
   * @param context - Additional metadata for the download.
   * @returns The file content as a Buffer.
   */
  async download(fileName: string, context: object): Promise<Buffer> {
    try {
      const result = await this.client.get(fileName);
      return result.content as Buffer;
    } catch (err) {
      console.error(`Failed to download file "${fileName}" from Aliyun OSS: ${err}`);
      throw err;
    }
  }

  /**
   * Deletes a file from Aliyun OSS.
   * @param fileName - The name of the file to delete.
   * @param context - Additional metadata for the delete operation.
   */
  async delete(fileName: string, context: object): Promise<void> {
    try {
      await this.client.delete(fileName);
    } catch (err) {
      console.error(`Failed to delete file "${fileName}" from Aliyun OSS: ${err}`);
      throw err;
    }
  }

  /**
   * Lists all files in the Aliyun OSS bucket.
   * @param context - Additional metadata for the list operation.
   * @returns An array of file names.
   */
  async list(context: object): Promise<string[]> {
    try {
      const result = await this.client.listV2({
        ...context
      }, {});
      return result.objects?.map((obj: { name: any; }) => obj.name) || [];
    } catch (err) {
      console.error('Failed to list files from Aliyun OSS:', err);
      throw err;
    }
  }

  /**
   * Gets the URL of a file stored in Aliyun OSS.
   * @param fileName - The name of the file.
   * @param context - Additional metadata for the operation.
   * @returns The URL of the file.
   */
  async getUrl(fileName: string, context: object): Promise<string> {
    try {
      return this.client.signatureUrl(fileName); // Signed URL for temporary access.
    } catch (err) {
      console.error(`Failed to get URL for file "${fileName}" from Aliyun OSS: ${err}`);
      throw err;
    }
  }
}
