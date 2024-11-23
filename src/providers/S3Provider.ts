import { StorageProvider } from '../types/StorageProvider';
import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Provider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  }) {
    if (!config || !config.region || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        throw new Error('S3Provider: Missing required configuration');
      }
    this.bucket = config.bucket;
    const s3Config: S3ClientConfig = {
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      region: config.region,
    };
    this.client = new S3Client({ ...s3Config });
  }

  /**
   * Uploads a file to the S3 bucket.
   * @param file - The file data as a Buffer.
   * @param fileName - The name of the file to be uploaded.
   * @param context - Additional context or metadata related to the upload.
   * @returns A Promise that resolves to the data returned by the S3 service.
   */
  async upload(file: Buffer, fileName: string, context: object = {}): Promise<any> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: file,
        ...context
      });
      const data = await this.client.send(command);
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  /**
   * Downloads a file from S3.
   * @param fileName - The name of the file to download.
   * @param context - Additional metadata.
   * @returns The file content as a Buffer.
   */
  async download(fileName: string, context: object = {}): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        ...context
      });

      const response = await this.client.send(command);
      if (!response.Body || !(response.Body instanceof Readable)) {
        throw new Error('Invalid response body');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (err) {
      console.error(`Failed to download file "${fileName}" from S3:`, err);
      throw err;
    }
  }

  /**
   * Deletes a file from the S3 bucket.
   * @param fileName - The name of the file to delete.
   * @param context - Additional context or metadata related to the deletion.
   * @returns A Promise that resolves to the data returned by the S3 service after the delete operation.
   */
  async delete(fileName: string, context: object = {}): Promise<any> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        ...context
      });
      const data = await this.client.send(command);
      // console.log(data, "delete result");
      return data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  /**
   * Lists all files in the S3 bucket.
   * @param context - Additional context or metadata related to the list operation.
   * @returns A Promise that resolves to an array of file names in the bucket.
   */
  async list(context: object = {}): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        ...context
      });
      const data = await this.client.send(command);
      return data.Contents?.map(object => object.Key as string) || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  /**
   * Generates a pre-signed URL for accessing a file in the S3 bucket.
   * @param fileName - The name of the file for which to generate the URL.
   * @param context - Additional context or metadata related to the URL generation. Can include an expiration time (`expiresIn`).
   * @returns A Promise that resolves to the pre-signed URL.
   */
  async getUrl(fileName: string, context: { expiresIn?: number } = {}): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        ...context,
      });
      const expiresIn = context.expiresIn || 60 * 5; // Default to 5 minutes

      // Generate a pre-signed URL with the specified expiration time
      const url = await getSignedUrl(this.client, command, { expiresIn });
      console.log(url, "get url only");
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  }
}
