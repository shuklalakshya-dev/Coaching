import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MonthCalendar = ({ month, year, onChange }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(year);

  const canGoNext = viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear());

  return (
    <div className="w-full">
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewYear((y) => y - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-900">{viewYear}</span>
        <button
          onClick={() => setViewYear((y) => y + 1)}
          disabled={!canGoNext || viewYear >= today.getFullYear()}
          className={`p-1.5 rounded-lg transition-colors ${
            viewYear >= today.getFullYear() ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((name, i) => {
          const mNum = i + 1;
          const isFuture = viewYear > today.getFullYear() ||
            (viewYear === today.getFullYear() && mNum > today.getMonth() + 1);
          const isSelected = mNum === month && viewYear === year;
          return (
            <button
              key={name}
              disabled={isFuture}
              onClick={() => onChange(mNum, viewYear)}
              className={`py-2 rounded-xl text-xs font-medium transition-all border ${
                isSelected
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : isFuture
                  ? 'text-gray-300 border-gray-100 cursor-not-allowed'
                  : 'text-gray-700 border-gray-200 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              {name.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StudentAttendance = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await attendanceService.getByStudent(user._id, { month, year });
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [user._id, month, year]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const pieData = data
    ? [
        { name: 'Present', value: data.summary.presentDays, color: '#22c55e' },
        { name: 'Absent', value: data.summary.absentDays, color: '#ef4444' },
        { name: 'Late', value: data.summary.lateDays, color: '#f59e0b' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-500 text-sm">Track your daily attendance records</p>
      </div>

      {/* Inline Month Calendar */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Select Month</h2>
        <MonthCalendar month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        <p className="mt-3 text-center text-xs text-gray-400">Showing: <span className="font-semibold text-gray-700">{MONTHS[month - 1]} {year}</span></p>
      </div>

      {loading ? <Loader /> : data && (
        <>
          {/* Summary + Pie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stats */}
            <div className="card space-y-4">
              <h2 className="text-base font-semibold text-gray-900">{MONTHS[month - 1]} {year} Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Days', value: data.summary.totalDays, color: 'text-gray-900' },
                  { label: 'Present', value: data.summary.presentDays, color: 'text-green-600' },
                  { label: 'Absent', value: data.summary.absentDays, color: 'text-red-600' },
                  { label: 'Late', value: data.summary.lateDays, color: 'text-yellow-600' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-indigo-600">{data.summary.attendancePercentage}%</p>
                <p className="text-sm text-gray-500 mt-1">Attendance Percentage</p>
                <div className="mt-2 h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(data.summary.attendancePercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Attendance Breakdown</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No records this month</div>
              )}
            </div>
          </div>

          {/* Records list */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">{data.records.length} Attendance Records</h2>
            </div>
            {data.records.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">No records found for this month</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.records.map((r) => (
                  <div key={r._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                    {r.status === 'present' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : r.status === 'late' ? (
                      <ClockIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(r.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      {r.remarks && <p className="text-xs text-gray-400">{r.remarks}</p>}
                    </div>
                    <span className={`badge-${r.status === 'present' ? 'green' : r.status === 'late' ? 'yellow' : 'red'} capitalize`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAttendance;
