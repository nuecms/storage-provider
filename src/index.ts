import { StorageDriver } from './Driver'
import type { StorageProvider } from './types/StorageProvider'
import { LocalStorageProvider } from './providers/LocalStorageProvider'
import { AliyunOSSProvider } from './providers/AliyunOSSProvider'
import { QCloudCOSProvider } from './providers/QCloudCOSProvider'
import { S3Provider } from './providers/S3Provider'

// Export individual classes and interfaces
export { StorageDriver, LocalStorageProvider, AliyunOSSProvider, QCloudCOSProvider, S3Provider }
export type { StorageProvider }

// Export a create function to initialize a storage driver
export function createStorageDriver(
  options: {
    defaultProvider?: string
    providers?: {
      [name: string]: StorageProvider
    }
  } = {}
): StorageDriver {
  const driver = new StorageDriver()

  // Register providers if provided
  if (options.providers) {
    for (const [name, provider] of Object.entries(options.providers)) {
      driver.registerProvider(name, provider)
    }
  }

  // Set default provider if specified
  if (options.defaultProvider && options.providers?.[options.defaultProvider]) {
    driver.setDefaultProvider(options.defaultProvider)
  }

  return driver
}

// Export provider factory functions
export function createLocalStorageProvider(options: any): LocalStorageProvider {
  return new LocalStorageProvider(options)
}

export function createAliyunOSSProvider(options: any): AliyunOSSProvider {
  return new AliyunOSSProvider(options)
}

export function createQCloudCOSProvider(options: any): QCloudCOSProvider {
  return new QCloudCOSProvider(options)
}

export function createS3Provider(options: any): S3Provider {
  return new S3Provider(options)
}
