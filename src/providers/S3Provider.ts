import { type StorageProvider } from '../types/StorageProvider'
import {
  S3Client,
  type S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import path from 'path'

export interface S3Options {
  name: string
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucket: string
  endpoint?: string
  prefix?: string
  cdnDomain?: string
  s3ForcePathStyle?: boolean
  // signatureVersion is not supported in AWS SDK v3
}

export class S3Provider implements StorageProvider {
  private client: S3Client
  private bucket: string
  private options: S3Options
  private prefix: string
  private cdnDomain?: string
  name: any

  constructor(options: S3Options) {
    if (!options || !options.region || !options.accessKeyId || !options.secretAccessKey || !options.bucket) {
      throw new Error('S3Provider: Missing required configuration')
    }
    this.name = options.name
    this.bucket = options.bucket
    this.options = options
    this.prefix = options.prefix || ''
    this.cdnDomain = options.cdnDomain

    const s3Config: S3ClientConfig = {
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      },
      region: options.region
    }

    if (options.endpoint) {
      s3Config.endpoint = options.endpoint
    }
    if (options.s3ForcePathStyle) {
      s3Config.forcePathStyle = true // Use path-style URLs
    }
    // signatureVersion is no longer directly supported in AWS SDK v3
    // If you need specific signature behavior, you may need to use other config options
    // or a custom credential provider instead
    this.client = new S3Client({ ...s3Config })
  }

  /**
   * Uploads a file to the S3 bucket.
   * @param file - The file data as a Buffer.
   * @param fileName - The name of the file to be uploaded.
   * @param context - Additional context or metadata related to the upload.
   * @returns A Promise that resolves to the data returned by the S3 service.
   */
  async upload(file: Buffer, fileName: string, context: { directory?: string; [key: string]: any } = {}): Promise<any> {
    try {
      const directory = context['directory'] || ''
      const filePath = directory
        ? path.posix.join(this.prefix, directory, fileName)
        : path.posix.join(this.prefix, fileName)
      const cleanFilePath = filePath.replace(/\/+/g, '/').replace(/^\//, '')

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: cleanFilePath,
        Body: file,
        ContentType: this.getContentType(fileName),
        ...context
      })
      const data = await this.client.send(command)

      let url = ''
      if (this.cdnDomain) {
        // Use CDN domain if provided
        url = `${this.cdnDomain.replace(/\/+$/, '')}/${cleanFilePath}`
      } else {
        // Fix for the URL generation issue
        // Instead of using client.config.endpoint which might return a function,
        // use the original endpoint or construct the S3 URL directly
        if (this.options.endpoint) {
          // Format and clean the endpoint URL
          const endpointUrl = this.options.endpoint.toString().replace(/\/+$/, '')
          url = `${endpointUrl}/${this.bucket}/${cleanFilePath}`

          // If we're using path style (s3ForcePathStyle), the bucket is already in the path
          if (this.options.s3ForcePathStyle) {
            url = `${endpointUrl}/${cleanFilePath}`
          }
        } else {
          // Standard AWS S3 URL format
          url = `https://${this.bucket}.s3.${this.options.region}.amazonaws.com/${cleanFilePath}`
        }
      }

      return {
        url,
        path: cleanFilePath
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error // Re-throw the error for the caller to handle
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
      })

      const response = await this.client.send(command)
      if (!response.Body || !(response.Body instanceof Readable)) {
        throw new Error('Invalid response body')
      }

      const chunks: Uint8Array[] = []
      for await (const chunk of response.Body) {
        chunks.push(chunk)
      }

      return Buffer.concat(chunks)
    } catch (err) {
      console.error(`Failed to download file "${fileName}" from S3:`, err)
      throw err
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
      })
      const data = await this.client.send(command)
      // console.log(data, "delete result");
      return data
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error // Re-throw the error for the caller to handle
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
      })
      const data = await this.client.send(command)
      return data.Contents?.map((object) => object.Key as string) || []
    } catch (error) {
      console.error('Error listing files:', error)
      throw error // Re-throw the error for the caller to handle
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
        ...context
      })
      const expiresIn = context.expiresIn || 60 * 5 // Default to 5 minutes

      // Generate a pre-signed URL with the specified expiration time
      const url = await getSignedUrl(this.client, command, { expiresIn })
      console.log(url, 'get url only')
      return url
    } catch (error) {
      console.error('Error generating signed URL:', error)
      throw error // Re-throw the error for the caller to handle
    }
  }

  /**
   * Test connection to S3
   * @returns Promise with connection test result
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Attempt to list objects with max 1 result to verify credentials and bucket access
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1 // Only request one item to minimize data transfer
      })

      // Execute the command to test the connection
      await this.client.send(command)

      return {
        success: true,
        message: 'S3 connection successful, credentials valid and bucket accessible'
      }
    } catch (error: any) {
      console.error('S3 connection test failed:', error)
      // Provide more meaningful error messages based on common AWS errors
      let errorMessage = 'Connection failed: '

      if (error.name === 'NoSuchBucket') {
        errorMessage += `Bucket "${this.bucket}" does not exist`
      } else if (error.name === 'AccessDenied') {
        errorMessage += 'Access denied, please check your permissions'
      } else if (error.name === 'InvalidAccessKeyId') {
        errorMessage += 'Invalid Access Key ID'
      } else if (error.name === 'SignatureDoesNotMatch') {
        errorMessage += 'Invalid Secret Access Key'
      } else if (error.name === 'NetworkingError' || error.code === 'ENOTFOUND') {
        errorMessage += 'Network connection failed, please check region settings or network connection'
      } else {
        errorMessage += error.message || 'Unknown error'
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }

  private getContentType(fileName: string): string {
    // Simple content type mapping based on file extension
    const extension = path.extname(fileName).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm'
    }

    return contentTypeMap[extension] || 'application/octet-stream'
  }
}
