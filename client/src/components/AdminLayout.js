import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const adminNav = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/admin/students', label: 'Students', icon: UsersIcon },
  { path: '/admin/attendance', label: 'Attendance', icon: CalendarDaysIcon },
  { path: '/admin/marks', label: 'Test Marks', icon: DocumentTextIcon },
  { path: '/admin/reports', label: 'Reports', icon: ChartBarIcon },
];

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="p-2 bg-primary-600 rounded-xl">
          <AcademicCapIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-sm leading-tight">GYANRICH</h1>
          <p className="text-xs text-gray-400">Management System</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNav.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-600">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Bars3Icon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-gray-900">GYANRICH</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
