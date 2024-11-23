import COS from 'cos-nodejs-sdk-v5';
import { StorageProvider } from '../types/StorageProvider';

export class QCloudCOSProvider implements StorageProvider {
  private client: COS;
  private bucket: string;
  private region: string;

  constructor(options: { secretId: string; secretKey: string; bucket: string; region: string }) {
    const { secretId, secretKey, bucket, region } = options;
    this.client = new COS({
      SecretId: secretId,
      SecretKey: secretKey,
    });
    this.bucket = bucket;
    this.region = region;
  }

  async upload(file: Buffer, fileName: string, context: object = {}): Promise<string> {
    try {
      const result = await this.client.putObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: fileName,
        Body: file,
      });
      if (result.statusCode === 200) {
        // Return the URL of the uploaded file
        return `https://${this.bucket}.cos.${this.region}.myqcloud.com/${fileName}`;
      }
      throw new Error('Failed to upload file to QCloud COS');
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async download(fileName: string, context: object = {}): Promise<Buffer> {
    try {
      const result = await this.client.getObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: fileName,
      });
      return result.Body as Buffer; // Return the file data as a Buffer
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  async delete(fileName: string, context: object = {}): Promise<void> {
    try {
      await this.client.deleteObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: fileName,
      });
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }

  async list(context: object = {}): Promise<string[]> {
    try {
      const result = await this.client.getBucket({
        Bucket: this.bucket,
        Region: this.region,
      });
      if (result.Contents) {
        return result.Contents.map(item => item.Key); // Return the list of file keys
      }
      return [];
    } catch (error) {
      console.error('List failed:', error);
      throw error;
    }
  }

  async getUrl(fileName: string, context: object = {}): Promise<string> {
    try {
      // Generate a signed URL for accessing the file
      const url = await new Promise<string>((resolve, reject) => {
        this.client.getObjectUrl({
          Bucket: this.bucket,
          Region: this.region,
          Key: fileName,
          // Sign: true, // Generate signed URL
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.Url);
          }
        });
      });
      return url;
    } catch (error) {
      console.error('Get URL failed:', error);
      throw error;
    }
  }
}
