// Server: Local filesystem storage service (Node.js native — no external MinIO/S3 needed)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_ROOT = path.resolve(__dirname, '../../../uploads');

export const storageService = {
  /**
   * Ensure local uploads directory exists.
   */
  async createBucketIfNotExists(): Promise<void> {
    try {
      await fs.promises.mkdir(UPLOAD_ROOT, { recursive: true });
      logger.info(`Local storage directory ready: ${UPLOAD_ROOT}`);
    } catch (err) {
      logger.error({ err }, 'Failed to initialize local storage directory');
      throw err;
    }
  },

  /**
   * Upload a file buffer to local filesystem storage.
   */
  async uploadFile(buffer: Buffer, key: string, mimetype: string): Promise<void> {
    const filePath = path.join(UPLOAD_ROOT, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    logger.debug({ key, filePath }, 'File saved to local storage');
  },

  /**
   * Download a file from local filesystem storage as a readable stream.
   */
  async getFile(key: string): Promise<Readable> {
    const filePath = path.join(UPLOAD_ROOT, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in storage: ${key}`);
    }
    return fs.createReadStream(filePath);
  },

  /**
   * Delete a file from local filesystem storage.
   */
  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(UPLOAD_ROOT, key);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.debug({ key }, 'File deleted from local storage');
      }
    } catch (err) {
      logger.warn({ err, key }, 'Could not delete file from local storage');
    }
  },
};
