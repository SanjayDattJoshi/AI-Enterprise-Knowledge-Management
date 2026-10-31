// Server: Simple console logger

const isDevelopment = process.env.NODE_ENV !== 'production';
const ts = () => new Date().toISOString();

export const logger = {
  info: (obj, msg) => {
    if (typeof obj === 'string') console.log(`[${ts()}] INFO:`, obj);
    else console.log(`[${ts()}] INFO:`, msg || '', obj);
  },
  warn: (obj, msg) => {
    if (typeof obj === 'string') console.warn(`[${ts()}] WARN:`, obj);
    else console.warn(`[${ts()}] WARN:`, msg || '', obj);
  },
  error: (obj, msg) => {
    if (typeof obj === 'string') console.error(`[${ts()}] ERROR:`, obj);
    else console.error(`[${ts()}] ERROR:`, msg || '', obj);
  },
  debug: (obj, msg) => {
    if (!isDevelopment) return;
    if (typeof obj === 'string') console.debug(`[${ts()}] DEBUG:`, obj);
    else console.debug(`[${ts()}] DEBUG:`, msg || '', obj);
  },
};
