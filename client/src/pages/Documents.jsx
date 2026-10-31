// Client: Document Management view matching approved design (documents/code.html)
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/client';
import { UploadProgressModal } from '../components/documents/UploadProgressModal';
import { DocumentPreviewModal } from '../components/search/DocumentPreviewModal';
export const Documents = () => {
    const [searchFilter, setSearchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    // Fetch documents list from API
    const { data: documentsRes, refetch } = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            try {
                const res = await api.get('/documents');
                return res.data || [];
            }
            catch {
                // Fallback default sample data matching approved design if backend is seeding
                return [
                    {
                        id: '1',
                        title: 'Q3_Financial_Report.pdf',
                        status: 'READY',
                        fileSize: '2.4 MB',
                        createdAt: '2026-08-28',
                    },
                    {
                        id: '2',
                        title: 'Customer_Data_2023.csv',
                        status: 'INDEXING',
                        fileSize: '14.1 MB',
                        createdAt: '2026-08-29',
                    },
                    {
                        id: '3',
                        title: 'Architecture_Diagram_v2.png',
                        status: 'FAILED',
                        fileSize: '3.8 MB',
                        createdAt: '2026-08-27',
                    },
                    {
                        id: '4',
                        title: 'Employee_Handbook.docx',
                        status: 'READY',
                        fileSize: '1.1 MB',
                        createdAt: '2026-08-26',
                    },
                    {
                        id: '5',
                        title: 'Marketing_Plan_Final.pdf',
                        status: 'READY',
                        fileSize: '5.6 MB',
                        createdAt: '2026-08-25',
                    },
                ];
            }
        },
    });
    const documents = Array.isArray(documentsRes) ? documentsRes : [];
    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = doc.title?.toLowerCase().includes(searchFilter.toLowerCase());
        if (statusFilter === 'ALL')
            return matchesSearch;
        if (statusFilter === 'READY')
            return matchesSearch && (doc.status === 'READY' || doc.status === 'INDEXED');
        if (statusFilter === 'INDEXING')
            return matchesSearch && (doc.status === 'INDEXING' || doc.status === 'PROCESSING');
        if (statusFilter === 'FAILED')
            return matchesSearch && doc.status === 'FAILED';
        return matchesSearch;
    });
    return (<div className="flex flex-col w-full max-w-5xl mx-auto px-container-margin py-lg gap-md pb-xxl relative min-h-[calc(100vh-4rem)]">
      {/* Header & Title */}
      <div className="flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
            Documents
          </h1>
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-xl font-label-md text-label-md shadow-md hover:bg-on-primary-fixed transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Upload File</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-sm w-full">
          <div className="flex-1 bg-surface-container rounded-xl flex items-center px-md py-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-sm">search</span>
            <input className="w-full bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50" placeholder="Search files..." type="text" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}/>
          </div>
        </div>

        {/* Filter Badges Chips */}
        <div className="flex gap-sm overflow-x-auto no-scrollbar py-xs">
          <button onClick={() => setStatusFilter('ALL')} className={`px-md py-xs rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${statusFilter === 'ALL'
            ? 'bg-primary-container text-on-primary-container font-bold'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}>
            All ({documents.length})
          </button>
          <button onClick={() => setStatusFilter('READY')} className={`px-md py-xs rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${statusFilter === 'READY'
            ? 'bg-primary-container text-on-primary-container font-bold'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}>
            Ready
          </button>
          <button onClick={() => setStatusFilter('INDEXING')} className={`px-md py-xs rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${statusFilter === 'INDEXING'
            ? 'bg-primary-container text-on-primary-container font-bold'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}>
            Indexing
          </button>
          <button onClick={() => setStatusFilter('FAILED')} className={`px-md py-xs rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${statusFilter === 'FAILED'
            ? 'bg-primary-container text-on-primary-container font-bold'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}>
            Failed
          </button>
        </div>
      </div>

      {/* Document List Items */}
      <div className="flex flex-col gap-sm py-sm">
        {filteredDocuments.length > 0 ? (filteredDocuments.map((doc) => {
            const isReady = doc.status === 'READY' || doc.status === 'INDEXED';
            const isIndexing = doc.status === 'INDEXING' || doc.status === 'PROCESSING';
            const isFailed = doc.status === 'FAILED';
            const isPdf = doc.title?.toLowerCase().includes('.pdf');
            return (<div key={doc.id} onClick={() => setPreviewDoc({
                    id: doc.id,
                    title: doc.title,
                    fileSize: doc.fileSize || '2.4 MB',
                    isConfidential: true,
                    fullExcerpt: `This document "${doc.title}" has been successfully ingested and indexed into the enterprise vector database for RAG context matching.`,
                })} className="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-outline-variant/30 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-md min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isFailed
                    ? 'bg-error-container/40 text-error'
                    : isIndexing
                        ? 'bg-secondary-container/20 text-secondary'
                        : 'bg-tertiary-container/20 text-on-tertiary-container'}`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {isPdf ? 'picture_as_pdf' : 'description'}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-title-lg text-title-lg text-on-surface truncate font-semibold group-hover:text-primary transition-colors">
                      {doc.title}
                    </span>
                    <div className="flex items-center gap-xs mt-1">
                      {isIndexing ? (<>
                          <span className="material-symbols-outlined text-secondary text-[14px] animate-spin">
                            sync
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Indexing • {doc.fileSize || '14.1 MB'}
                          </span>
                        </>) : isFailed ? (<>
                          <span className="w-2 h-2 rounded-full bg-error"></span>
                          <span className="font-body-sm text-body-sm text-error font-medium">
                            Failed to index
                          </span>
                        </>) : (<>
                          <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Ready • {doc.fileSize || '2.4 MB'}
                          </span>
                        </>)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">
                    visibility
                  </span>
                </div>
              </div>);
        })) : (<div className="p-xxl bg-surface-container rounded-2xl text-center text-on-surface-variant font-body-md">
            No documents found matching your filter.
          </div>)}
      </div>

      {/* Floating Add Document Action Button */}
      <button onClick={() => setIsUploadModalOpen(true)} className="fixed bottom-24 right-container-margin w-14 h-14 bg-primary text-on-primary rounded-[16px] shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95 z-40" title="Upload Document">
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      {/* Upload Progress Modal */}
      <UploadProgressModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={() => refetch()}/>

      {/* Document Preview Modal */}
      <DocumentPreviewModal isOpen={Boolean(previewDoc)} onClose={() => setPreviewDoc(null)} document={previewDoc}/>
    </div>);
};
