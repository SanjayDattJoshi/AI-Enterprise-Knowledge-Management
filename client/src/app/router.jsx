// Client: Application router with protected routes
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Search } from '../pages/Search';
import { History } from '../pages/History';
import { ConversationView } from '../pages/ConversationView';
import { AdminDashboard } from '../pages/AdminDashboard';
import { Documents } from '../pages/Documents';
import { Users } from '../pages/Users';
import { Settings } from '../pages/Settings';
import { useAuthStore } from '../features/auth/auth.store';
// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!isAuthenticated)
        return <Navigate to="/login" replace/>;
    return <>{children}</>;
};
export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/app/search" replace/>,
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: '/app',
        element: (<ProtectedRoute>
        <Layout />
      </ProtectedRoute>),
        children: [
            { index: true, element: <Navigate to="search" replace/> },
            { path: 'search', element: <Search /> },
            { path: 'history', element: <History /> },
            { path: 'conversations/:id', element: <ConversationView /> },
            { path: 'documents', element: <Documents /> },
            { path: 'admin/overview', element: <AdminDashboard /> },
            { path: 'admin/dashboard', element: <Navigate to="/app/admin/overview" replace/> },
            { path: 'admin/users', element: <Users /> },
            { path: 'settings', element: <Settings /> },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/app/search" replace/>,
    },
]);
