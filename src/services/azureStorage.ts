import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { config } from '../config';

/**
 * Azure Blob Storage service for media uploads
 */
class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      config.azureStorage.accountName,
      config.azureStorage.accountKey
    );

    this.blobServiceClient = new BlobServiceClient(
      `https://${config.azureStorage.accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );

    this.containerName = config.azureStorage.containerName;
  }

  /**
   * Upload file to Azure Blob Storage
   * @param buffer - File buffer
   * @param filename - Unique filename
   * @param mimetype - File MIME type
   * @returns Public URL of uploaded blob
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimetype: string
  ): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      
      // Ensure container exists
      await containerClient.createIfNotExists({
        access: 'blob', // Public read access for blobs
      });

      const blockBlobClient = containerClient.getBlockBlobClient(filename);

      // Upload with content type
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: mimetype,
        },
      });

      // Return public URL
      return blockBlobClient.url;
    } catch (error) {
      console.error('Azure Blob Storage upload failed:', error);
      throw new Error(`Failed to upload file to Azure Blob Storage: ${error}`);
    }
  }

  /**
   * Delete file from Azure Blob Storage
   * @param filename - Filename to delete
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.error('Azure Blob Storage delete failed:', error);
      throw new Error(`Failed to delete file from Azure Blob Storage: ${error}`);
    }
  }
}

export const azureStorageService = new AzureStorageService();
