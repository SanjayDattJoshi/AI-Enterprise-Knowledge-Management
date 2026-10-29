// Client: User Management view matching approved design (users/code.html)

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/client';

export const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localUsers, setLocalUsers] = useState<any[]>([
    {
      id: '1',
      name: 'Eleanor Jenkins',
      email: 'e.jenkins@acme.corp',
      role: 'ADMIN',
      status: 'active',
      initials: 'EJ',
    },
    {
      id: '2',
      name: 'Marcus Thorne',
      email: 'm.thorne@acme.corp',
      role: 'EMPLOYEE',
      status: 'active',
      initials: 'MT',
    },
    {
      id: '3',
      name: 'Sarah Lin',
      email: 's.lin@acme.corp',
      role: 'EMPLOYEE',
      status: 'disabled',
      initials: 'SL',
    },
    {
      id: '4',
      name: 'Dr. Amina Rossi',
      email: 'a.rossi@acme.corp',
      role: 'ADMIN',
      status: 'active',
      initials: 'AR',
    },
  ]);

  const { data: usersRes } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/admin/users');
        if (res.data && res.data.length > 0) {
          setLocalUsers(
            res.data.map((u: any) => ({
              id: u.id,
              name: `${u.firstName} ${u.lastName}`,
              email: u.email,
              role: u.role,
              status: u.status?.toLowerCase() || 'active',
              initials: `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase(),
            }))
          );
        }
        return res.data;
      } catch {
        return null;
      }
    },
  });

  const toggleUserStatus = (id: string) => {
    setLocalUsers((prev) =>
      prev.map((user) => {
        if (user.id === id) {
          return {
            ...user,
            status: user.status === 'active' ? 'disabled' : 'active',
          };
        }
        return user;
      })
    );
  };

  const filteredUsers = localUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-container-margin py-lg gap-lg pb-safe">
      {/* Header Search & Actions matching users/code.html */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-md bg-surface sticky top-0 z-10 py-xs">
        <div className="flex items-center gap-md w-full relative">
          <span className="material-symbols-outlined text-outline absolute left-md">search</span>
          <input
            className="w-full bg-surface-container-highest text-on-surface placeholder:text-outline h-12 pl-12 pr-md rounded-full font-body-md shadow-inner focus:outline-none focus:ring-2 focus:ring-primary transition-shadow border border-outline-variant/30"
            placeholder="Search users by name or email..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            const name = prompt('Enter new user full name:');
            const email = prompt('Enter new user email:');
            if (name && email) {
              setLocalUsers((prev) => [
                ...prev,
                {
                  id: `${Date.now()}`,
                  name,
                  email,
                  role: 'EMPLOYEE',
                  status: 'active',
                  initials: name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase(),
                },
              ]);
            }
          }}
          className="h-12 px-lg bg-primary text-on-primary rounded-full font-label-md text-label-md flex items-center justify-center gap-xs shadow-md whitespace-nowrap active:scale-95 transition-transform hover:bg-on-primary-fixed shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add User</span>
        </button>
      </div>

      {/* User Card List */}
      <div className="flex flex-col gap-md">
        {filteredUsers.map((user) => {
          const isActive = user.status === 'active';

          return (
            <div
              key={user.id}
              className={`bg-surface-container-lowest rounded-xl p-md flex flex-col gap-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden border border-outline-variant/30 ${
                !isActive ? 'opacity-60 grayscale-[0.5]' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-title-lg text-sm font-bold shadow-sm">
                    {user.initials}
                  </div>
                  <div className="flex flex-col">
                    <h3
                      className={`font-title-lg text-title-lg text-on-surface font-bold ${
                        !isActive ? 'line-through decoration-on-surface-variant/50' : ''
                      }`}
                    >
                      {user.name}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-xs">
                  <span
                    className={`px-sm py-xs rounded-sm font-label-md text-xs font-bold tracking-wider ${
                      user.role === 'ADMIN'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {user.role}
                  </span>
                  <div className="flex items-center gap-xs mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-tertiary-fixed-dim' : 'bg-error'
                      }`}
                    />
                    <span
                      className={`font-label-md text-xs uppercase font-semibold ${
                        isActive ? 'text-on-surface-variant' : 'text-error'
                      }`}
                    >
                      {isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-outline-variant/30 mt-sm mb-xs" />

              <div className="flex justify-end gap-md">
                <button
                  onClick={() => {
                    const newRole = user.role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN';
                    setLocalUsers((prev) =>
                      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
                    );
                  }}
                  className="text-secondary font-label-md text-xs font-semibold hover:underline"
                >
                  Change Role ({user.role})
                </button>

                <button
                  onClick={() => toggleUserStatus(user.id)}
                  className={`font-label-md text-xs font-semibold hover:underline ${
                    isActive ? 'text-error' : 'text-secondary'
                  }`}
                >
                  {isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
