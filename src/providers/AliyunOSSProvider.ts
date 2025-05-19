import OSS from 'ali-oss'
import { type StorageProvider } from '../types/StorageProvider'

export interface AliyunOssOptions {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  endpoint?: string
  internal?: boolean
  secure?: boolean
  cname?: boolean
  timeout?: number
  prefix?: string
  cdnDomain?: string
}

/**
 * Aliyun OSS (Object Storage Service) provider
 */
export class AliyunOSSProvider implements StorageProvider {
  private client: OSS
  private options: AliyunOssOptions
  name: string

  constructor(options: AliyunOssOptions) {
    this.name = 'aliyun-oss'
    this.options = options
    this.client = new OSS({
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      bucket: options.bucket,
      region: options.region,
      endpoint: options.endpoint,
      internal: options.internal,
      secure: options.secure !== false,
      timeout: options.timeout || 60000,
      cname: options.cname
    })
  }

  /**
   * Get the object key (path in OSS)
   */
  private getObjectKey(fileName: string, context: any = {}): string {
    const { directory = '' } = context
    const prefix = this.options.prefix || ''
    if (directory) {
      return `${prefix}${prefix ? '/' : ''}${directory}/${fileName}`
    }
    return `${prefix}${prefix ? '/' : ''}${fileName}`
  }

  /**
   * Get the public URL for an object
   */
  private getObjectUrl(objectKey: string): string {
    if (this.options.cdnDomain) {
      return `${this.options.cdnDomain}/${objectKey}`
    }

    const protocol = this.options.secure !== false ? 'https' : 'http'
    const endpoint = this.options.endpoint || `${this.options.region}.aliyuncs.com`
    return `${protocol}://${this.options.bucket}.${endpoint}/${objectKey}`
  }

  /**
   * Upload a file to Aliyun OSS
   */
  async upload(file: Buffer, fileName: string, context: any = {}): Promise<any> {
    try {
      const objectKey = this.getObjectKey(fileName, context)
      const result = await this.client.put(objectKey, file)

      return {
        url: this.getObjectUrl(objectKey),
        path: objectKey,
        etag: (result.res.headers as Record<string, string>).etag,
        provider: 'aliyun-oss'
      }
    } catch (error) {
      console.error('Aliyun OSS upload error:', error)
      throw error
    }
  }

  /**
   * Download a file from Aliyun OSS
   */
  async download(fileName: string, context: any = {}): Promise<Buffer> {
    try {
      const objectKey = this.getObjectKey(fileName, context)
      const result = await this.client.get(objectKey)
      return Buffer.from(result.content)
    } catch (error) {
      console.error('Aliyun OSS download error:', error)
      throw error
    }
  }

  /**
   * Delete a file from Aliyun OSS
   */
  async delete(fileName: string, context: any = {}): Promise<any> {
    try {
      const objectKey = this.getObjectKey(fileName, context)
      await this.client.delete(objectKey)
      return { success: true }
    } catch (error) {
      console.error('Aliyun OSS delete error:', error)
      throw error
    }
  }

  /**
   * List files in Aliyun OSS
   */
  async list(context: any = {}): Promise<string[]> {
    try {
      const { directory = '' } = context
      const prefix = directory ? this.getObjectKey('', { directory }) : this.options.prefix || ''

      const result = await this.client.list({
        prefix,
        delimiter: '/',
        'max-keys': 1000
      }, {})

      return result.objects.map((obj) => obj.name.replace(prefix, ''))
    } catch (error) {
      console.error('Aliyun OSS list error:', error)
      throw error
    }
  }

  /**
   * Get URL for a file in Aliyun OSS
   */
  async getUrl(fileName: string, context: any = {}): Promise<string> {
    const objectKey = this.getObjectKey(fileName, context)
    return this.getObjectUrl(objectKey)
  }

  /**
   * Get a signed URL that expires after a specific time
   */
  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
    try {
      const objectKey = this.getObjectKey(fileName)
      const url = this.client.signatureUrl(objectKey, { expires: expiresIn })
      return url
    } catch (error) {
      console.error('Aliyun OSS get signed URL error:', error)
      throw error
    }
  }

  /**
   * Test connection to Aliyun OSS
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // List objects to test connection
      await this.client.list({
        'max-keys': 1
      }, {})
      return { success: true, message: 'Connection successful' }
    } catch (error: any) {
      console.error('Aliyun OSS test connection error:', error)
      return {
        success: false,
        message: `Connection failed: ${error.message || 'Unknown error'}`
      }
    }
  }
}
