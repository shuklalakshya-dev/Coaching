import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Legend,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const GRADE_COLORS = { 'A+': '#22c55e', A: '#4ade80', 'B+': '#60a5fa', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' };

const REPORT_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half-yearly', label: 'Half-Yearly' },
  { value: 'yearly', label: 'Yearly' },
];

const QUARTERS = [
  { value: 1, label: 'Q1 — Jan to Mar' },
  { value: 2, label: 'Q2 — Apr to Jun' },
  { value: 3, label: 'Q3 — Jul to Sep' },
  { value: 4, label: 'Q4 — Oct to Dec' },
];

const HALVES = [
  { value: 1, label: 'H1 — Jan to Jun' },
  { value: 2, label: 'H2 — Jul to Dec' },
];

const getPeriodRange = (reportType, month, quarter, half) => {
  switch (reportType) {
    case 'quarterly': return { startMonth: (quarter - 1) * 3 + 1, endMonth: quarter * 3 };
    case 'half-yearly': return { startMonth: half === 1 ? 1 : 7, endMonth: half === 1 ? 6 : 12 };
    case 'yearly': return { startMonth: 1, endMonth: 12 };
    default: return { startMonth: month, endMonth: month };
  }
};

const getPeriodLabel = (reportType, month, quarter, half, year) => {
  switch (reportType) {
    case 'quarterly': return `Q${quarter} ${year}  (${MONTHS[(quarter - 1) * 3]} – ${MONTHS[quarter * 3 - 1]})`;
    case 'half-yearly': return `H${half} ${year}  (${half === 1 ? 'Jan' : 'Jul'} – ${half === 1 ? 'Jun' : 'Dec'})`;
    case 'yearly': return `Full Year ${year}`;
    default: return `${MONTHS[month - 1]} ${year}`;
  }
};

const GRADE_MSG = {
  'A+': 'Outstanding performance! Keep it up! 🌟',
  A: 'Excellent work! You\'re doing great! 🎉',
  'B+': 'Very good! Small improvements will make it A+! 💪',
  B: 'Good performance. Keep pushing yourself! 👍',
  C: 'Average performance. Focus more on studies. 📚',
  D: 'Below average. Serious effort needed. 🔔',
  F: 'Failing. Please seek help from your teacher. ⚠️',
};

const StudentReport = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [half, setHalf] = useState(new Date().getMonth() < 6 ? 1 : 2);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { startMonth, endMonth } = getPeriodRange(reportType, month, quarter, half);
      const params = reportType === 'monthly'
        ? { month, year }
        : { startMonth, endMonth, year };
      const { data } = await reportService.getByStudent(user._id, params);
      setReportData(data.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [user._id, reportType, month, quarter, half, year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const grade = reportData?.report?.performanceGrade;
  const gradeColor = GRADE_COLORS[grade] || '#94a3b8';
  const gradeMsg = GRADE_MSG[grade] || '';

  const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#06b6d4','#f43f5e','#84cc16'];

  const pieData = reportData?.subjectBreakdown?.map((s) => ({
    name: s.subject,
    value: parseFloat(s.percentage),
  })) || [];

  const barData = reportData?.marksRecords?.map((m) => ({
    test: m.testName.length > 12 ? m.testName.slice(0, 12) + '.' : m.testName,
    score: parseFloat(((m.marksObtained / m.maxMarks) * 100).toFixed(0)),
    subject: m.subject,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Academic Report</h1>
        <p className="text-gray-500 text-sm">View your monthly, quarterly, half-yearly or yearly academic report</p>
      </div>

      {/* Period selector */}
      <div className="card space-y-4">
        {/* Report type tabs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <div className="flex gap-2 flex-wrap">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setReportType(rt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  reportType === rt.value
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period pickers */}
        <div className="flex flex-wrap gap-4 items-end">
          {reportType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="input-field w-auto">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
          )}
          {reportType === 'quarterly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
              <select value={quarter} onChange={(e) => setQuarter(parseInt(e.target.value))} className="input-field w-auto">
                {QUARTERS.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>
          )}
          {reportType === 'half-yearly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Half</label>
              <select value={half} onChange={(e) => setHalf(parseInt(e.target.value))} className="input-field w-auto">
                {HALVES.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-field w-auto">
              {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? <Loader /> : reportData ? (
        <div className="space-y-6">
          {/* Grade card */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{ background: `linear-gradient(135deg, ${gradeColor}dd, ${gradeColor}99)` }}
          >
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-white/20 flex flex-col items-center justify-center">
                <span className="text-3xl font-black">{grade}</span>
                <span className="text-xs opacity-80">Grade</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{getPeriodLabel(reportType, month, quarter, half, year)}</h2>
                <p className="opacity-90 mt-1 text-sm">{gradeMsg}</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Tests Taken', value: reportData.report.totalTests, icon: '📝' },
              { label: 'Average Marks', value: `${reportData.report.averageMarks}%`, icon: '📊' },
              { label: 'Attendance', value: `${reportData.report.attendancePercentage}%`, icon: '📅' },
              { label: 'Days Present', value: reportData.report.presentDays, icon: '✅' },
              { label: 'Days Absent', value: reportData.report.absentDays, icon: '❌' },
              { label: 'Working Days', value: reportData.report.totalDays, icon: '🗓️' },
            ].map((s) => (
              <div key={s.label} className="card text-center py-4">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Test Scores</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="test" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n, props) => [`${v}% (${props.payload.subject})`, 'Score']} contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="score" fill="#6366f1" radius={[3, 3, 0, 0]} name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No tests for this period</p>
              )}
            </div>

            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Subject-wise Performance (%)</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={true}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No subject data</p>
              )}
            </div>
          </div>

          {/* Subject breakdown */}
          {reportData.subjectBreakdown?.length > 0 && (
            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Subject Performance</h3>
              <div className="space-y-3">
                {reportData.subjectBreakdown.map((s) => (
                  <div key={s.subject}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium text-gray-800">{s.subject}</span>
                      <span className="text-gray-500 text-xs">{s.obtained}/{s.max} ({s.tests} tests)</span>
                      <span className={`font-bold ${s.percentage >= 75 ? 'text-green-600' : s.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {s.percentage}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.percentage >= 75 ? 'bg-green-500' : s.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(s.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remarks */}
          {reportData.report.remarks && (
            <div className="card bg-blue-50 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Teacher's Remarks</h3>
              <p className="text-blue-800 text-sm">{reportData.report.remarks}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-3">📋</p>
          <p>No report available for {getPeriodLabel(reportType, month, quarter, half, year)}</p>
          <p className="text-xs mt-1">Reports are generated from attendance and test data entered by your admin</p>
        </div>
      )}
    </div>
  );
};

export default StudentReport;
