import { S3Provider } from '../src/providers/S3Provider';
import * as dotenv from 'dotenv';

dotenv.config();

const TEST_FILE_NAME = 'test-file.txt';
const TEST_FILE_CONTENT = Buffer.from('Hello, S3!');
const INVALID_FILE_NAME = 'nonexistent-file.txt';

describe('S3Provider', () => {
  let provider: S3Provider;

  beforeAll(() => {
    provider = new S3Provider({
      region: process.env.AWS_S3_REGION!,
      bucket: process.env.AWS_S3_BUCKET!,
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
    });
  });

  afterAll(async () => {
    // Cleanup: Delete the test file if it exists
    try {
      await provider.delete(TEST_FILE_NAME);
    } catch {
      // Ignore errors if the file does not exist
    }
  });

  test('should upload a file to S3 and return metadata', async () => {
    const result = await provider.upload(TEST_FILE_CONTENT, TEST_FILE_NAME);
    expect(result).toHaveProperty('ETag');
    expect(result).toHaveProperty('$metadata.httpStatusCode', 200);
  });

  test('should generate a pre-signed URL for the file', async () => {
    const url = await provider.getUrl(TEST_FILE_NAME, { expiresIn: 600 });
    expect(url).toContain(process.env.AWS_S3_BUCKET!);
    expect(url).toContain(TEST_FILE_NAME);
    expect(url).toContain('X-Amz-Signature');
  });

  test('should download the uploaded file from S3', async () => {
    const content = await provider.download(TEST_FILE_NAME);
    expect(content.toString()).toBe(TEST_FILE_CONTENT.toString());
  });

  test('should list files in the S3 bucket', async () => {
    const files = await provider.list();
    expect(files).toContain(TEST_FILE_NAME);
  });

  test('should delete the file from S3', async () => {
    const deleteResult = await provider.delete(TEST_FILE_NAME);
    expect(deleteResult).toHaveProperty('$metadata.httpStatusCode', 204);

    const files = await provider.list();
    expect(files).not.toContain(TEST_FILE_NAME);
  });


  test('should handle deletion of a non-existent file gracefully', async () => {
    const result = await provider.delete(INVALID_FILE_NAME);
    expect(result).toHaveProperty('$metadata.httpStatusCode', 204);
  });
});
