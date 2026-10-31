// Server: Local filesystem storage service
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_ROOT = path.resolve(__dirname, '../../../uploads');

export const storageService = {
  async createBucketIfNotExists() {
    try {
      await fs.promises.mkdir(UPLOAD_ROOT, { recursive: true });
      logger.info(`Local storage directory ready: ${UPLOAD_ROOT}`);
    } catch (err) {
      logger.error('Failed to initialize local storage directory', err);
      throw err;
    }
  },

  async uploadFile(buffer, key, _mimetype) {
    const filePath = path.join(UPLOAD_ROOT, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
  },

  async getFile(key) {
    const filePath = path.join(UPLOAD_ROOT, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in storage: ${key}`);
    }
    return fs.createReadStream(filePath);
  },

  async deleteFile(key) {
    const filePath = path.join(UPLOAD_ROOT, key);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      logger.warn(`Could not delete file from storage: ${key}`);
    }
  },
};
