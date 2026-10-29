// Client: Source citation card

import React from 'react';

interface SourceCardProps {
  title: string;
  excerpt: string;
  label: string;
}

export const SourceCard: React.FC<SourceCardProps> = ({ title, excerpt, label }) => {
  return (
    <div className="bg-surface p-4 rounded-lg border border-gray-100 hover:border-primary cursor-pointer transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-1 rounded">
          {label}
        </span>
        <span className="text-xs text-text-secondary truncate ml-2">{title}</span>
      </div>
      <p className="text-sm text-text line-clamp-3">{excerpt}</p>
    </div>
  );
};
