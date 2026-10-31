// Client: Admin document table with status badges and delete
import React from 'react';
import { useAdminDocuments, useDeleteDocument } from '../../lib/api/admin.api';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
const statusColors = {
    UPLOADED: 'bg-gray-100 text-gray-600',
    PROCESSING: 'bg-blue-50 text-blue-600',
    INDEXED: 'bg-green-50 text-green-600',
    FAILED: 'bg-red-50 text-red-600',
};
export const DocumentTable = () => {
    const { data, isLoading } = useAdminDocuments();
    const deleteMutation = useDeleteDocument();
    const docs = data?.data || [];
    if (isLoading) {
        return (<div className="flex justify-center py-10">
        <Spinner />
      </div>);
    }
    if (docs.length === 0) {
        return <p className="text-text-secondary text-center py-10">No documents uploaded yet.</p>;
    }
    return (<div className="overflow-x-auto">
      <table className="min-w-full bg-surface rounded-xl overflow-hidden border border-gray-100">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Title
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Uploaded By
            </th>
            <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {docs.map((doc) => (<tr key={doc.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-text">{doc.title}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[doc.status] || ''}`}>
                  {doc.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                {doc.uploadedBy
                ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
                : 'System'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                {new Date(doc.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="sm" className="text-error hover:bg-red-50" onClick={() => {
                if (confirm('Delete this document and all its indexed data?')) {
                    deleteMutation.mutate(doc.id);
                }
            }}>
                  Delete
                </Button>
              </td>
            </tr>))}
        </tbody>
      </table>
    </div>);
};
