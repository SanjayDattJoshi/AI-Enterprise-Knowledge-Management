// Client: Document Preview Modal matching document_preview/code.html
import React from 'react';
export const DocumentPreviewModal = ({ isOpen, onClose, document, }) => {
    if (!isOpen || !document)
        return null;
    const isPdf = document.title.toLowerCase().includes('.pdf');
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-surface-container-lowest rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.18)] border border-outline-variant/30 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Document Header Area */}
        <div className="px-lg py-md bg-surface border-b border-outline-variant/30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-sm min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? 'bg-error-container text-on-error-container' : 'bg-secondary-container/30 text-secondary'}`}>
              <span className="material-symbols-outlined text-[24px]">
                {isPdf ? 'picture_as_pdf' : 'description'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="font-title-lg text-title-lg text-on-surface truncate font-bold">
                {document.title}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                <span>Page {document.pageNumber || 1}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span>{document.fileSize || '2.4 MB'}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span>{document.isConfidential ? 'Internal Enterprise Document' : 'Verified Source'}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0 hover:bg-surface-container-high transition-colors" title="Close modal">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Document Viewer / Excerpt Content */}
        <div className="p-lg md:p-xl bg-surface-container-low overflow-y-auto flex-1">
          <div className="max-w-[800px] mx-auto bg-surface-container-lowest shadow-md rounded-xl p-lg md:p-xl font-body-lg text-body-lg text-on-surface leading-relaxed border border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md mb-md text-primary font-bold">
              {document.sectionTitle || 'Document Citation Context'}
            </h3>

            <p className="mb-md text-on-surface-variant font-body-md text-body-md">
              {document.fullExcerpt ||
            'The company offers comprehensive policies and documented guidelines. All entries in the vector index represent official, validated enterprise sources.'}
            </p>

            {/* Highlighted Citation Passage */}
            <div className="relative bg-secondary-fixed/30 rounded-lg p-md my-md border-l-4 border-primary transition-all duration-300 hover:bg-secondary-fixed/50 group">
              <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              </div>
              <p className="text-on-surface font-medium font-body-md text-body-md relative z-10 italic">
                "{document.highlightedExcerpt || document.fullExcerpt}"
              </p>
            </div>

            <div className="mt-xl pt-lg border-t border-outline-variant/30 flex justify-between items-center text-label-md text-outline">
              <span>Indexed Date: {document.createdAt || 'Recent'}</span>
              <span className="flex items-center gap-xs text-secondary font-semibold">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                AI Vector Match
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Action */}
        <div className="p-md bg-surface border-t border-outline-variant/30 flex justify-end">
          <button onClick={onClose} className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-full shadow-md hover:bg-on-primary-fixed transition-all">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="font-label-md text-label-md">Return to Answer</span>
          </button>
        </div>
      </div>
    </div>);
};
