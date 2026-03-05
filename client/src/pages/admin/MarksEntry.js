import React, { useEffect, useState, useCallback } from 'react';
import { marksService, studentService } from '../../services';
import Modal, { ConfirmModal } from '../../components/Modal';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const initialForm = {
  studentId: '', subject: '', testName: '',
  marksObtained: '', maxMarks: '', date: '', remarks: '',
};

const MarksEntry = () => {
  const [marksList, setMarksList] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterStudent, setFilterStudent] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editMark, setEditMark] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMarks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterStudent) params.studentId = filterStudent;
      if (filterSubject) params.subject = filterSubject;
      const { data } = await marksService.getAll(params);
      setMarksList(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(err.message || 'Failed to load marks');
    } finally {
      setLoading(false);
    }
  }, [page, filterStudent, filterSubject]);

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await studentService.getAll({ limit: 200, isActive: 'true' });
      setStudents(data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchMarks(); }, [fetchMarks]);

  const openAdd = () => {
    setEditMark(null);
    setForm({ ...initialForm, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (mark) => {
    setEditMark(mark);
    setForm({
      studentId: mark.studentId?._id || '',
      subject: mark.subject || '',
      testName: mark.testName || '',
      marksObtained: mark.marksObtained?.toString() || '',
      maxMarks: mark.maxMarks?.toString() || '',
      date: mark.date ? new Date(mark.date).toISOString().split('T')[0] : '',
      remarks: mark.remarks || '',
    });
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.subject || !form.testName || !form.marksObtained || !form.maxMarks) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (parseFloat(form.marksObtained) > parseFloat(form.maxMarks)) {
      toast.error('Marks obtained cannot exceed maximum marks');
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        ...form,
        marksObtained: parseFloat(form.marksObtained),
        maxMarks: parseFloat(form.maxMarks),
      };
      if (editMark) {
        await marksService.update(editMark._id, payload);
        toast.success('Marks updated');
      } else {
        await marksService.add(payload);
        toast.success('Marks added');
      }
      setModalOpen(false);
      fetchMarks();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await marksService.delete(confirmDelete._id);
      toast.success('Record deleted');
      setConfirmDelete(null);
      fetchMarks();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Marks</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total records</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start">
          <PlusIcon className="h-4 w-4" /> Add Marks
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStudent}
          onChange={(e) => { setFilterStudent(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">All Students</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by subject..."
          value={filterSubject}
          onChange={(e) => { setFilterSubject(e.target.value); setPage(1); }}
          className="input-field w-auto"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <Loader />
          ) : marksList.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="font-medium">No marks records found</p>
              <button onClick={openAdd} className="mt-2 text-primary-600 text-sm hover:underline">Add first record</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Test</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Score</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">%</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {marksList.map((m) => {
                  const pct = ((m.marksObtained / m.maxMarks) * 100).toFixed(0);
                  return (
                    <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{m.studentId?.name}</p>
                        <p className="text-xs text-gray-400">{m.studentId?.rollNumber}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{m.subject}</td>
                      <td className="py-3 px-4 text-gray-600">{m.testName}</td>
                      <td className="py-3 px-4 text-right font-medium">{m.marksObtained}/{m.maxMarks}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          pct >= 75 ? 'bg-green-100 text-green-700'
                          : pct >= 50 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{format(new Date(m.date), 'MMM d, yyyy')}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(m)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMark ? 'Edit Marks' : 'Add Test Marks'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select name="studentId" value={form.studentId} onChange={handleChange} className="input-field" required>
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input name="subject" value={form.subject} onChange={handleChange} className="input-field" placeholder="e.g. Mathematics" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
              <input name="testName" value={form.testName} onChange={handleChange} className="input-field" placeholder="e.g. Unit Test 1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained *</label>
              <input name="marksObtained" type="number" value={form.marksObtained} onChange={handleChange} className="input-field" min="0" placeholder="0" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Marks *</label>
              <input name="maxMarks" type="number" value={form.maxMarks} onChange={handleChange} className="input-field" min="1" placeholder="100" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Date *</label>
            <input name="date" type="date" value={form.date} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <input name="remarks" value={form.remarks} onChange={handleChange} className="input-field" placeholder="Optional remarks" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1" disabled={formLoading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={formLoading}>
              {formLoading ? 'Saving...' : editMark ? 'Update' : 'Add Marks'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        message={`Delete marks for "${confirmDelete?.studentId?.name}" — ${confirmDelete?.testName}?`}
        confirmText="Delete"
        loading={deleteLoading}
        danger
      />
    </div>
  );
};

export default MarksEntry;
