// Client: Axios API client with live server routing and demo fallback

import axios, { AxiosRequestConfig } from 'axios';

const realApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

realApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// In-memory demo state stored in localStorage for persistence across reloads
const STORAGE_PREFIX = 'aieks_demo_';

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {}
}

// Initial demo datasets
const initialDocs = [
  {
    id: 'doc-1',
    title: 'Employee Handbook 2026',
    originalName: 'Employee Handbook 2026.pdf',
    mimeType: 'application/pdf',
    fileSize: 2450000,
    status: 'INDEXED',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    uploadedBy: { firstName: 'Sarah', lastName: 'Connor' },
  },
  {
    id: 'doc-2',
    title: 'Remote Work Policy & Guidelines',
    originalName: 'Remote Work Policy & Guidelines.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 890000,
    status: 'INDEXED',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    uploadedBy: { firstName: 'David', lastName: 'Miller' },
  },
  {
    id: 'doc-3',
    title: 'Engineering Onboarding & Architecture',
    originalName: 'Engineering Onboarding & Architecture.pdf',
    mimeType: 'application/pdf',
    fileSize: 5200000,
    status: 'INDEXED',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    uploadedBy: { firstName: 'Alex', lastName: 'Vance' },
  },
  {
    id: 'doc-4',
    title: 'Security & Compliance Standards 2026',
    originalName: 'Security & Compliance Standards 2026.txt',
    mimeType: 'text/plain',
    fileSize: 320000,
    status: 'INDEXED',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    uploadedBy: { firstName: 'Admin', lastName: 'User' },
  },
];

const initialConversations = [
  {
    id: 'conv-1',
    title: 'PTO and Leave Policy Inquiry',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        role: 'USER',
        content: 'How many days of paid time off do employees get each year?',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'msg-2',
        role: 'ASSISTANT',
        content:
          'Full-time employees receive 20 days of paid time off (PTO) annually [1]. PTO accrues on a bi-weekly basis starting from your first day of employment [1]. Unused PTO up to 5 days can roll over to the following calendar year with manager approval [2].',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
];

// Fallback Mock Router
async function handleMockRequest(method: string, url: string, data?: any): Promise<any> {
  const cleanUrl = url.replace(/^\/api(\/v1)?/, '');

  // Auth: Register
  if (method === 'POST' && cleanUrl === '/auth/register') {
    const user = {
      id: 'usr-' + Date.now(),
      organizationId: 'org-demo',
      firstName: data.firstName || 'Demo',
      lastName: data.lastName || 'User',
      email: data.email,
      role: 'ADMIN',
    };
    setStored('currentUser', user);
    return {
      status: 'success',
      data: {
        accessToken: 'demo-jwt-token-' + Date.now(),
        refreshToken: 'demo-refresh-token',
        user,
      },
    };
  }

  // Auth: Login
  if (method === 'POST' && cleanUrl === '/auth/login') {
    const storedUser = getStored('currentUser', {
      id: 'usr-admin',
      organizationId: 'org-demo',
      firstName: 'Admin',
      lastName: 'User',
      email: data.email || 'admin@enterprise.ai',
      role: 'ADMIN',
    });
    return {
      status: 'success',
      data: {
        accessToken: 'demo-jwt-token-' + Date.now(),
        refreshToken: 'demo-refresh-token',
        user: storedUser,
      },
    };
  }

  // Auth: Current User Profile
  if (method === 'GET' && cleanUrl === '/auth/me') {
    const user = getStored('currentUser', {
      id: 'usr-admin',
      organizationId: 'org-demo',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@enterprise.ai',
      role: 'ADMIN',
      organization: { name: 'Acme Enterprise', slug: 'acme-enterprise' },
    });
    return { status: 'success', data: user };
  }

  // Search RAG API
  if (method === 'POST' && cleanUrl === '/search') {
    const query = data.query || '';
    const convs = getStored('conversations', initialConversations);
    let convId = data.conversationId;

    let conv = convs.find((c) => c.id === convId);
    if (!conv) {
      convId = 'conv-' + Date.now();
      conv = {
        id: convId,
        title: query.substring(0, 45) || 'Knowledge Search',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      convs.unshift(conv);
    }

    const messageId = 'msg-' + Date.now();
    const answer = generateMockAnswer(query);
    const sources = [
      {
        chunkId: 'chk-1',
        label: '[1]',
        title: 'Employee Handbook 2026.pdf (Page 14)',
        excerpt:
          'All full-time personnel are granted 20 paid vacation days per calendar year, along with 10 standard federal holidays and 2 floating personal days.',
      },
      {
        chunkId: 'chk-2',
        label: '[2]',
        title: 'Remote Work Policy & Guidelines.docx (Page 3)',
        excerpt:
          'Employees are permitted up to 3 days of remote work per week. Core collaboration hours remain 10:00 AM to 4:00 PM EST across all engineering and operations teams.',
      },
      {
        chunkId: 'chk-3',
        label: '[3]',
        title: 'Security & Compliance Standards 2026.txt (Section 4)',
        excerpt:
          'Multi-factor authentication (MFA) is mandatory across all enterprise portals and SSO login systems. Laptops must run encrypted disks.',
      },
    ];

    // Persist messages in conversation
    conv.messages.push({
      id: 'usr-msg-' + Date.now(),
      role: 'USER',
      content: query,
      createdAt: new Date().toISOString(),
    });
    conv.messages.push({
      id: messageId,
      role: 'ASSISTANT',
      content: answer,
      createdAt: new Date().toISOString(),
    });
    conv.updatedAt = new Date().toISOString();
    setStored('conversations', convs);

    // Track search count
    const searchCount = getStored('searchCount', 156) + 1;
    setStored('searchCount', searchCount);

    return {
      status: 'success',
      data: {
        messageId,
        conversationId: convId,
        answer,
        sources,
        latencyMs: Math.floor(Math.random() * 150) + 120,
      },
    };
  }

  // Conversations List
  if (method === 'GET' && cleanUrl === '/conversations') {
    const convs = getStored('conversations', initialConversations);
    return { status: 'success', data: convs };
  }

  // Conversation Detail
  if (method === 'GET' && cleanUrl.startsWith('/conversations/')) {
    const id = cleanUrl.split('/')[2];
    const convs = getStored('conversations', initialConversations);
    const conv = convs.find((c) => c.id === id);
    if (!conv) throw new Error('Conversation not found');
    return { status: 'success', data: conv };
  }

  // Delete Conversation
  if (method === 'DELETE' && cleanUrl.includes('/conversations/')) {
    const id = cleanUrl.split('/conversations/')[1]?.split('?')[0];
    let convs = getStored('conversations', initialConversations);
    convs = convs.filter((c) => String(c.id) !== String(id));
    setStored('conversations', convs);
    return { status: 'success', data: {} };
  }

  // Submit Feedback
  if (method === 'POST' && cleanUrl.startsWith('/feedback/')) {
    const messageId = cleanUrl.split('/')[2];
    const feedbacks = getStored('feedbacks', [
      {
        id: 'fb-1',
        messageId: 'msg-2',
        rating: 'HELPFUL',
        comment: 'Very clear explanation with precise citation',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        user: { firstName: 'Alice', lastName: 'Engineer' },
        message: { content: 'Full-time employees receive 20 days of paid time off...' },
      },
    ]);
    const currentUser = getStored('currentUser', { firstName: 'Demo', lastName: 'User' });
    feedbacks.unshift({
      id: 'fb-' + Date.now(),
      messageId,
      rating: data.rating,
      comment: data.comment || '',
      createdAt: new Date().toISOString(),
      user: currentUser,
      message: { content: 'Answer retrieved from knowledge base.' },
    });
    setStored('feedbacks', feedbacks);
    return { status: 'success', data: {} };
  }

  // Admin Feedback List
  if (method === 'GET' && cleanUrl === '/feedback/admin') {
    const feedbacks = getStored('feedbacks', [
      {
        id: 'fb-1',
        rating: 'HELPFUL',
        comment: 'Accurate policy references and clear citation links',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        user: { firstName: 'Alice', lastName: 'Smith' },
        message: { content: 'Employees are entitled to 20 days of paid vacation [1]...' },
      },
      {
        id: 'fb-2',
        rating: 'HELPFUL',
        comment: 'Quick answers for onboarding',
        createdAt: new Date(Date.now() - 18000000).toISOString(),
        user: { firstName: 'Bob', lastName: 'Johnson' },
        message: { content: 'Core collaboration hours are 10 AM to 4 PM EST [2]...' },
      },
    ]);
    return { status: 'success', data: feedbacks };
  }

  // Admin Dashboard Stats
  if (method === 'GET' && cleanUrl === '/admin/dashboard') {
    const docs = getStored('documents', initialDocs);
    const searchCount = getStored('searchCount', 158);
    const totalStorageKB = docs.reduce((acc, d) => acc + (d.fileSize || 0), 0) / 1024;
    return {
      status: 'success',
      data: {
        stats: {
          userCount: 24,
          documentCount: docs.length,
          searchCount,
          totalStorageKB: Math.round(totalStorageKB),
        },
        recentSearches: [
          { queryText: 'What is the remote work policy?', latencyMs: 142 },
          { queryText: 'How do I request a new laptop?', latencyMs: 198 },
          { queryText: 'Where is the expense reimbursement form?', latencyMs: 110 },
        ],
      },
    };
  }

  // Admin Documents List
  if (method === 'GET' && cleanUrl === '/admin/documents') {
    const docs = getStored('documents', initialDocs);
    return { status: 'success', data: docs };
  }

  // Admin Upload Document
  if (method === 'POST' && (cleanUrl === '/documents' || cleanUrl === '/admin/documents')) {
    const docs = getStored('documents', initialDocs);
    const fileName =
      data instanceof FormData
        ? (data.get('file') as File)?.name || 'Uploaded Document.pdf'
        : 'Uploaded Document.pdf';

    const newDoc = {
      id: 'doc-' + Date.now(),
      title: fileName.replace(/\.[^/.]+$/, ''),
      originalName: fileName,
      mimeType: 'application/pdf',
      fileSize: Math.floor(Math.random() * 3000000) + 500000,
      status: 'INDEXED',
      createdAt: new Date().toISOString(),
      uploadedBy: getStored('currentUser', { firstName: 'Admin', lastName: 'User' }),
    };

    docs.unshift(newDoc);
    setStored('documents', docs);
    return { status: 'success', data: newDoc };
  }

  // Admin Delete Document
  if (method === 'DELETE' && (cleanUrl.startsWith('/admin/documents/') || cleanUrl.startsWith('/documents/'))) {
    const id = cleanUrl.split('/').pop();
    let docs = getStored('documents', initialDocs);
    docs = docs.filter((d) => d.id !== id);
    setStored('documents', docs);
    return { status: 'success', data: {} };
  }

  return { status: 'success', data: {} };
}

function generateMockAnswer(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('remote') || q.includes('work from home') || q.includes('hybrid')) {
    return 'According to the Remote Work Policy & Guidelines [2], employees are eligible for hybrid remote arrangements allowing up to 3 work-from-home days per week. Core collaboration hours are 10:00 AM to 4:00 PM EST [2]. All remote equipment must adhere to corporate security encryption standards [3].';
  }
  if (q.includes('leave') || q.includes('pto') || q.includes('vacation') || q.includes('holiday') || q.includes('time off')) {
    return 'Per the Employee Handbook 2026 [1], full-time employees accrue 20 days of paid vacation time off (PTO) annually, alongside 10 observed company holidays and 2 floating personal days. Up to 5 unused days can be rolled over to the next calendar year [1].';
  }
  if (q.includes('security') || q.includes('password') || q.includes('compliance') || q.includes('mfa') || q.includes('vpn')) {
    return 'Based on the Security & Compliance Standards [3], multi-factor authentication (MFA) is strictly required for all internal tools and VPN access. Passwords must be at least 12 characters and changed every 90 days. Unencrypted removable media is prohibited [3].';
  }
  if (q.includes('architecture') || q.includes('stack') || q.includes('engineering') || q.includes('tech')) {
    return 'As documented in the Engineering Onboarding & Architecture guide [3], the core platform utilizes PostgreSQL with pgvector for embedding similarity search, BullMQ and Redis for async ingestion queues, and an Express TypeScript micro-layer with React client.';
  }
  return `Based on the indexed enterprise documentation [1][2], here is the verified information regarding "${query}": The policy specifies structured guidelines across department operations, requiring manager sign-off for exceptions [1] and quarterly compliance verification [3].`;
}

// Unified API Interface (tries live backend first, falls back to demo mode)
export const api = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await realApi.get(url, config);
      return res.data;
    } catch {
      return handleMockRequest('GET', url);
    }
  },

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await realApi.post(url, data, config);
      return res.data;
    } catch {
      return handleMockRequest('POST', url, data);
    }
  },

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await realApi.delete(url, config);
      return res.data;
    } catch {
      return handleMockRequest('DELETE', url);
    }
  },
};
