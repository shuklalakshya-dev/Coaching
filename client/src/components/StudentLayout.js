import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const studentNav = [
  { path: '/student/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/student/profile', label: 'My Profile', icon: UserIcon },
  { path: '/student/attendance', label: 'Attendance', icon: CalendarDaysIcon },
  { path: '/student/marks', label: 'My Marks', icon: DocumentTextIcon },
  { path: '/student/report', label: 'Monthly Report', icon: ChartBarIcon },
];

const StudentLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="p-2 bg-indigo-600 rounded-xl">
          <AcademicCapIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-sm leading-tight">Student Portal</h1>
          <p className="text-xs text-gray-400">GYANRICH</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {studentNav.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-600">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.rollNumber || 'Student'}</p>
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
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Bars3Icon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">Student Portal</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default StudentLayout;
