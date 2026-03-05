import React, { useEffect, useState, useCallback } from 'react';
import { reportService, studentService } from '../../services';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const GRADE_COLORS = { 'A+': '#22c55e', A: '#4ade80', 'B+': '#60a5fa', B: '#93c5fd', C: '#fbbf24', D: '#fb923c', F: '#f87171' };

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
    case 'yearly': return `Full Year ${year}  (Jan – Dec)`;
    default: return `${MONTHS[month - 1]} ${year}`;
  }
};

const ReportsPage = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportType, setReportType] = useState('monthly');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [half, setHalf] = useState(new Date().getMonth() < 6 ? 1 : 2);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await studentService.getAll({ limit: 200 });
      setStudents(data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleGenerate = async () => {
    if (!selectedStudent) { toast.error('Please select a student'); return; }
    setGenerating(true);
    setLoading(true);
    try {
      const { startMonth, endMonth } = getPeriodRange(reportType, month, quarter, half);
      const params = reportType === 'monthly'
        ? { month, year }
        : { startMonth, endMonth, year };
      const { data } = await reportService.getByStudent(selectedStudent, params);
      setReportData(data.data);
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const grade = reportData?.report?.performanceGrade;
  const gradeColor = GRADE_COLORS[grade] || '#94a3b8';

  const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f43f5e','#84cc16'];

  // Pie chart data from subject breakdown (value = percentage obtained)
  const pieData = reportData?.subjectBreakdown?.map((s) => ({
    name: s.subject,
    value: parseFloat(s.percentage),
  })) || [];

  // Monthly performance bar data (marks per test)
  const barData = reportData?.marksRecords?.map((m) => ({
    test: `${m.testName.slice(0, 10)}...`,
    obtained: m.marksObtained,
    max: m.maxMarks,
    pct: parseFloat(((m.marksObtained / m.maxMarks) * 100).toFixed(0)),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Generate monthly, quarterly, half-yearly or yearly student reports</p>
      </div>

      {/* Controls */}
      <div className="card space-y-4">
        {/* Row 1: Student + Report Type */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => { setSelectedStudent(e.target.value); setReportData(null); }}
              className="input-field"
            >
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <div className="flex gap-2 flex-wrap">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => { setReportType(rt.value); setReportData(null); }}
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
        </div>

        {/* Row 2: Period selectors + Generate */}
        <div className="flex flex-wrap gap-4 items-end">
          {reportType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="input-field">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
          )}
          {reportType === 'quarterly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
              <select value={quarter} onChange={(e) => setQuarter(parseInt(e.target.value))} className="input-field">
                {QUARTERS.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>
          )}
          {reportType === 'half-yearly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Half</label>
              <select value={half} onChange={(e) => setHalf(parseInt(e.target.value))} className="input-field">
                {HALVES.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-field">
              {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {loading && <Loader />}

      {reportData && !loading && (
        <div className="space-y-6">
          {/* Student header */}
          <div className="card">
            <div className="flex items-center gap-4 flex-wrap">
              {reportData.student?.profilePhoto ? (
                <img src={reportData.student.profilePhoto} alt={reportData.student.name} className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600">{reportData.student?.name?.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{reportData.student?.name}</h2>
                <p className="text-sm text-gray-500">{reportData.student?.rollNumber} · Class {reportData.student?.class}</p>
                <p className="text-sm text-gray-400">{getPeriodLabel(reportType, month, quarter, half, year)} Report</p>
              </div>
              <div className="text-center">
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                  style={{ backgroundColor: gradeColor }}
                >
                  {grade}
                </div>
                <p className="text-xs text-gray-400 mt-1">Grade</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Tests', value: reportData.report.totalTests, color: 'text-blue-600' },
              { label: 'Avg Marks', value: `${reportData.report.averageMarks}%`, color: 'text-purple-600' },
              { label: 'Attendance', value: `${reportData.report.attendancePercentage}%`, color: 'text-green-600' },
              { label: 'Days Present', value: `${reportData.report.presentDays}/${reportData.report.totalDays}`, color: 'text-orange-600' },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test performance bar */}
            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Test Performance (%)</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="test" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="pct" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No test data for this period</p>
              )}
            </div>

            {/* Subject pie */}
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

          {/* Subject breakdown table */}
          {reportData.subjectBreakdown?.length > 0 && (
            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Subject Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="text-left pb-2 pr-4 font-medium text-gray-500">Subject</th>
                      <th className="text-right pb-2 px-4 font-medium text-gray-500">Tests</th>
                      <th className="text-right pb-2 px-4 font-medium text-gray-500">Obtained</th>
                      <th className="text-right pb-2 px-4 font-medium text-gray-500">Maximum</th>
                      <th className="text-right pb-2 pl-4 font-medium text-gray-500">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.subjectBreakdown.map((s) => (
                      <tr key={s.subject}>
                        <td className="py-2.5 pr-4 font-medium text-gray-900">{s.subject}</td>
                        <td className="py-2.5 px-4 text-right text-gray-600">{s.tests}</td>
                        <td className="py-2.5 px-4 text-right text-gray-600">{s.obtained}</td>
                        <td className="py-2.5 px-4 text-right text-gray-600">{s.max}</td>
                        <td className="py-2.5 pl-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.percentage >= 75 ? 'bg-green-100 text-green-700'
                            : s.percentage >= 50 ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }`}>{s.percentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!reportData && !loading && selectedStudent && (
        <div className="card text-center py-12 text-gray-400">
          <p>Click "Generate Report" to view the student's {reportType} report</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
