import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await studentService.getDashboardStats();
      setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return <Loader text="Loading dashboard..." />;

  const attendancePieData = stats
    ? [
        { name: 'Present', value: stats.todayAttendance.present },
        { name: 'Absent', value: stats.todayAttendance.absent },
        { name: 'Not Marked', value: stats.todayAttendance.total > 0 ? 0 : stats.totalStudents - stats.todayAttendance.total },
      ].filter((d) => d.value > 0)
    : [];

  const classData = stats?.classDistribution?.map((c) => ({
    class: c._id || 'Unassigned',
    students: c.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={UsersIcon}
          color="blue"
          subtitle={`${stats?.activeStudents ?? 0} active`}
        />
        <StatCard
          title="Today Present"
          value={stats?.todayAttendance?.present ?? 0}
          icon={CheckCircleIcon}
          color="green"
          subtitle={`of ${stats?.totalStudents ?? 0} students`}
        />
        <StatCard
          title="Today Absent"
          value={stats?.todayAttendance?.absent ?? 0}
          icon={XCircleIcon}
          color="red"
          subtitle="students absent today"
        />
        <StatCard
          title="Not Marked"
          value={
            (stats?.totalStudents ?? 0) - (stats?.todayAttendance?.total ?? 0)
          }
          icon={ChartBarIcon}
          color="yellow"
          subtitle="attendance pending"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class distribution bar chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Students by Class</h2>
          {classData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={classData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="class" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              No class data available
            </div>
          )}
        </div>

        {/* Today attendance pie */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Today's Attendance</h2>
          {attendancePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {attendancePieData.map((_, index) => (
                    <Cell key={index} fill={['#22c55e', '#ef4444', '#f59e0b'][index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 13 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
              <CheckCircleIcon className="h-10 w-10 text-gray-300" />
              <p>No attendance marked today</p>
              <Link to="/admin/attendance" className="text-primary-600 text-xs hover:underline">
                Mark attendance →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent test results */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Test Results</h2>
          <Link
            to="/admin/marks"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
          >
            View all <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {stats?.recentMarks?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-3 font-medium text-gray-500">Student</th>
                  <th className="text-left py-2.5 px-3 font-medium text-gray-500">Subject</th>
                  <th className="text-left py-2.5 px-3 font-medium text-gray-500">Test</th>
                  <th className="text-right py-2.5 px-3 font-medium text-gray-500">Score</th>
                  <th className="text-right py-2.5 px-3 font-medium text-gray-500">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentMarks.map((m) => {
                  const pct = ((m.marksObtained / m.maxMarks) * 100).toFixed(0);
                  return (
                    <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {m.studentId?.name}
                        <span className="ml-2 text-xs text-gray-400">{m.studentId?.rollNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{m.subject}</td>
                      <td className="py-2.5 px-3 text-gray-600">{m.testName}</td>
                      <td className="py-2.5 px-3 text-right text-gray-900">
                        {m.marksObtained}/{m.maxMarks}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            pct >= 75
                              ? 'bg-green-100 text-green-700'
                              : pct >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm py-8 text-center">No test results yet</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Add Student', to: '/admin/students', color: 'bg-blue-600', icon: '👤' },
          { label: 'Mark Attendance', to: '/admin/attendance', color: 'bg-green-600', icon: '✅' },
          { label: 'Add Marks', to: '/admin/marks', color: 'bg-purple-600', icon: '📝' },
          { label: 'View Reports', to: '/admin/reports', color: 'bg-orange-600', icon: '📊' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className={`${action.color} hover:opacity-90 transition-opacity text-white rounded-xl p-4 text-center flex flex-col items-center gap-2 shadow-sm`}
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
