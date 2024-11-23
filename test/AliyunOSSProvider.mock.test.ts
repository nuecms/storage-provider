import { AliyunOSSProvider } from '../src/providers/AliyunOSSProvider';
import * as dotenv from 'dotenv';
import { vi } from 'vitest';

dotenv.config();

vi.mock('ali-oss', () => {
  return {
    default: class MockOSS {
      private storage: Map<string, Buffer> = new Map();

      put(fileName: string, fileContent: Buffer) {
        this.storage.set(fileName, fileContent);
        return Promise.resolve({ url: `https://mock-bucket.oss-region.aliyuncs.com/${fileName}` });
      }

      get(fileName: string) {
        if (!this.storage.has(fileName)) {
          const error = new Error('NoSuchKey');
          Object.assign(error, { name: 'NoSuchKey' });
          throw error;
        }
        return Promise.resolve({ content: this.storage.get(fileName) });
      }

      delete(fileName: string) {
        this.storage.delete(fileName);
        return Promise.resolve();
      }

      listV2() {
        const fileNames = Array.from(this.storage.keys());
        return Promise.resolve({ objects: fileNames.map(name => ({ name })) });
      }

      signatureUrl(fileName: string) {
        return `https://mock-bucket.oss-region.aliyuncs.com/${fileName}`;
      }
    },
  };
});

describe('AliyunOSSProvider with mock', () => {
  let provider: AliyunOSSProvider;

  beforeAll(() => {
    provider = new AliyunOSSProvider({
      bucket: 'mock-bucket',
      region: 'oss-region',
      accessKeyId: 'mock-access-key',
      accessKeySecret: 'mock-secret-key',
    });
  });

  test('should upload a file', async () => {
    const fileName = 'test-upload.txt';
    const fileContent = Buffer.from('Mock upload content');
    const url = await provider.upload(fileContent, fileName, {});
    expect(url).toContain(fileName);
  });

  test('should download a file', async () => {
    const fileName = 'test-download.txt';
    const fileContent = Buffer.from('Mock download content');
    await provider.upload(fileContent, fileName, {});
    const downloadedContent = await provider.download(fileName, {});
    expect(downloadedContent.toString()).toBe(fileContent.toString());
  });

  test('should delete a file', async () => {
    const fileName = 'test-delete.txt';
    await provider.upload(Buffer.from('Content to delete'), fileName, {});
    await provider.delete(fileName, {});
    await expect(provider.download(fileName, {})).rejects.toThrow();
  });

  test('should list files', async () => {
    const fileName1 = 'mock-list-1.txt';
    const fileName2 = 'mock-list-2.txt';
    await provider.upload(Buffer.from('File 1'), fileName1, {});
    await provider.upload(Buffer.from('File 2'), fileName2, {});
    const files = await provider.list({});
    expect(files).toContain(fileName1);
    expect(files).toContain(fileName2);
  });

  test('should get file URL', async () => {
    const fileName = 'test-url.txt';
    await provider.upload(Buffer.from('URL test content'), fileName, {});
    const url = await provider.getUrl(fileName, {});
    expect(url).toContain(fileName);
  });
});
