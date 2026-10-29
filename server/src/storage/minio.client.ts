// Server: MinIO/S3-compatible storage service

import { Client as MinioClient } from 'minio';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

const endpoint = new URL(config.S3_ENDPOINT);

const minio = new MinioClient({
  endPoint: endpoint.hostname,
  port: parseInt(endpoint.port || '9000'),
  useSSL: config.S3_ENDPOINT.startsWith('https'),
  accessKey: config.S3_ACCESS_KEY,
  secretKey: config.S3_SECRET_KEY,
});

export const storageService = {
  /**
   * Ensure the configured bucket exists, creating it if needed.
   */
  async createBucketIfNotExists() {
    try {
      const exists = await minio.bucketExists(config.S3_BUCKET);
      if (!exists) {
        await minio.makeBucket(config.S3_BUCKET, config.S3_REGION);
        logger.info(`Bucket "${config.S3_BUCKET}" created.`);
      } else {
        logger.debug(`Bucket "${config.S3_BUCKET}" already exists.`);
      }
    } catch (err) {
      logger.error({ err }, 'Failed to initialize storage bucket');
      throw err;
    }
  },

  /**
   * Upload a file buffer to storage.
   */
  async uploadFile(buffer: Buffer, key: string, mimetype: string) {
    await minio.putObject(config.S3_BUCKET, key, buffer, buffer.length, {
      'Content-Type': mimetype,
    });
    logger.debug({ key }, 'File uploaded to storage');
  },

  /**
   * Download a file from storage as a readable stream.
   */
  async getFile(key: string) {
    const stream = await minio.getObject(config.S3_BUCKET, key);
    return stream;
  },

  /**
   * Delete a file from storage.
   */
  async deleteFile(key: string) {
    await minio.removeObject(config.S3_BUCKET, key);
    logger.debug({ key }, 'File deleted from storage');
  },
};
