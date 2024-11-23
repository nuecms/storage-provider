import { AliyunOSSProvider } from '../src/providers/AliyunOSSProvider';
import * as dotenv from 'dotenv';

dotenv.config();

describe('AliyunOSSProvider', () => {
  let provider: AliyunOSSProvider;

  const TEST_FILE_NAME = 'aliyun-oss.txt';
  const TEST_FILE_CONTENT = Buffer.from('Hello, Aliyun OSS!');
  const TEST_BUCKET = process.env.ALIYUN_OSS_BUCKET || 'test-bucket';
  const TEST_REGION = process.env.ALIYUN_OSS_REGION || 'oss-region';
  const TEST_ACCESS_KEY = process.env.ALIYUN_OSS_ACCESS_KEY_ID || 'fake-access-key';
  const TEST_SECRET_KEY = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || 'fake-secret-key';

  beforeAll(() => {
    provider = new AliyunOSSProvider({
      bucket: TEST_BUCKET,
      region: TEST_REGION,
      accessKeyId: TEST_ACCESS_KEY,
      accessKeySecret: TEST_SECRET_KEY,
    });
  });

  test('should upload a file', async () => {
    const url = await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME, {});
    expect(url).toContain(TEST_FILE_NAME);
  });

  test('should download a file', async () => {
    await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME, {});
    const downloadedContent = await provider.download(TEST_FILE_NAME, {});
    expect(downloadedContent.toString()).toBe(TEST_FILE_CONTENT.toString());
  });

  test('should delete a file', async () => {
    await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME, {});
    await provider.delete(TEST_FILE_NAME, {});

    // Try downloading the file to ensure it was deleted
    await expect(provider.download(TEST_FILE_NAME, {})).rejects.toThrow();
  });

  test('should list files', async () => {
    const fileName1 = 'list-test-1.txt';
    const fileName2 = 'list-test-2.txt';

    await provider.upload(Buffer.from('Content 1'), fileName1, {});
    await provider.upload(Buffer.from('Content 2'), fileName2, {});

    const files = await provider.list({
      prefix: 'list-test-',
    });
    expect(files).toContain(fileName1);
    expect(files).toContain(fileName2);

    // Clean up
    await provider.delete(fileName1, {});
    await provider.delete(fileName2, {});
  });

  test('should get file URL', async () => {
    await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME, {});
    const url = await provider.getUrl(TEST_FILE_NAME, {});
    expect(url).toContain(TEST_FILE_NAME);
    expect(url).toContain(TEST_BUCKET);
  });
});
