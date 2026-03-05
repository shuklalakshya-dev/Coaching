import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Shared pages
import LoginPage from './pages/LoginPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import AttendancePage from './pages/admin/AttendancePage';
import MarksEntry from './pages/admin/MarksEntry';
import ReportsPage from './pages/admin/ReportsPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import ProfilePage from './pages/student/ProfilePage';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentMarks from './pages/student/StudentMarks';
import StudentReport from './pages/student/StudentReport';

// Layouts
import AdminLayout from './components/AdminLayout';
import StudentLayout from './components/StudentLayout';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontSize: '14px', maxWidth: '380px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute role="admin">
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="students" element={<StudentManagement />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="marks" element={<MarksEntry />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </PrivateRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/*"
            element={
              <PrivateRoute role="student">
                <StudentLayout>
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="attendance" element={<StudentAttendance />} />
                    <Route path="marks" element={<StudentMarks />} />
                    <Route path="report" element={<StudentReport />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </StudentLayout>
              </PrivateRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
