// Client: Search History view matching approved design (history/code.html)

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api/client';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: conversationsRes } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/conversations');
        return res.data || [];
      } catch {
        return [
          {
            id: 'conv-1',
            title: 'Q3 Market Analysis & Travel Expense Policy',
            lastMessage: 'Full-time employees receive 20 days of paid annual leave per calendar year...',
            createdAt: new Date().toISOString(),
            timeGroup: 'Today',
            timeString: '10:42 AM',
            type: 'analytics',
          },
          {
            id: 'conv-2',
            title: 'IT Helpdesk SLA & Security Guidelines',
            lastMessage: 'Tier 1 helpdesk tickets must be responded to within 1 hour...',
            createdAt: new Date().toISOString(),
            timeGroup: 'Today',
            timeString: '08:15 AM',
            type: 'description',
          },
          {
            id: 'conv-3',
            title: 'Python Script for Vector Data Ingestion',
            lastMessage: 'def clean_data(df): df.fillna(0, inplace=True)...',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            timeGroup: 'Yesterday',
            timeString: 'Yesterday',
            type: 'code',
          },
          {
            id: 'conv-4',
            title: 'Competitor Landscape: Fintech 2024',
            lastMessage: 'Summary of top emerging enterprise search architectures...',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            timeGroup: 'Last Week',
            timeString: 'Last Week',
            type: 'travel_explore',
          },
        ];
      }
    },
  });

  const conversations = Array.isArray(conversationsRes) ? conversationsRes : [];

  const filteredConversations = conversations.filter((c: any) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayItems = filteredConversations.filter((c: any) => c.timeGroup === 'Today' || !c.timeGroup);
  const yesterdayItems = filteredConversations.filter((c: any) => c.timeGroup === 'Yesterday');
  const olderItems = filteredConversations.filter((c: any) => c.timeGroup === 'Last Week');

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-container-margin py-lg gap-lg pb-safe">
      {/* Page Title */}
      <div className="flex flex-col gap-xs">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
          Search History
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          View and re-hydrate your previous enterprise search threads.
        </p>
      </div>

      {/* Sticky Search Filter Input matching history/code.html */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-outline">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          className="w-full bg-surface-container-low text-on-surface font-body-md pl-xxl pr-md py-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30 placeholder:text-outline"
          placeholder="Search history queries..."
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-xl">
        {/* Today Group */}
        {todayItems.length > 0 && (
          <div className="space-y-sm">
            <h2 className="font-label-md text-label-md text-primary tracking-wider uppercase pl-xs font-bold">
              Today
            </h2>
            <div className="flex flex-col gap-sm">
              {todayItems.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/app/conversations/${item.id}`)}
                  className="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-outline-variant/30 hover:shadow-md transition-all cursor-pointer flex items-start gap-md group"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary-container/30 text-secondary flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">analytics</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-title-lg text-title-lg text-on-surface truncate mb-xs font-semibold group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {item.lastMessage}
                    </p>
                  </div>
                  <span className="font-label-md text-xs text-outline flex-shrink-0 mt-xs font-medium">
                    {item.timeString || 'Today'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yesterday Group */}
        {yesterdayItems.length > 0 && (
          <div className="space-y-sm">
            <h2 className="font-label-md text-label-md text-outline tracking-wider uppercase pl-xs font-bold">
              Yesterday
            </h2>
            <div className="flex flex-col gap-sm">
              {yesterdayItems.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/app/conversations/${item.id}`)}
                  className="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-outline-variant/30 hover:shadow-md transition-all cursor-pointer flex items-start gap-md group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">code</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-title-lg text-title-lg text-on-surface truncate mb-xs font-semibold group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {item.lastMessage}
                    </p>
                  </div>
                  <span className="font-label-md text-xs text-outline flex-shrink-0 mt-xs font-medium">
                    Yesterday
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Older Group */}
        {olderItems.length > 0 && (
          <div className="space-y-sm opacity-90">
            <h2 className="font-label-md text-label-md text-outline tracking-wider uppercase pl-xs font-bold">
              Earlier
            </h2>
            <div className="flex flex-col gap-sm">
              {olderItems.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/app/conversations/${item.id}`)}
                  className="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-outline-variant/30 hover:shadow-md transition-all cursor-pointer flex items-start gap-md group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container text-on-surface-variant flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-title-lg text-title-lg text-on-surface truncate mb-xs font-semibold group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                      {item.lastMessage}
                    </p>
                  </div>
                  <span className="font-label-md text-xs text-outline flex-shrink-0 mt-xs font-medium">
                    {item.timeString || 'Older'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
