import React from 'react';
import { useFeedbackList } from '../../lib/api/feedback.api';
import { formatDate } from '../../lib/utils';

export const FeedbackTable: React.FC = () => {
  const { data, isLoading } = useFeedbackList();
  const feedbacks = (data as any)?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <span className="material-symbols-outlined text-primary animate-spin text-[20px]">progress_activity</span>
        <span className="text-xs text-on-surface-variant">Loading feedback...</span>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-6 text-center text-xs text-on-surface-variant">
        No user feedback submitted yet. Feedback submitted by employees will appear here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-xs">
      <table className="min-w-full divide-y divide-outline-variant/30 text-left">
        <thead className="bg-surface-container-low">
          <tr>
            <th className="px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              User
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Rating
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Comment
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Answer Excerpt
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20 bg-surface-container-lowest">
          {feedbacks.map((fb: any) => (
            <tr key={fb.id} className="hover:bg-surface-container/40 transition-colors text-xs">
              <td className="px-5 py-3.5 whitespace-nowrap font-medium text-on-surface">
                {fb.user
                  ? `${fb.user.firstName || ''} ${fb.user.lastName || ''}`.trim() || 'Employee'
                  : 'Employee'}
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md font-semibold ${
                    fb.rating === 'HELPFUL'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {fb.rating === 'HELPFUL' ? 'thumb_up' : 'thumb_down'}
                  </span>
                  <span>{fb.rating === 'HELPFUL' ? 'Helpful' : 'Not Helpful'}</span>
                </span>
              </td>
              <td className="px-5 py-3.5 text-on-surface-variant max-w-xs truncate">
                {fb.comment || '—'}
              </td>
              <td className="px-5 py-3.5 text-on-surface-variant max-w-xs truncate italic">
                "{fb.message?.content ? fb.message.content.substring(0, 55) + '...' : '—'}"
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap text-on-surface-variant">
                {formatDate(fb.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
