import React, { useEffect, useState, useCallback } from 'react';
import { studentService } from '../../services';
import Modal, { ConfirmModal } from '../../components/Modal';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const initialForm = {
  name: '', fatherName: '', motherName: '', class: '',
  dateOfJoining: '', email: '', phone: '', password: '',
  address: '', profilePhoto: '',
};

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [viewStudent, setViewStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await studentService.getAll({ page, limit: 10, search });
      setStudents(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 400);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const openAdd = () => {
    setEditStudent(null);
    setForm({ ...initialForm, dateOfJoining: new Date().toISOString().split('T')[0] });
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditStudent(student);
    setForm({
      name: student.name || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      class: student.class || '',
      dateOfJoining: student.dateOfJoining
        ? new Date(student.dateOfJoining).toISOString().split('T')[0]
        : '',
      email: student.email || '',
      phone: student.phone || '',
      password: '',
      address: student.address || '',
      profilePhoto: student.profilePhoto || '',
    });
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and Email are required');
      return;
    }
    if (!editStudent && !form.password) {
      toast.error('Password is required for new student');
      return;
    }
    setFormLoading(true);
    try {
      const payload = { ...form };
      if (editStudent && !payload.password) delete payload.password;

      if (editStudent) {
        await studentService.update(editStudent._id, payload);
        toast.success('Student updated successfully');
      } else {
        await studentService.create(payload);
        toast.success('Student created successfully');
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await studentService.delete(confirmDelete._id);
      toast.success('Student deleted successfully');
      setConfirmDelete(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      const { data } = await studentService.toggleStatus(student._id);
      toast.success(data.message);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total students</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <PlusIcon className="h-4 w-4" /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, roll no..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <Loader />
          ) : students.length === 0 ? (
            <div className="py-16 text-center">
              <UserCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No students found</p>
              <button onClick={openAdd} className="mt-3 text-primary-600 text-sm hover:underline">
                Add your first student
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Class</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Joined</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {s.profilePhoto ? (
                          <img src={s.profilePhoto} alt={s.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary-600">{s.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.rollNumber} · {s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{s.class || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{s.phone || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {s.dateOfJoining ? format(new Date(s.dateOfJoining), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`badge-${s.isActive ? 'green' : 'red'} cursor-pointer hover:opacity-80`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setViewStudent(s)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(s)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="Full name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="Email address" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
              <input name="fatherName" value={form.fatherName} onChange={handleChange} className="input-field" placeholder="Father's name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
              <input name="motherName" value={form.motherName} onChange={handleChange} className="input-field" placeholder="Mother's name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <input name="class" value={form.class} onChange={handleChange} className="input-field" placeholder="e.g. 10th, 11th, 12th" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="10-digit phone number" maxLength={10} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
              <input name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editStudent ? 'New Password (leave blank to keep)' : 'Password *'}
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder={editStudent ? 'Leave blank to keep current' : 'Set login password'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} className="input-field" rows={2} placeholder="Student address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo URL</label>
            <input name="profilePhoto" value={form.profilePhoto} onChange={handleChange} className="input-field" placeholder="https://..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1" disabled={formLoading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={formLoading}>
              {formLoading ? 'Saving...' : editStudent ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Details" size="md">
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {viewStudent.profilePhoto ? (
                <img src={viewStudent.profilePhoto} alt={viewStudent.name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">{viewStudent.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewStudent.name}</h3>
                <p className="text-sm text-gray-500">{viewStudent.rollNumber}</p>
                <span className={`badge-${viewStudent.isActive ? 'green' : 'red'} mt-1`}>
                  {viewStudent.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Email', viewStudent.email],
                ['Phone', viewStudent.phone || '—'],
                ['Class', viewStudent.class || '—'],
                ['Father', viewStudent.fatherName || '—'],
                ['Mother', viewStudent.motherName || '—'],
                ['Joined', viewStudent.dateOfJoining ? format(new Date(viewStudent.dateOfJoining), 'MMM d, yyyy') : '—'],
                ['Address', viewStudent.address || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-400 font-medium">{label}</p>
                  <p className="text-gray-800 break-all">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to permanently delete "${confirmDelete?.name}"? This will also delete all their attendance and marks records.`}
        confirmText="Delete"
        loading={deleteLoading}
        danger
      />
    </div>
  );
};

export default StudentManagement;
