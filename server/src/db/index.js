// Server: PostgreSQL Database Client & Initialization
import pg from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

const { Pool } = pg;

let pool = null;
let isPostgresConnected = false;

// In-memory fallback state in case PostgreSQL is unavailable
const memoryStore = {
  organizations: [],
  users: [],
  refreshTokens: [],
  documents: [],
  documentChunks: [],
  conversations: [],
  messages: [],
  answerSources: [],
  searchQueries: [],
  feedback: [],
};

/**
 * Initialize PostgreSQL connection pool and verify connection
 */
export async function initDb() {
  try {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      logger.warn(`PostgreSQL background pool warning: ${err.message}`);
    });

    // Test connection with timeout
    const client = await pool.connect();
    isPostgresConnected = true;
    logger.info(' Connected to PostgreSQL database');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(32) DEFAULT 'EMPLOYEE',
        is_active BOOLEAN DEFAULT TRUE,
        organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(64) PRIMARY KEY,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        storage_key VARCHAR(500) UNIQUE NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        page_count INTEGER,
        metadata JSONB,
        status VARCHAR(32) DEFAULT 'UPLOADED',
        uploaded_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        indexed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS document_chunks (
        id VARCHAR(64) PRIMARY KEY,
        document_id VARCHAR(64) REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        section_title VARCHAR(255),
        page_number INTEGER,
        metadata JSONB,
        token_count INTEGER DEFAULT 0,
        embedding JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(32) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS answer_sources (
        id VARCHAR(64) PRIMARY KEY,
        message_id VARCHAR(64) REFERENCES messages(id) ON DELETE CASCADE,
        chunk_id VARCHAR(64) REFERENCES document_chunks(id) ON DELETE CASCADE,
        citation_label VARCHAR(32) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS search_queries (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
        conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE SET NULL,
        query_text TEXT NOT NULL,
        latency_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        message_id VARCHAR(64) REFERENCES messages(id) ON DELETE CASCADE,
        rating VARCHAR(32) NOT NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Seed default records if needed
    await seedPostgres(client);
    client.release();
    logger.info(' PostgreSQL schema initialized and verified');
  } catch (err) {
    isPostgresConnected = false;
    logger.warn(`⚠️ PostgreSQL connection not available (${err.message}).`);
    logger.info('📦 Activating built-in data store fallback so the server runs smoothly.');
    await seedMemoryStore();
  }
}

/**
 * Seed initial organization, users, and documents into PostgreSQL
 */
async function seedPostgres(client) {
  // Check if organization exists
  const orgRes = await client.query('SELECT * FROM organizations WHERE slug = $1', ['acme-enterprise']);
  let orgId;
  if (orgRes.rows.length === 0) {
    orgId = 'org-acme-1';
    await client.query(
      'INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)',
      [orgId, 'Acme Enterprise', 'acme-enterprise']
    );
  } else {
    orgId = orgRes.rows[0].id;
  }

  // Check admin user
  const adminRes = await client.query('SELECT * FROM users WHERE email = $1', ['admin@enterprise.ai']);
  const defaultPasswordHash = await bcrypt.hash('password123', config.BCRYPT_SALT_ROUNDS);

  let adminId;
  if (adminRes.rows.length === 0) {
    adminId = 'user-admin-1';
    await client.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [adminId, 'admin@enterprise.ai', defaultPasswordHash, 'Admin', 'User', 'ADMIN', true, orgId]
    );
  } else {
    adminId = adminRes.rows[0].id;
  }

  // Check employee user
  const empRes = await client.query('SELECT * FROM users WHERE email = $1', ['employee@enterprise.ai']);
  if (empRes.rows.length === 0) {
    await client.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['user-emp-1', 'employee@enterprise.ai', defaultPasswordHash, 'Sarah', 'Connor', 'EMPLOYEE', true, orgId]
    );
  }

  // Check documents
  const docCount = await client.query('SELECT COUNT(*) FROM documents WHERE organization_id = $1', [orgId]);
  if (parseInt(docCount.rows[0].count, 10) === 0) {
    const sampleDocs = [
      {
        id: 'doc-1',
        title: 'Employee Handbook 2026',
        original_name: 'Employee Handbook 2026.pdf',
        mime_type: 'application/pdf',
        file_size: 2450000,
        storage_key: `organizations/${orgId}/documents/employee-handbook-2026.pdf`,
        checksum: 'chk-1',
        chunks: [
          'Full-time employees receive 20 days of paid time off (PTO) annually. PTO accrues on a bi-weekly basis starting from your first day of employment. Unused PTO up to 5 days can roll over to the following calendar year with manager approval.',
          'Health insurance coverage begins on the first day of the month following your start date. Dental, vision, and mental wellness consultations are included with 100% employer contribution for individual plans.'
        ],
      },
      {
        id: 'doc-2',
        title: 'Remote Work Policy & Guidelines',
        original_name: 'Remote Work Policy & Guidelines.docx',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 890000,
        storage_key: `organizations/${orgId}/documents/remote-work-policy.docx`,
        checksum: 'chk-2',
        chunks: [
          'Employees are permitted up to 3 days of remote work per week under our hybrid policy. Core collaboration hours remain 10:00 AM to 4:00 PM EST across all engineering and operations teams.',
          'A one-time home office equipment stipend of $1,000 is available for monitors, ergonomic seating, and peripherals through the enterprise procurement portal.'
        ],
      },
      {
        id: 'doc-3',
        title: 'Security & Compliance Standards 2026',
        original_name: 'Security & Compliance Standards 2026.txt',
        mime_type: 'text/plain',
        file_size: 320000,
        storage_key: `organizations/${orgId}/documents/security-compliance.txt`,
        checksum: 'chk-3',
        chunks: [
          'Multi-factor authentication (MFA) is mandatory across all enterprise portals and SSO login systems. Laptops must run encrypted disks, and passphrases must be at least 12 characters rotated every 90 days.',
          'Data classified as Confidential or Restricted must never be copied to personal storage devices, unapproved cloud drives, or unmanaged external AI models.'
        ],
      },
    ];

    for (const doc of sampleDocs) {
      await client.query(
        `INSERT INTO documents (id, title, original_name, storage_key, file_size, mime_type, checksum, status, uploaded_by_id, organization_id, indexed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [doc.id, doc.title, doc.original_name, doc.storage_key, doc.file_size, doc.mime_type, doc.checksum, 'INDEXED', adminId, orgId]
      );

      for (let i = 0; i < doc.chunks.length; i++) {
        await client.query(
          `INSERT INTO document_chunks (id, document_id, chunk_index, content, token_count, page_number)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), doc.id, i, doc.chunks[i], Math.ceil(doc.chunks[i].length / 4), 1]
        );
      }
    }
  }
}

/**
 * Seed in-memory store for instant zero-dependency execution
 */
async function seedMemoryStore() {
  const org = {
    id: 'org-acme-1',
    name: 'Acme Enterprise',
    slug: 'acme-enterprise',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.organizations.push(org);

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  memoryStore.users.push(
    {
      id: 'user-admin-1',
      email: 'admin@enterprise.ai',
      password_hash: defaultPasswordHash,
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
      is_active: true,
      organization_id: org.id,
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-emp-1',
      email: 'employee@enterprise.ai',
      password_hash: defaultPasswordHash,
      first_name: 'Sarah',
      last_name: 'Connor',
      role: 'EMPLOYEE',
      is_active: true,
      organization_id: org.id,
      created_at: new Date().toISOString(),
    }
  );

  const sampleDocs = [
    {
      id: 'doc-1',
      title: 'Employee Handbook 2026',
      original_name: 'Employee Handbook 2026.pdf',
      mime_type: 'application/pdf',
      file_size: 2450000,
      storage_key: `organizations/${org.id}/documents/employee-handbook-2026.pdf`,
      checksum: 'chk-1',
      status: 'INDEXED',
      uploaded_by_id: 'user-admin-1',
      organization_id: org.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      indexed_at: new Date().toISOString(),
      chunks: [
        'Full-time employees receive 20 days of paid time off (PTO) annually. PTO accrues on a bi-weekly basis starting from your first day of employment. Unused PTO up to 5 days can roll over to the following calendar year with manager approval.',
        'Health insurance coverage begins on the first day of the month following your start date. Dental, vision, and mental wellness consultations are included with 100% employer contribution for individual plans.'
      ],
    },
    {
      id: 'doc-2',
      title: 'Remote Work Policy & Guidelines',
      original_name: 'Remote Work Policy & Guidelines.docx',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      file_size: 890000,
      storage_key: `organizations/${org.id}/documents/remote-work-policy.docx`,
      checksum: 'chk-2',
      status: 'INDEXED',
      uploaded_by_id: 'user-admin-1',
      organization_id: org.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      indexed_at: new Date().toISOString(),
      chunks: [
        'Employees are permitted up to 3 days of remote work per week under our hybrid policy. Core collaboration hours remain 10:00 AM to 4:00 PM EST across all engineering and operations teams.',
        'A one-time home office equipment stipend of $1,000 is available for monitors, ergonomic seating, and peripherals through the enterprise procurement portal.'
      ],
    },
    {
      id: 'doc-3',
      title: 'Security & Compliance Standards 2026',
      original_name: 'Security & Compliance Standards 2026.txt',
      mime_type: 'text/plain',
      file_size: 320000,
      storage_key: `organizations/${org.id}/documents/security-compliance.txt`,
      checksum: 'chk-3',
      status: 'INDEXED',
      uploaded_by_id: 'user-admin-1',
      organization_id: org.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      indexed_at: new Date().toISOString(),
      chunks: [
        'Multi-factor authentication (MFA) is mandatory across all enterprise portals and SSO login systems. Laptops must run encrypted disks, and passphrases must be at least 12 characters rotated every 90 days.',
        'Data classified as Confidential or Restricted must never be copied to personal storage devices, unapproved cloud drives, or unmanaged external AI models.'
      ],
    },
  ];

  for (const doc of sampleDocs) {
    const { chunks, ...docData } = doc;
    memoryStore.documents.push(docData);
    chunks.forEach((content, i) => {
      memoryStore.documentChunks.push({
        id: uuidv4(),
        document_id: doc.id,
        chunk_index: i,
        content,
        token_count: Math.ceil(content.length / 4),
        page_number: 1,
        created_at: new Date().toISOString(),
      });
    });
  }
}

/**
 * Universal Database Access Layer
 */
export const db = {
  get isConnected() {
    return isPostgresConnected;
  },

  async query(text, params = []) {
    if (isPostgresConnected && pool) {
      return pool.query(text, params);
    }
    throw new Error('PostgreSQL not connected');
  },

  // Organizations
  organizations: {
    async findBySlug(slug) {
      if (isPostgresConnected && pool) {
        const res = await pool.query('SELECT * FROM organizations WHERE slug = $1', [slug]);
        return res.rows[0] || null;
      }
      return memoryStore.organizations.find((o) => o.slug === slug) || null;
    },
    async findById(id) {
      if (isPostgresConnected && pool) {
        const res = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
        return res.rows[0] || null;
      }
      return memoryStore.organizations.find((o) => o.id === id) || null;
    },
    async create({ name, slug }) {
      const id = uuidv4();
      const now = new Date();
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          'INSERT INTO organizations (id, name, slug, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [id, name, slug, now, now]
        );
        return res.rows[0];
      }
      const org = { id, name, slug, created_at: now.toISOString(), updated_at: now.toISOString() };
      memoryStore.organizations.push(org);
      return org;
    },
  },

  // Users
  users: {
    async findByEmail(email) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `SELECT u.*, json_build_object('id', o.id, 'name', o.name, 'slug', o.slug) as organization
           FROM users u
           LEFT JOIN organizations o ON u.organization_id = o.id
           WHERE u.email = $1`,
          [email]
        );
        return res.rows[0] || null;
      }
      const user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return null;
      const org = memoryStore.organizations.find((o) => o.id === user.organization_id);
      return { ...user, organization: org };
    },
    async findById(id) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.organization_id, u.created_at,
                  json_build_object('id', o.id, 'name', o.name, 'slug', o.slug) as organization
           FROM users u
           LEFT JOIN organizations o ON u.organization_id = o.id
           WHERE u.id = $1`,
          [id]
        );
        return res.rows[0] || null;
      }
      const user = memoryStore.users.find((u) => u.id === id);
      if (!user) return null;
      const org = memoryStore.organizations.find((o) => o.id === user.organization_id);
      return { ...user, organization: org };
    },
    async findByOrg(orgId) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE organization_id = $1 ORDER BY created_at DESC',
          [orgId]
        );
        return res.rows.map((r) => ({
          ...r,
          firstName: r.first_name,
          lastName: r.last_name,
          isActive: r.is_active,
          createdAt: r.created_at,
        }));
      }
      return memoryStore.users
        .filter((u) => u.organization_id === orgId)
        .map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          role: u.role,
          isActive: u.is_active,
          createdAt: u.created_at,
        }));
    },
    async create({ email, passwordHash, firstName, lastName, role = 'EMPLOYEE', organizationId }) {
      const id = uuidv4();
      const now = new Date();
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, organization_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [id, email, passwordHash, firstName, lastName, role, true, organizationId, now, now]
        );
        return res.rows[0];
      }
      const user = {
        id,
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
        is_active: true,
        organization_id: organizationId,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      memoryStore.users.push(user);
      return user;
    },
    async countByOrg(orgId) {
      if (isPostgresConnected && pool) {
        const res = await pool.query('SELECT COUNT(*) FROM users WHERE organization_id = $1', [orgId]);
        return parseInt(res.rows[0].count, 10);
      }
      return memoryStore.users.filter((u) => u.organization_id === orgId).length;
    },
  },

  // Refresh Tokens
  refreshTokens: {
    async create({ tokenHash, userId, expiresAt }) {
      const id = uuidv4();
      if (isPostgresConnected && pool) {
        await pool.query(
          'INSERT INTO refresh_tokens (id, token_hash, user_id, expires_at) VALUES ($1, $2, $3, $4)',
          [id, tokenHash, userId, expiresAt]
        );
        return { id, tokenHash, userId, expiresAt };
      }
      const item = { id, token_hash: tokenHash, user_id: userId, expires_at: expiresAt };
      memoryStore.refreshTokens.push(item);
      return item;
    },
    async find(tokenHash) {
      if (isPostgresConnected && pool) {
        const res = await pool.query('SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL', [tokenHash]);
        return res.rows[0] || null;
      }
      return memoryStore.refreshTokens.find((t) => t.token_hash === tokenHash && !t.revoked_at) || null;
    },
    async revoke(tokenHash) {
      if (isPostgresConnected && pool) {
        await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
        return;
      }
      const tok = memoryStore.refreshTokens.find((t) => t.token_hash === tokenHash);
      if (tok) tok.revoked_at = new Date().toISOString();
    },
  },

  // Documents & Chunks
  documents: {
    async findByOrg(orgId) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `SELECT d.id, d.title, d.original_name, d.mime_type, d.file_size, d.status, d.created_at, d.updated_at, d.indexed_at,
                  json_build_object('id', u.id, 'firstName', u.first_name, 'lastName', u.last_name) as "uploadedBy"
           FROM documents d
           LEFT JOIN users u ON d.uploaded_by_id = u.id
           WHERE d.organization_id = $1
           ORDER BY d.created_at DESC`,
          [orgId]
        );
        return res.rows.map((r) => ({
          id: r.id,
          title: r.title,
          originalName: r.original_name,
          mimeType: r.mime_type,
          fileSize: r.file_size,
          status: r.status,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          indexedAt: r.indexed_at,
          uploadedBy: r.uploadedBy,
        }));
      }
      return memoryStore.documents
        .filter((d) => d.organization_id === orgId)
        .map((d) => {
          const uploader = memoryStore.users.find((u) => u.id === d.uploaded_by_id);
          return {
            id: d.id,
            title: d.title,
            originalName: d.original_name,
            mimeType: d.mime_type,
            fileSize: d.file_size,
            status: d.status,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            indexedAt: d.indexed_at,
            uploadedBy: uploader ? { id: uploader.id, firstName: uploader.first_name, lastName: uploader.last_name } : null,
          };
        });
    },
    async findById(id, orgId) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `SELECT d.*, json_build_object('id', u.id, 'firstName', u.first_name, 'lastName', u.last_name) as "uploadedBy"
           FROM documents d
           LEFT JOIN users u ON d.uploaded_by_id = u.id
           WHERE d.id = $1 AND d.organization_id = $2`,
          [id, orgId]
        );
        return res.rows[0] || null;
      }
      const doc = memoryStore.documents.find((d) => d.id === id && d.organization_id === orgId);
      if (!doc) return null;
      const uploader = memoryStore.users.find((u) => u.id === doc.uploaded_by_id);
      return {
        ...doc,
        originalName: doc.original_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        uploadedBy: uploader ? { id: uploader.id, firstName: uploader.first_name, lastName: uploader.last_name } : null,
      };
    },
    async create(data) {
      const id = data.id || uuidv4();
      const now = new Date();
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `INSERT INTO documents (id, title, original_name, storage_key, file_size, mime_type, checksum, status, uploaded_by_id, organization_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
          [id, data.title, data.originalName, data.storageKey, data.fileSize, data.mimeType, data.checksum, data.status || 'UPLOADED', data.uploadedById, data.organizationId, now, now]
        );
        return res.rows[0];
      }
      const doc = {
        id,
        title: data.title,
        original_name: data.originalName,
        storage_key: data.storageKey,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        checksum: data.checksum,
        status: data.status || 'UPLOADED',
        uploaded_by_id: data.uploadedById,
        organization_id: data.organizationId,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      memoryStore.documents.push(doc);
      return doc;
    },
    async updateStatus(id, status, indexedAt = null) {
      if (isPostgresConnected && pool) {
        await pool.query(
          'UPDATE documents SET status = $1, indexed_at = $2, updated_at = NOW() WHERE id = $3',
          [status, indexedAt, id]
        );
        return;
      }
      const doc = memoryStore.documents.find((d) => d.id === id);
      if (doc) {
        doc.status = status;
        if (indexedAt) doc.indexed_at = indexedAt.toISOString();
        doc.updated_at = new Date().toISOString();
      }
    },
    async delete(id, orgId) {
      if (isPostgresConnected && pool) {
        await pool.query('DELETE FROM document_chunks WHERE document_id = $1', [id]);
        await pool.query('DELETE FROM documents WHERE id = $1 AND organization_id = $2', [id, orgId]);
        return;
      }
      memoryStore.documentChunks = memoryStore.documentChunks.filter((c) => c.document_id !== id);
      memoryStore.documents = memoryStore.documents.filter((d) => !(d.id === id && d.organization_id === orgId));
    },
    async countByOrg(orgId) {
      if (isPostgresConnected && pool) {
        const res = await pool.query('SELECT COUNT(*), COALESCE(SUM(file_size), 0) as total_size FROM documents WHERE organization_id = $1', [orgId]);
        return {
          count: parseInt(res.rows[0].count, 10),
          totalBytes: parseInt(res.rows[0].total_size, 10),
        };
      }
      const docs = memoryStore.documents.filter((d) => d.organization_id === orgId);
      return {
        count: docs.length,
        totalBytes: docs.reduce((acc, d) => acc + (d.file_size || 0), 0),
      };
    },
  },

  // Chunks & Search
  chunks: {
    async createMany(chunks) {
      if (isPostgresConnected && pool) {
        for (const c of chunks) {
          await pool.query(
            `INSERT INTO document_chunks (id, document_id, chunk_index, content, token_count, page_number)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), c.documentId, c.chunkIndex, c.content, c.tokenCount || 0, c.pageNumber || 1]
          );
        }
        return;
      }
      for (const c of chunks) {
        memoryStore.documentChunks.push({
          id: uuidv4(),
          document_id: c.documentId,
          chunk_index: c.chunkIndex,
          content: c.content,
          token_count: c.tokenCount || 0,
          page_number: c.pageNumber || 1,
          created_at: new Date().toISOString(),
        });
      }
    },
    async search(query, orgId, limit = 5) {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

      if (isPostgresConnected && pool) {
        // Full text / ILIKE keyword search on PostgreSQL
        const res = await pool.query(
          `SELECT dc.id as "chunkId", dc.content, dc.page_number as "pageNumber",
                  d.id as "documentId", d.title as "documentTitle"
           FROM document_chunks dc
           JOIN documents d ON dc.document_id = d.id
           WHERE d.organization_id = $1 AND d.status = 'INDEXED'
           ORDER BY dc.created_at DESC
           LIMIT 50`,
          [orgId]
        );

        const scored = res.rows.map((row) => {
          let score = 0;
          const lower = row.content.toLowerCase();
          const titleLower = row.documentTitle.toLowerCase();
          for (const term of terms) {
            if (lower.includes(term)) score += 2;
            if (titleLower.includes(term)) score += 3;
          }
          return { ...row, similarity: score > 0 ? Math.min(0.95, 0.6 + score * 0.1) : 0.5 };
        });

        scored.sort((a, b) => b.similarity - a.similarity);
        return scored.slice(0, limit);
      }

      // In-memory search
      const orgDocs = memoryStore.documents.filter((d) => d.organization_id === orgId && d.status === 'INDEXED');
      const docMap = new Map(orgDocs.map((d) => [d.id, d.title]));

      const eligibleChunks = memoryStore.documentChunks.filter((c) => docMap.has(c.document_id));

      const scored = eligibleChunks.map((c) => {
        let score = 0;
        const lower = c.content.toLowerCase();
        const docTitle = docMap.get(c.document_id) || 'Document';
        const titleLower = docTitle.toLowerCase();
        for (const term of terms) {
          if (lower.includes(term)) score += 2;
          if (titleLower.includes(term)) score += 3;
        }
        return {
          chunkId: c.id,
          content: c.content,
          pageNumber: c.page_number,
          documentId: c.document_id,
          documentTitle: docTitle,
          similarity: score > 0 ? Math.min(0.98, 0.65 + score * 0.08) : 0.5,
        };
      });

      scored.sort((a, b) => b.similarity - a.similarity);
      return scored.slice(0, limit);
    },
  },

  // Conversations & Messages
  conversations: {
    async findByOrgAndUser(orgId, userId) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `SELECT c.id, c.title, c.created_at as "createdAt", c.updated_at as "updatedAt",
                  COALESCE(
                    (SELECT json_agg(m ORDER BY m.created_at ASC)
                     FROM (SELECT content, role FROM messages WHERE conversation_id = c.id LIMIT 1) m
                    ), '[]'::json
                  ) as messages
           FROM conversations c
           WHERE c.organization_id = $1 AND c.user_id = $2
           ORDER BY c.updated_at DESC`,
          [orgId, userId]
        );
        return res.rows;
      }
      return memoryStore.conversations
        .filter((c) => c.organization_id === orgId && c.user_id === userId)
        .map((c) => {
          const firstMsg = memoryStore.messages.find((m) => m.conversation_id === c.id);
          return {
            id: c.id,
            title: c.title,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            messages: firstMsg ? [{ content: firstMsg.content, role: firstMsg.role }] : [],
          };
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    async findById(id, orgId, userId) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `SELECT c.id, c.title, c.created_at as "createdAt", c.updated_at as "updatedAt",
                  COALESCE(
                    (SELECT json_agg(m ORDER BY m.created_at ASC)
                     FROM messages m WHERE m.conversation_id = c.id
                    ), '[]'::json
                  ) as messages
           FROM conversations c
           WHERE c.id = $1 AND c.organization_id = $2 AND c.user_id = $3`,
          [id, orgId, userId]
        );
        return res.rows[0] || null;
      }
      const c = memoryStore.conversations.find((conv) => conv.id === id && conv.organization_id === orgId && conv.user_id === userId);
      if (!c) return null;
      const msgs = memoryStore.messages
        .filter((m) => m.conversation_id === c.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return {
        id: c.id,
        title: c.title,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        messages: msgs,
      };
    },
    async create({ userId, organizationId, title }) {
      const id = uuidv4();
      const now = new Date();
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          'INSERT INTO conversations (id, user_id, organization_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [id, userId, organizationId, title, now, now]
        );
        return res.rows[0];
      }
      const conv = {
        id,
        user_id: userId,
        organization_id: organizationId,
        title,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      memoryStore.conversations.push(conv);
      return conv;
    },
    async delete(id) {
      if (isPostgresConnected && pool) {
        await pool.query('DELETE FROM conversations WHERE id = $1', [id]);
        return;
      }
      memoryStore.messages = memoryStore.messages.filter((m) => m.conversation_id !== id);
      memoryStore.conversations = memoryStore.conversations.filter((c) => c.id !== id);
    },
  },

  // Messages & Sources
  messages: {
    async create({ conversationId, role, content }) {
      const id = uuidv4();
      const now = new Date();
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [id, conversationId, role, content, now]
        );
        return res.rows[0];
      }
      const msg = {
        id,
        conversation_id: conversationId,
        role,
        content,
        created_at: now.toISOString(),
      };
      memoryStore.messages.push(msg);
      return msg;
    },
    async addSources(messageId, sources) {
      if (isPostgresConnected && pool) {
        for (const s of sources) {
          await pool.query(
            'INSERT INTO answer_sources (id, message_id, chunk_id, citation_label) VALUES ($1, $2, $3, $4)',
            [uuidv4(), messageId, s.chunkId, s.citationLabel]
          );
        }
        return;
      }
      for (const s of sources) {
        memoryStore.answerSources.push({
          id: uuidv4(),
          message_id: messageId,
          chunk_id: s.chunkId,
          citation_label: s.citationLabel,
          created_at: new Date().toISOString(),
        });
      }
    },
    async findRecentInConversation(conversationId, limit = 5) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2',
          [conversationId, limit]
        );
        return res.rows.reverse();
      }
      return memoryStore.messages
        .filter((m) => m.conversation_id === conversationId)
        .slice(-limit);
    },
  },

  // Search Queries
  searchQueries: {
    async create({ userId, organizationId, conversationId, queryText, latencyMs }) {
      const id = uuidv4();
      const now = new Date();
      if (isPostgresConnected && pool) {
        await pool.query(
          'INSERT INTO search_queries (id, user_id, organization_id, conversation_id, query_text, latency_ms, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [id, userId, organizationId, conversationId, queryText, latencyMs, now]
        );
        return;
      }
      memoryStore.searchQueries.push({
        id,
        user_id: userId,
        organization_id: organizationId,
        conversation_id: conversationId,
        query_text: queryText,
        latency_ms: latencyMs,
        created_at: now.toISOString(),
      });
    },
    async countByOrg(orgId) {
      if (isPostgresConnected && pool) {
        const res = await pool.query('SELECT COUNT(*) FROM search_queries WHERE organization_id = $1', [orgId]);
        return parseInt(res.rows[0].count, 10);
      }
      return memoryStore.searchQueries.filter((q) => q.organization_id === orgId).length;
    },
    async getRecentByOrg(orgId, limit = 5) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `SELECT sq.id, sq.query_text as "queryText", sq.latency_ms as "latencyMs", sq.created_at as "createdAt",
                  json_build_object('firstName', u.first_name, 'lastName', u.last_name) as user
           FROM search_queries sq
           LEFT JOIN users u ON sq.user_id = u.id
           WHERE sq.organization_id = $1
           ORDER BY sq.created_at DESC
           LIMIT $2`,
          [orgId, limit]
        );
        return res.rows;
      }
      return memoryStore.searchQueries
        .filter((q) => q.organization_id === orgId)
        .slice(-limit)
        .map((q) => {
          const user = memoryStore.users.find((u) => u.id === q.user_id);
          return {
            id: q.id,
            queryText: q.query_text,
            latencyMs: q.latency_ms,
            createdAt: q.created_at,
            user: user ? { firstName: user.first_name, lastName: user.last_name } : null,
          };
        });
    },
  },

  // Feedback
  feedback: {
    async create({ userId, messageId, rating, comment }) {
      const id = uuidv4();
      const now = new Date();
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          'INSERT INTO feedback (id, user_id, message_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [id, userId, messageId, rating, comment, now]
        );
        return res.rows[0];
      }
      const item = {
        id,
        user_id: userId,
        message_id: messageId,
        rating,
        comment,
        created_at: now.toISOString(),
      };
      memoryStore.feedback.push(item);
      return item;
    },
    async findByOrg(orgId, limit = 50) {
      if (isPostgresConnected && pool) {
        const res = await pool.query(
          `SELECT f.id, f.rating, f.comment, f.created_at as "createdAt",
                  json_build_object('firstName', u.first_name, 'lastName', u.last_name) as user,
                  json_build_object('content', m.content) as message
           FROM feedback f
           JOIN messages m ON f.message_id = m.id
           JOIN conversations c ON m.conversation_id = c.id
           LEFT JOIN users u ON f.user_id = u.id
           WHERE c.organization_id = $1
           ORDER BY f.created_at DESC
           LIMIT $2`,
          [orgId, limit]
        );
        return res.rows;
      }
      return memoryStore.feedback.map((f) => {
        const user = memoryStore.users.find((u) => u.id === f.user_id);
        const msg = memoryStore.messages.find((m) => m.id === f.message_id);
        return {
          id: f.id,
          rating: f.rating,
          comment: f.comment,
          createdAt: f.created_at,
          user: user ? { firstName: user.first_name, lastName: user.last_name } : null,
          message: msg ? { content: msg.content } : null,
        };
      });
    },
  },
};
