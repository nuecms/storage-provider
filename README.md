# Storage Provider

[![NPM Version](https://img.shields.io/npm/v/@nuecms/storage-provider.svg)](https://www.npmjs.com/package/@nuecms/storage-provider)
[![License](https://img.shields.io/github/license/nuecms/storage-provider.svg)](https://github.com/nuecms/storage-provider/blob/main/LICENSE)


A simple and extensible library for managing file uploads and interactions with different cloud storage providers. Currently, it supports **S3**, **Aliyun OSS**, **QCloud COS**, and **Local Storage**.

## Features

- Upload files to multiple cloud storage providers.
- Download files from S3, Aliyun OSS, and QCloud COS.
- List files stored in cloud storage buckets.
- Generate pre-signed URLs for secure file access.
- Delete files from the cloud storage bucket.
- Support for `S3`, `Aliyun OSS`, `QCloud COS`, and `Local Storage` providers.

## Installation

To use this library in your project, you can install it via pnpm, npm or yarn.

### Using pnpm:

```bash
pnpm add @nuecms/storage-provider
```

### Using npm:

```bash
npm install @nuecms/storage-provider
```

### Using yarn:

```bash
yarn add @nuecms/storage-provider
```

## Configuration

Each storage provider requires configuration details such as access keys, region, and bucket name. Here is an example of setting up the S3 provider:

```typescript
import { S3Provider } from '@nuecms/storage-provider';

// Initialize S3 provider
const s3Provider = new S3Provider({
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-secret-access-key',
  region: 'your-region',
  bucket: 'your-bucket-name',
});
```

Make sure to replace the values with your actual AWS credentials and S3 bucket details.

## Supported Providers

### 1. **S3Provider (AWS S3)**

You can use `S3Provider` to interact with AWS S3 storage.

#### Methods:

- **upload(file: Buffer, fileName: string, context?: object): Promise<any>**
  - Uploads a file to the S3 bucket.
  
- **download(fileName: string, context?: object): Promise<Buffer>**
  - Downloads a file from S3.
  
- **delete(fileName: string, context?: object): Promise<any>**
  - Deletes a file from the S3 bucket.
  
- **list(context?: object): Promise<string[]>**
  - Lists files in the S3 bucket.
  
- **getUrl(fileName: string, context?: { expiresIn?: number }): Promise<string>**
  - Generates a pre-signed URL for accessing a file.

### 2. **AliyunOSSProvider (Aliyun Object Storage Service)**

This provider interacts with the Aliyun OSS.

#### Methods:
- Similar to the `S3Provider`, it supports the methods: `upload`, `download`, `delete`, `list`, and `getUrl`.

### 3. **QCloudCOSProvider (Tencent Cloud Object Storage)**

This provider interacts with QCloud COS.

#### Methods:
- Similar to the `S3Provider`, it supports the methods: `upload`, `download`, `delete`, `list`, and `getUrl`.

### 4. **LocalStorageProvider**

For local storage (non-cloud) use cases.

#### Methods:
- Similar to the cloud providers but interacts with the local file system.

## Usage Example

```typescript
import { S3Provider, LocalStorageProvider } from '@nuecms/storage-provider';

const s3Provider = new S3Provider({
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-secret-access-key',
  region: 'your-region',
  bucket: 'your-bucket-name',
});

const localStorageProvider = new LocalStorageProvider({
  directoryPath: '/path/to/store/files',
});

// Uploading a file to S3
const file = Buffer.from('Hello, S3!');
await s3Provider.upload(file, 'hello.txt');

// Uploading a file to Local Storage
await localStorageProvider.upload(file, 'local_hello.txt');

// Listing files in S3
const s3Files = await s3Provider.list();

// Downloading a file from S3
const downloadedFile = await s3Provider.download('hello.txt');
console.log(downloadedFile.toString()); // 'Hello, S3!'

// Generating a pre-signed URL for a file in S3
const url = await s3Provider.getUrl('hello.txt');
console.log(url);
```

## Running Tests

You can run the tests using Jest (or any other test framework you use). For example:

```bash
mv .env.example .env
# modify the .env file with your actual credentials
```

Then run the tests:

```bash
pnpm test
```

Ensure that you have your environment variables (`AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_REGION`, `AWS_S3_BUCKET`, etc.) set up correctly for testing.

## Environment Variables

You must configure the following environment variables in your `.env` file for the testing cloud storage providers:


```bash
mv .env.example .env
```

Replace the values with your actual credentials and bucket details.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork this repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature name'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

Please ensure that your code passes the existing tests and linting rules. If you add new features, write tests for them.


## License

MIT License. See the [LICENSE](LICENSE) file for more details.



