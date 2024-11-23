import { QCloudCOSProvider } from '../src/providers/QCloudCOSProvider';
import * as dotenv from 'dotenv';

dotenv.config();

const TEST_FILE_NAME = 'test-file.txt';
const TEST_FILE_CONTENT = Buffer.from('This is a test file for QCloudCOSProvider.');
const TEST_FILE_NAME_2 = 'test-file-2.txt';

describe('QCloudCOSProvider (Integration)', () => {
  let provider: QCloudCOSProvider;

  beforeAll(() => {
    provider = new QCloudCOSProvider({
      bucket: process.env.QCLOUD_COS_BUCKET || '',
      region: process.env.QCLOUD_COS_REGION || '',
      secretId: process.env.QCLOUD_COS_SECRET_ID || '',
      secretKey: process.env.QCLOUD_COS_SECRET_KEY || '',
    });

    if (!process.env.QCLOUD_COS_BUCKET || !process.env.QCLOUD_COS_REGION) {
      throw new Error('Missing required environment variables for QCloudCOSProvider tests.');
    }
  });

  afterAll(async () => {
    try {
      await provider.delete(TEST_FILE_NAME, {});
      await provider.delete(TEST_FILE_NAME_2, {});
    } catch (err) {
      console.warn('Error cleaning up test files:', err);
    }
  });

  test('should upload a file', async () => {
    const url = await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME, {});
    expect(url).toContain(TEST_FILE_NAME);
  });

  test('should download a file', async () => {
    const url = await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME, {});
    expect(url).toContain(TEST_FILE_NAME);

    const downloadedContent = await provider.download(TEST_FILE_NAME, {});
    expect(downloadedContent.toString()).toBe(TEST_FILE_CONTENT.toString());
  });

  test('should delete a file', async () => {
    const url = await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME_2, {});
    expect(url).toContain(TEST_FILE_NAME_2);

    await provider.delete(TEST_FILE_NAME_2, {});
    await expect(provider.download(TEST_FILE_NAME_2, {})).rejects.toThrow();
  });

  test('should list files', async () => {
    await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME, {});
    const files = await provider.list({});
    expect(files).toContain(TEST_FILE_NAME);
  });

  test('should get file URL', async () => {
    await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME, {});
    const url = await provider.getUrl(TEST_FILE_NAME, {});
    expect(url).toContain(TEST_FILE_NAME);
  });
});
