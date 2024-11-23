import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { LocalStorageProvider } from '../src/providers/LocalStorageProvider';

// Load environment variables from .env file
dotenv.config();


describe('LocalStorageProvider', () => {
  const config = {
    baseDirectory: process.env.LOCAL_STORAGE_DIR || './test-storage', // Default to a test folder
  };

  const TEST_STORAGE_PATH = config.baseDirectory;

  let provider: LocalStorageProvider;

  beforeEach(async () => {
    provider = new LocalStorageProvider(config);
    // Ensure the storage directory is clean before each test
    await fs.mkdir(TEST_STORAGE_PATH, { recursive: true });
  });

  afterEach(async () => {
    // Clean up the storage directory after each test
    await fs.rm(TEST_STORAGE_PATH, { recursive: true, force: true });
  });

  it('should upload a file successfully', async () => {
    const fileContent = Buffer.from('Hello, Local Storage!');
    const fileName = 'hello.txt';
    const result = await provider.upload(fileContent, fileName, {});

    expect(result).toBe(path.join(TEST_STORAGE_PATH, fileName));
    const storedContent = await fs.readFile(result, 'utf-8');
    expect(storedContent).toBe('Hello, Local Storage!');
  });

  it('should download a file successfully', async () => {
    const fileContent = 'File to download';
    const fileName = 'download.txt';
    await fs.writeFile(path.join(TEST_STORAGE_PATH, fileName), fileContent);

    const downloadedFile = await provider.download(fileName, {});
    expect(downloadedFile.toString()).toBe(fileContent);
  });

  it('should delete a file successfully', async () => {
    const fileName = 'delete.txt';
    const filePath = path.join(TEST_STORAGE_PATH, fileName);
    await fs.writeFile(filePath, 'To be deleted');

    await provider.delete(fileName, {});
    await expect(fs.access(filePath)).rejects.toThrow();
  });

  it('should list all files in the storage', async () => {
    const files = ['file1.txt', 'file2.txt', 'file3.txt'];
    for (const file of files) {
      await fs.writeFile(path.join(TEST_STORAGE_PATH, file), 'Dummy content');
    }

    const listedFiles = await provider.list({});
    expect(listedFiles.sort()).toEqual(files.sort());
  });

  it('should get the full path (URL) of a file', async () => {
    const fileName = 'url.txt';
    await fs.writeFile(path.join(TEST_STORAGE_PATH, fileName), 'URL content');

    const url = await provider.getUrl(fileName, {});
    expect(url).toBe(path.join(TEST_STORAGE_PATH, fileName));
  });
});
