// Client: Admin stats card component
import React from 'react';
export const StatsCard = ({ title, value }) => {
    return (<div className="bg-surface p-6 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
      <p className="text-3xl font-bold text-text">{value}</p>
    </div>);
};
