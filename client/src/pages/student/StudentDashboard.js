import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, marksService, reportService } from '../../services';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';
import {
  UserCircleIcon, CalendarDaysIcon, DocumentTextIcon,
  ChartBarIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ attendance: null, marks: null, report: null });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    try {
      const [attRes, marksRes, reportRes] = await Promise.allSettled([
        attendanceService.getByStudent(user._id),
        marksService.getByStudent(user._id),
        reportService.getByStudent(user._id, { month, year }),
      ]);

      setData({
        attendance: attRes.status === 'fulfilled' ? attRes.value.data.data : null,
        marks: marksRes.status === 'fulfilled' ? marksRes.value.data.data : null,
        report: reportRes.status === 'fulfilled' ? reportRes.value.data.data : null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Loader text="Loading your dashboard..." />;

  const attendance = data.attendance?.summary;
  const recentMarks = data.marks?.marks?.slice(0, 5) || [];
  const report = data.report?.report;

  // Chart data: last 8 test scores
  const chartData = (data.marks?.marks || [])
    .slice(0, 8)
    .reverse()
    .map((m) => ({
      name: `${m.subject.slice(0, 6)}.`,
      score: parseFloat(((m.marksObtained / m.maxMarks) * 100).toFixed(0)),
    }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-600 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} className="h-14 w-14 rounded-xl object-cover border-2 border-white/30" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl font-bold">{user.name?.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="text-indigo-100 text-sm">Welcome back,</p>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-indigo-200 text-xs mt-0.5">{user.rollNumber} · Class {user.class || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Attendance"
          value={`${attendance?.attendancePercentage ?? 0}%`}
          icon={CalendarDaysIcon}
          color="green"
          subtitle={`${attendance?.presentDays ?? 0} / ${attendance?.totalDays ?? 0} days`}
        />
        <StatCard
          title="Tests Taken"
          value={data.marks?.stats?.totalTests ?? 0}
          icon={DocumentTextIcon}
          color="blue"
          subtitle="total tests"
        />
        <StatCard
          title="Avg Score"
          value={`${data.marks?.stats?.averagePercentage ?? 0}%`}
          icon={ChartBarIcon}
          color="purple"
          subtitle="overall performance"
        />
        <StatCard
          title="This Month"
          value={report?.performanceGrade ?? '—'}
          icon={UserCircleIcon}
          color="indigo"
          subtitle={`${report?.totalTests ?? 0} tests, ${report?.attendancePercentage ?? 0}% att.`}
        />
      </div>

      {/* Charts + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Performance Trend</h2>
            <Link to="/student/marks" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Score %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No test data available
            </div>
          )}
        </div>

        {/* Subject breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Subject Performance</h2>
            <Link to="/student/marks" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Details <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data.marks?.stats?.subjectBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {data.marks.stats.subjectBreakdown.slice(0, 5).map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{s.subject}</span>
                    <span className={`font-semibold ${
                      s.percentage >= 75 ? 'text-green-600' : s.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{s.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.percentage >= 75 ? 'bg-green-500' : s.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(s.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No subject data</div>
          )}
        </div>
      </div>

      {/* Recent tests */}
      {recentMarks.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Tests</h2>
            <Link to="/student/marks" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentMarks.map((m) => {
              const pct = ((m.marksObtained / m.maxMarks) * 100).toFixed(0);
              return (
                <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    pct >= 75 ? 'bg-green-100 text-green-700'
                    : pct >= 50 ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }`}>{pct}%</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{m.testName}</p>
                    <p className="text-xs text-gray-500">{m.subject} · {format(new Date(m.date), 'MMM d, yyyy')}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{m.marksObtained}/{m.maxMarks}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'My Profile', to: '/student/profile', color: 'bg-indigo-600', icon: '👤' },
          { label: 'Attendance', to: '/student/attendance', color: 'bg-green-600', icon: '📅' },
          { label: 'My Marks', to: '/student/marks', color: 'bg-blue-600', icon: '📊' },
          { label: 'Report', to: '/student/report', color: 'bg-purple-600', icon: '📋' },
        ].map((a) => (
          <Link key={a.label} to={a.to} className={`${a.color} hover:opacity-90 transition-opacity text-white rounded-xl p-4 text-center flex flex-col items-center gap-2 shadow-sm`}>
            <span className="text-2xl">{a.icon}</span>
            <span className="text-sm font-medium">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
