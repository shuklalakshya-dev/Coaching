import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { marksService } from '../../services';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const StudentMarks = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const fetchMarks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (month) params.month = month;
      if (filterSubject) params.subject = filterSubject;
      const { data: res } = await marksService.getByStudent(user._id, params);
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load marks');
    } finally {
      setLoading(false);
    }
  }, [user._id, month, filterSubject]);

  useEffect(() => { fetchMarks(); }, [fetchMarks]);

  const subjectBreakdown = data?.stats?.subjectBreakdown || [];
  const barData = subjectBreakdown.map((s) => ({
    subject: s.subject.length > 8 ? s.subject.slice(0, 8) + '.' : s.subject,
    percentage: parseFloat(s.percentage),
  }));

  const getBarColor = (pct) => pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Marks</h1>
        <p className="text-gray-500 text-sm">View all your test results and performance</p>
      </div>

      {/* Overall stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tests', value: data.stats.totalTests, color: 'text-blue-600' },
            { label: 'Avg Score', value: `${data.stats.averagePercentage}%`, color: 'text-indigo-600' },
            { label: 'Total Obtained', value: data.stats.totalObtained, color: 'text-green-600' },
            { label: 'Total Max', value: data.stats.totalMax, color: 'text-gray-600' },
          ].map((s) => (
            <div key={s.label} className="card text-center py-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input-field w-auto">
              <option value="">All months</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              placeholder="Filter by subject..."
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="input-field w-auto"
            />
          </div>
        </div>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Subject bar chart */}
          {barData.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Subject-wise Performance</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]} name="Score %">
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.percentage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Marks table */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">{data?.marks?.length || 0} Test Records</h2>
            </div>
            {!data?.marks?.length ? (
              <p className="text-center text-gray-400 text-sm py-10">No test records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Test Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Score</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">%</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.marks.map((m) => {
                      const pct = ((m.marksObtained / m.maxMarks) * 100).toFixed(0);
                      return (
                        <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{m.testName}</td>
                          <td className="py-3 px-4">
                            <span className="badge-blue">{m.subject}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">{m.marksObtained}/{m.maxMarks}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              pct >= 75 ? 'bg-green-100 text-green-700'
                              : pct >= 50 ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                            }`}>{pct}%</span>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{format(new Date(m.date), 'MMM d, yyyy')}</td>
                          <td className="py-3 px-4 text-gray-400 text-xs">{m.remarks || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentMarks;
