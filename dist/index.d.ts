import { S as StorageProvider } from './StorageProvider-DIIhzZeN.js';

declare class LocalStorageProvider implements StorageProvider {
    private baseDirectory;
    constructor(config?: {
        baseDirectory?: string;
        rootBase?: string;
    });
    /**
     * Ensures the base directory exists.
     */
    private ensureBaseDirectory;
    /**
     * Uploads a file to the local storage.
     * @param file - The file buffer to upload.
     * @param fileName - The name to assign to the uploaded file.
     * @param context - Additional context or metadata.
     * @returns The file path of the uploaded file.
     */
    upload(file: Buffer, fileName: string, context: object): Promise<string>;
    /**
     * Downloads a file from the local storage.
     * @param fileName - The name of the file to download.
     * @param context - Additional context or metadata.
     * @returns The file content as a Buffer.
     */
    download(fileName: string, context: object): Promise<Buffer>;
    /**
     * Deletes a file from the local storage.
     * @param fileName - The name of the file to delete.
     * @param context - Additional context or metadata.
     */
    delete(fileName: string, context: object): Promise<void>;
    /**
     * Lists all files in the local storage.
     * @param context - Additional context or metadata.
     * @returns An array of file names.
     */
    list(context: object): Promise<string[]>;
    /**
     * Gets the file URL or identifier in the local storage.
     * @param fileName - The name of the file.
     * @param context - Additional context or metadata.
     * @returns The `file://` URL of the file.
     */
    getUrl(fileName: string, context: object): Promise<string>;
}

declare class AliyunOSSProvider implements StorageProvider {
    private client;
    constructor(config: {
        region: string;
        accessKeyId: string;
        accessKeySecret: string;
        bucket: string;
    });
    /**
     * Uploads a file to Aliyun OSS.
     * @param file - The file to upload as a Buffer.
     * @param fileName - The name to assign to the uploaded file.
     * @param context - Additional metadata for the upload.
     * @returns The URL of the uploaded file.
     */
    upload(file: Buffer, fileName: string, context: object): Promise<string>;
    /**
     * Downloads a file from Aliyun OSS.
     * @param fileName - The name of the file to download.
     * @param context - Additional metadata for the download.
     * @returns The file content as a Buffer.
     */
    download(fileName: string, context: object): Promise<Buffer>;
    /**
     * Deletes a file from Aliyun OSS.
     * @param fileName - The name of the file to delete.
     * @param context - Additional metadata for the delete operation.
     */
    delete(fileName: string, context: object): Promise<void>;
    /**
     * Lists all files in the Aliyun OSS bucket.
     * @param context - Additional metadata for the list operation.
     * @returns An array of file names.
     */
    list(context: object): Promise<string[]>;
    /**
     * Gets the URL of a file stored in Aliyun OSS.
     * @param fileName - The name of the file.
     * @param context - Additional metadata for the operation.
     * @returns The URL of the file.
     */
    getUrl(fileName: string, context: object): Promise<string>;
}

declare class QCloudCOSProvider implements StorageProvider {
    private client;
    private bucket;
    private region;
    constructor(options: {
        secretId: string;
        secretKey: string;
        bucket: string;
        region: string;
    });
    upload(file: Buffer, fileName: string, context?: object): Promise<string>;
    download(fileName: string, context?: object): Promise<Buffer>;
    delete(fileName: string, context?: object): Promise<void>;
    list(context?: object): Promise<string[]>;
    getUrl(fileName: string, context?: object): Promise<string>;
}

declare class S3Provider implements StorageProvider {
    private client;
    private bucket;
    constructor(config: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        bucket: string;
    });
    /**
     * Uploads a file to the S3 bucket.
     * @param file - The file data as a Buffer.
     * @param fileName - The name of the file to be uploaded.
     * @param context - Additional context or metadata related to the upload.
     * @returns A Promise that resolves to the data returned by the S3 service.
     */
    upload(file: Buffer, fileName: string, context?: object): Promise<any>;
    /**
     * Downloads a file from S3.
     * @param fileName - The name of the file to download.
     * @param context - Additional metadata.
     * @returns The file content as a Buffer.
     */
    download(fileName: string, context?: object): Promise<Buffer>;
    /**
     * Deletes a file from the S3 bucket.
     * @param fileName - The name of the file to delete.
     * @param context - Additional context or metadata related to the deletion.
     * @returns A Promise that resolves to the data returned by the S3 service after the delete operation.
     */
    delete(fileName: string, context?: object): Promise<any>;
    /**
     * Lists all files in the S3 bucket.
     * @param context - Additional context or metadata related to the list operation.
     * @returns A Promise that resolves to an array of file names in the bucket.
     */
    list(context?: object): Promise<string[]>;
    /**
     * Generates a pre-signed URL for accessing a file in the S3 bucket.
     * @param fileName - The name of the file for which to generate the URL.
     * @param context - Additional context or metadata related to the URL generation. Can include an expiration time (`expiresIn`).
     * @returns A Promise that resolves to the pre-signed URL.
     */
    getUrl(fileName: string, context?: {
        expiresIn?: number;
    }): Promise<string>;
}

export { AliyunOSSProvider, LocalStorageProvider, QCloudCOSProvider, S3Provider, StorageProvider };
