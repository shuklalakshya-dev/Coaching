import React, { useEffect, useState, useCallback } from 'react';
import { attendanceService } from '../../services';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isAfter, addMonths, subMonths,
} from 'date-fns';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'present', label: 'P', title: 'Present', activeClass: 'bg-green-500 text-white border-green-500 shadow-green-200 shadow-md' },
  { value: 'absent',  label: 'A', title: 'Absent',  activeClass: 'bg-red-500 text-white border-red-500 shadow-red-200 shadow-md' },
  { value: 'late',    label: 'L', title: 'Late',    activeClass: 'bg-yellow-400 text-white border-yellow-400 shadow-yellow-200 shadow-md' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const InlineCalendar = ({ selectedDate, onChange }) => {
  const today = new Date();
  const selected = new Date(selectedDate);
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const prevMonth = () => setViewDate((d) => subMonths(d, 1));
  const nextMonth = () => {
    const next = addMonths(viewDate, 1);
    if (next <= today) setViewDate(next);
  };

  const isNextDisabled = addMonths(viewDate, 1) > today;

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-900">{format(viewDate, 'MMMM yyyy')}</span>
        <button onClick={nextMonth} disabled={isNextDisabled} className={`p-1.5 rounded-lg transition-colors ${isNextDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Day names — Sunday in red */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>

      {/* Dates grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const isFuture = isAfter(day, today);
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const isSun = getDay(day) === 0;
          return (
            <button
              key={day.toISOString()}
              disabled={isFuture}
              onClick={() => onChange(format(day, 'yyyy-MM-dd'))}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all
                ${ isSelected
                  ? 'bg-primary-600 text-white font-bold shadow-sm'
                  : isToday
                  ? 'border-2 border-primary-400 text-primary-700 font-semibold'
                  : isFuture
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSun
                  ? 'text-red-400 font-semibold hover:bg-red-50'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const AttendancePage = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateData, setDateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isHoliday, setIsHoliday] = useState(getDay(new Date()) === 0);

  // Auto-mark Sunday as holiday whenever date changes
  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (getDay(new Date(newDate + 'T00:00:00')) === 0) {
      setIsHoliday(true);
    } else {
      setIsHoliday(false);
    }
  };

  // attendance map: studentId => status
  const [attendanceMap, setAttendanceMap] = useState({});

  const fetchDateData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await attendanceService.getByDate(date);
      setDateData(data.data);

      // Build initial map from marked records
      const map = {};
      data.data.marked.forEach((r) => {
        map[r.studentId._id] = r.status;
      });
      // Unmarked defaults to 'present'
      data.data.unmarked.forEach((s) => {
        map[s._id] = 'present';
      });
      setAttendanceMap(map);
    } catch (err) {
      toast.error(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDateData();
  }, [fetchDateData]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const newMap = {};
    Object.keys(attendanceMap).forEach((id) => { newMap[id] = status; });
    setAttendanceMap(newMap);
  };

  const handleSave = async () => {
    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    if (records.length === 0) {
      toast.error('No students to mark attendance for');
      return;
    }

    setSaving(true);
    try {
      await attendanceService.mark({ records, date });
      toast.success(`Attendance saved for ${records.length} students`);
      fetchDateData();
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Combine all students (marked + unmarked)
  const allStudents = dateData
    ? [
        ...dateData.marked.map((r) => ({ ...r.studentId, _alreadyMarked: true })),
        ...dateData.unmarked,
      ]
    : [];

  const counts = Object.values(attendanceMap).reduce(
    (acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; },
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-500 text-sm mt-1">Mark daily attendance for all students</p>
      </div>

      {/* Calendar + summary side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inline Calendar */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Select Date</h2>
          <InlineCalendar selectedDate={date} onChange={handleDateChange} />
          <p className="mt-4 text-center text-xs text-gray-400">Selected: <span className="font-semibold text-gray-700">{format(new Date(date), 'MMMM d, yyyy')}</span></p>
          {getDay(new Date(date + 'T00:00:00')) === 0 && (
            <p className="mt-2 text-center text-xs font-medium text-red-400">🔴 Sunday</p>
          )}
        </div>

        {/* Summary counts */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card flex-1">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Attendance Summary — {format(new Date(date), 'MMMM d, yyyy')}</h2>
            {dateData ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{counts.present || 0}</p>
                  <p className="text-xs text-green-600 mt-0.5">Present</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <XCircleIcon className="h-6 w-6 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700">{counts.absent || 0}</p>
                  <p className="text-xs text-red-600 mt-0.5">Absent</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <ClockIcon className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-700">{counts.late || 0}</p>
                  <p className="text-xs text-yellow-600 mt-0.5">Late</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Loading...</p>
            )}
          </div>

          {/* Bulk actions + save */}
          {allStudents.length > 0 && (
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => handleMarkAll('present')} className="text-sm btn-secondary text-green-700 border-green-200 hover:bg-green-50">
                  Mark All Present
                </button>
                <button onClick={() => handleMarkAll('absent')} className="text-sm btn-secondary text-red-700 border-red-200 hover:bg-red-50">
                  Mark All Absent
                </button>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student list */}
      {isHoliday ? (
        <div className="card border-2 border-red-100 bg-red-50 text-center py-12">
          <p className="text-4xl mb-3">🎉</p>
          <h2 className="text-lg font-bold text-red-700">Sunday — Holiday</h2>
          <p className="text-sm text-red-500 mt-1">{format(new Date(date), 'MMMM d, yyyy')} is marked as a holiday by default.</p>
          <button
            onClick={() => setIsHoliday(false)}
            className="mt-5 px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Override — Mark Attendance Anyway
          </button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {getDay(new Date(date + 'T00:00:00')) === 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border-b border-orange-100 px-4 py-2">
              <span className="text-orange-500 text-xs font-semibold">⚠️ Sunday Override — Marking attendance on a holiday</span>
              <button onClick={() => setIsHoliday(true)} className="ml-auto text-xs text-orange-600 underline hover:text-orange-800">Reset to Holiday</button>
            </div>
          )}
          {loading ? (
            <Loader />
          ) : allStudents.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p>No students found</p>
            </div>
          ) : (
            <div>
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">{allStudents.length} Students</p>
                <p className="text-sm text-gray-500">{format(new Date(date), 'MMMM d, yyyy')}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {allStudents.map((student) => {
                  const currentStatus = attendanceMap[student._id] || 'present';
                  return (
                    <div
                      key={student._id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                    >
                      {student.profilePhoto ? (
                        <img src={student.profilePhoto} alt={student.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-600">{student.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.rollNumber} · {student.class}</p>
                      </div>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map(({ value, label, title, activeClass }) => (
                          <button
                            key={value}
                            title={title}
                            onClick={() => handleStatusChange(student._id, value)}
                            className={`h-9 w-9 rounded-full border-2 font-bold text-sm transition-all flex items-center justify-center ${
                              currentStatus === value
                                ? activeClass
                                : 'text-gray-300 bg-white border-gray-200 hover:border-gray-400 hover:text-gray-500'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
