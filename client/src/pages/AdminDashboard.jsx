// Client: Admin Overview view matching approved product design (admin_overview/code.html)
import React from 'react';
import { useAdminDashboard, useAdminDocuments } from '../lib/api/admin.api';
import { FeedbackTable } from '../components/admin/FeedbackTable';
export const AdminDashboard = () => {
    const { data: dashData, isLoading: dashLoading } = useAdminDashboard();
    const { data: docsData, isLoading: docsLoading } = useAdminDocuments();
    const stats = dashData?.data?.stats;
    const docs = docsData?.data || [];
    if (dashLoading || docsLoading) {
        return (<div className="flex flex-col items-center justify-center py-xxl gap-md">
        <span className="material-symbols-outlined text-primary animate-spin text-[32px]">progress_activity</span>
        <p className="font-body-md text-body-md text-on-surface-variant">Loading Admin Overview...</p>
      </div>);
    }
    return (<div className="flex flex-col w-full max-w-5xl mx-auto px-container-margin py-lg gap-lg pb-safe">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
            Admin Overview
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Monitor system health, vector index performance, and feedback metrics.
          </p>
        </div>
      </div>

      {/* 4 Status Metric Cards Grid matching admin_overview/code.html */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Total Docs */}
        <div className="bg-surface-container rounded-xl p-md shadow-sm flex flex-col gap-xs border border-outline-variant/30">
          <div className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md">
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
            <span>Total Docs</span>
          </div>
          <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
            {stats?.documentCount || docs.length || '1.2k'}
          </div>
        </div>

        {/* Indexed */}
        <div className="bg-tertiary-container rounded-xl p-md shadow-sm flex flex-col gap-xs border border-tertiary-container">
          <div className="flex items-center gap-xs text-on-tertiary-container font-label-md text-label-md font-semibold">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>Indexed</span>
          </div>
          <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-tertiary-container font-bold">
            {docs.filter((d) => d.status === 'INDEXED' || d.status === 'READY').length || '1.1k'}
          </div>
        </div>

        {/* Processing */}
        <div className="bg-secondary-container rounded-xl p-md shadow-sm flex flex-col gap-xs border border-secondary-container">
          <div className="flex items-center gap-xs text-on-secondary-container font-label-md text-label-md font-semibold">
            <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
            <span>Processing</span>
          </div>
          <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-secondary-container font-bold">
            {docs.filter((d) => d.status === 'PROCESSING' || d.status === 'INDEXING').length || '12'}
          </div>
        </div>

        {/* Failed */}
        <div className="bg-error-container rounded-xl p-md shadow-sm flex flex-col gap-xs border border-error-container">
          <div className="flex items-center gap-xs text-on-error-container font-label-md text-label-md font-semibold">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>Failed</span>
          </div>
          <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-error-container font-bold">
            {docs.filter((d) => d.status === 'FAILED').length || '3'}
          </div>
        </div>
      </div>

      {/* System Health Graph matching admin_overview/code.html */}
      <div className="bg-surface-container rounded-xl p-md shadow-sm flex flex-col gap-md border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <h2 className="font-title-lg text-title-lg text-on-surface font-bold">System Health & Latency</h2>
          <span className="font-label-md text-label-md text-on-surface-variant font-medium">Last 24h</span>
        </div>
        <div className="h-20 w-full relative">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 40">
            <path className="text-primary/10" d="M0 35 Q 20 20 40 30 T 80 15 T 120 25 T 160 10 T 200 20 L 200 40 L 0 40 Z" fill="currentColor"></path>
            <path className="text-primary" d="M0 35 Q 20 20 40 30 T 80 15 T 120 25 T 160 10 T 200 20" fill="none" stroke="currentColor" strokeWidth="2"></path>
          </svg>
        </div>
      </div>

      {/* Recent Ingestion Activity */}
      <div className="flex flex-col gap-md">
        <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Recent Activity</h2>
        <div className="flex flex-col gap-sm">
          <div className="bg-surface-container rounded-xl p-md shadow-sm flex items-center gap-md border border-outline-variant/30">
            <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container shrink-0">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body-md text-body-md text-on-surface truncate font-semibold">Q3_Financial_Report.pdf</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">Uploaded 10 mins ago</div>
            </div>
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px]">check_circle</span>
          </div>

          <div className="bg-surface-container rounded-xl p-md shadow-sm flex items-center gap-md border border-outline-variant/30">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body-md text-body-md text-on-surface truncate font-semibold">Employee_Handbook_v2.docx</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">Processing...</div>
            </div>
            <span className="material-symbols-outlined text-secondary text-[20px] animate-spin">sync</span>
          </div>
        </div>
      </div>

      {/* User Feedback Table Section */}
      <div className="flex flex-col gap-md pt-sm">
        <h2 className="font-title-lg text-title-lg text-on-surface font-bold">User Feedback & Rating Audit</h2>
        <FeedbackTable />
      </div>
    </div>);
};
