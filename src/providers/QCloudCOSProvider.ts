import COS from 'cos-nodejs-sdk-v5'
import { type StorageProvider } from '../types/StorageProvider'

export interface QCloudCOSOptions {
  SecretId: string
  SecretKey: string
  Bucket: string
  Region: string
  Domain?: string
  Prefix?: string
}

/**
 * Tencent Cloud COS (Cloud Object Storage) provider
 */
export class QCloudCOSProvider implements StorageProvider {
  private client: COS
  private options: QCloudCOSOptions
  name: string

  constructor(options: QCloudCOSOptions) {
    this.name = 'tencent-cos'
    this.options = options
    this.client = new COS({
      SecretId: options.SecretId,
      SecretKey: options.SecretKey
    })
  }

  /**
   * Get the object key with prefix
   */
  private getObjectKey(fileName: string, context: any = {}): string {
    const { directory = '' } = context
    const prefix = this.options.Prefix || ''
    if (directory) {
      return `${prefix}${prefix ? '/' : ''}${directory}/${fileName}`
    }
    return `${prefix}${prefix ? '/' : ''}${fileName}`
  }

  /**
   * Get the public URL for an object
   */
  private getObjectUrl(objectKey: string): string {
    if (this.options.Domain) {
      return `${this.options.Domain}/${objectKey}`
    }

    return `https://${this.options.Bucket}.cos.${this.options.Region}.myqcloud.com/${objectKey}`
  }

  /**
   * Upload a file to Tencent Cloud COS
   */
  async upload(file: Buffer, fileName: string, context: any = {}): Promise<any> {
    try {
      const objectKey = this.getObjectKey(fileName, context)

      const result = await this.client.putObject({
        Bucket: this.options.Bucket,
        Region: this.options.Region,
        Key: objectKey,
        Body: file
      })

      if (result.statusCode === 200) {
        return {
          url: this.getObjectUrl(objectKey),
          path: objectKey,
          etag: result.ETag,
          provider: 'tencent-cos'
        }
      }

      throw new Error('Failed to upload file to QCloud COS')
    } catch (error) {
      console.error('Tencent COS upload error:', error)
      throw error
    }
  }

  /**
   * Download a file from Tencent Cloud COS
   */
  async download(fileName: string, context: any = {}): Promise<Buffer> {
    try {
      const objectKey = this.getObjectKey(fileName, context)

      const result = await this.client.getObject({
        Bucket: this.options.Bucket,
        Region: this.options.Region,
        Key: objectKey
      })

      return result.Body as Buffer
    } catch (error) {
      console.error('Tencent COS download error:', error)
      throw error
    }
  }

  /**
   * Delete a file from Tencent Cloud COS
   */
  async delete(fileName: string, context: any = {}): Promise<any> {
    try {
      const objectKey = this.getObjectKey(fileName, context)

      const result = await this.client.deleteObject({
        Bucket: this.options.Bucket,
        Region: this.options.Region,
        Key: objectKey
      })

      return {
        success: result.statusCode === 204 || result.statusCode === 200,
        statusCode: result.statusCode
      }
    } catch (error) {
      console.error('Tencent COS delete error:', error)
      throw error
    }
  }

  /**
   * List files in Tencent Cloud COS
   */
  async list(context: any = {}): Promise<string[]> {
    try {
      const { directory = '' } = context
      const prefix = directory ? this.getObjectKey('', { directory }) : this.options.Prefix || ''

      const result = await this.client.getBucket({
        Bucket: this.options.Bucket,
        Region: this.options.Region,
        Prefix: prefix,
        Delimiter: '/'
      })

      if (result.Contents) {
        return result.Contents.map((item) => {
          // Remove prefix to get relative paths
          return item.Key.replace(prefix, '')
        })
      }

      return []
    } catch (error) {
      console.error('Tencent COS list error:', error)
      throw error
    }
  }

  /**
   * Get URL for a file in Tencent Cloud COS
   */
  async getUrl(fileName: string, context: any = {}): Promise<string> {
    try {
      const objectKey = this.getObjectKey(fileName, context)
      return this.getObjectUrl(objectKey)
    } catch (error) {
      console.error('Tencent COS get URL error:', error)
      throw error
    }
  }

  /**
   * Get a signed URL that expires after a specific time
   */
  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
    try {
      const objectKey = this.getObjectKey(fileName)

      const url = await new Promise<string>((resolve, reject) => {
        this.client.getObjectUrl(
          {
            Bucket: this.options.Bucket,
            Region: this.options.Region,
            Key: objectKey,
            Sign: true,
            Expires: expiresIn
          },
          (err, data) => {
            if (err) {
              reject(err)
            } else {
              resolve(data.Url)
            }
          }
        )
      })

      return url
    } catch (error) {
      console.error('Tencent COS get signed URL error:', error)
      throw error
    }
  }

  /**
   * Test connection to Tencent Cloud COS
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // List objects to test connection
      await this.client.getBucket({
        Bucket: this.options.Bucket,
        Region: this.options.Region,
        MaxKeys: 1
      })

      return { success: true, message: 'Connection successful' }
    } catch (error: any) {
      console.error('Tencent COS test connection error:', error)
      return {
        success: false,
        message: `Connection failed: ${error.message || 'Unknown error'}`
      }
    }
  }
}
