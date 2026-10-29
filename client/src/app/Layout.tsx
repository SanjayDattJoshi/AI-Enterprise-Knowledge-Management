// Client: Authenticated app layout with Cognitive Enterprise Design System

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';

export const Layout: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'User Management';
    if (path.includes('/admin/overview') || path.includes('/admin')) return 'Admin Overview';
    if (path.includes('/history')) return 'Search History';
    if (path.includes('/documents')) return 'Document Ingestion';
    if (path.includes('/settings')) return 'Settings';
    return 'KNOWLEDGE';
  };

  const getInitials = () => {
    const first = user?.firstName?.[0] || 'U';
    const last = user?.lastName?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Top App Header with Blur Backdrop */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-container-margin flex items-center justify-between">
          {/* Logo & Section Title */}
          <div className="flex items-center gap-sm cursor-pointer" onClick={() => navigate('/app/search')}>
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[20px]">hub</span>
            </div>
            <span className="font-title-lg text-title-lg text-on-surface tracking-tight font-bold">
              {getPageTitle()}
            </span>
          </div>

          {/* User Profile Action & Search Trigger */}
          <div className="flex items-center gap-md">
            <button
              onClick={() => navigate('/app/search')}
              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              title="Search"
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-xs shadow-sm hover:ring-2 hover:ring-primary/20 transition-all"
                title="Profile Menu"
              >
                {user ? getInitials() : <span className="material-symbols-outlined text-[18px]">person</span>}
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_rgba(15,23,42,0.12)] p-sm z-50 border border-outline-variant/40 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-sm border-b border-outline-variant/30">
                    <p className="font-title-lg text-sm font-semibold text-on-surface">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="font-body-sm text-xs text-on-surface-variant truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary-container text-on-primary-container rounded-full text-[10px] font-semibold uppercase tracking-wider">
                      {user?.role || 'MEMBER'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/app/settings');
                      }}
                      className="w-full flex items-center gap-sm px-sm py-2 rounded-lg text-body-sm text-on-surface hover:bg-surface-container transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-sm px-sm py-2 rounded-lg text-body-sm text-error hover:bg-error-container/30 transition-colors text-left font-medium"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Responsive Desktop Sidebar & Content */}
      <div className="flex flex-1 pt-16 pb-20 md:pb-0">
        {/* Desktop Sidebar Navigation */}
        <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/40 p-lg hidden md:flex flex-col justify-between shrink-0 fixed top-16 bottom-0 left-0 z-30">
          <nav className="flex flex-col gap-xs">
            <NavLink
              to="/app/search"
              className={({ isActive }) =>
                `flex items-center gap-md px-md py-3 rounded-xl font-label-md transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Search</span>
            </NavLink>

            <NavLink
              to="/app/history"
              className={({ isActive }) =>
                `flex items-center gap-md px-md py-3 rounded-xl font-label-md transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
              <span>History</span>
            </NavLink>

            <NavLink
              to="/app/documents"
              className={({ isActive }) =>
                `flex items-center gap-md px-md py-3 rounded-xl font-label-md transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">database</span>
              <span>Documents</span>
            </NavLink>

            <NavLink
              to="/app/settings"
              className={({ isActive }) =>
                `flex items-center gap-md px-md py-3 rounded-xl font-label-md transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Settings</span>
            </NavLink>

            {user?.role === 'ADMIN' && (
              <div className="pt-4 mt-2 border-t border-outline-variant/30 flex flex-col gap-xs">
                <span className="font-label-md text-[11px] uppercase tracking-wider text-outline px-md block mb-1">
                  Administration
                </span>

                <NavLink
                  to="/app/admin/overview"
                  className={({ isActive }) =>
                    `flex items-center gap-md px-md py-2.5 rounded-xl font-label-md transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">dashboard</span>
                  <span>Overview</span>
                </NavLink>

                <NavLink
                  to="/app/admin/users"
                  className={({ isActive }) =>
                    `flex items-center gap-md px-md py-2.5 rounded-xl font-label-md transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">group</span>
                  <span>Users</span>
                </NavLink>
              </div>
            )}
          </nav>

          <div className="p-md bg-surface-container-low rounded-xl border border-outline-variant/40">
            <div className="flex items-center gap-sm text-label-md font-semibold text-secondary">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Cognitive Enterprise</span>
            </div>
            <p className="font-body-sm text-[11px] text-on-surface-variant mt-1">Enterprise Vector RAG v1.0</p>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 md:ml-64 w-full min-h-[calc(100vh-4rem)] bg-surface">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar matching design */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-16 px-md">
          <NavLink
            to="/app/search"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-xs w-16 transition-colors ${
                isActive ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined">search</span>
            <span className="font-label-md text-label-md">Search</span>
          </NavLink>

          <NavLink
            to="/app/history"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-xs w-16 transition-colors ${
                isActive ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined">history</span>
            <span className="font-label-md text-label-md">History</span>
          </NavLink>

          <NavLink
            to="/app/documents"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-xs w-16 transition-colors ${
                isActive ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined">database</span>
            <span className="font-label-md text-label-md">Sources</span>
          </NavLink>

          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-xs w-16 transition-colors ${
                isActive ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
