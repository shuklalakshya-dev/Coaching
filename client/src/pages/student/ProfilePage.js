import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { KeyIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal';

const ProfilePage = () => {
  const { user } = useAuth();
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const infoRows = [
    ['Full Name', user?.name],
    ['Email', user?.email],
    ['Roll Number', user?.rollNumber || '—'],
    ['Class', user?.class || '—'],
    ['Phone', user?.phone || '—'],
    ['Father\'s Name', user?.fatherName || '—'],
    ['Mother\'s Name', user?.motherName || '—'],
    ['Date of Joining', user?.dateOfJoining ? format(new Date(user.dateOfJoining), 'MMMM d, yyyy') : '—'],
    ['Address', user?.address || '—'],
    ['Account Status', user?.isActive ? 'Active' : 'Inactive'],
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your personal information and account details</p>
      </div>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-center gap-5 pb-6 border-b border-gray-100 mb-6">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-indigo-600">{user?.name?.charAt(0)}</span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {user?.rollNumber && (
                <span className="badge-blue">{user.rollNumber}</span>
              )}
              {user?.class && (
                <span className="badge-yellow">Class {user.class}</span>
              )}
              <span className={user?.isActive ? 'badge-green' : 'badge-red'}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {infoRows.map(([label, value]) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <p className="text-sm font-medium text-gray-500 sm:w-40 flex-shrink-0">{label}</p>
              <p className="text-sm text-gray-900 break-all">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Account Security</h3>
            <p className="text-sm text-gray-500 mt-0.5">Manage your password</p>
          </div>
          <button
            onClick={() => setPwModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <KeyIcon className="h-4 w-4" />
            Change Password
          </button>
        </div>
      </div>

      {/* Password modal */}
      <Modal isOpen={pwModal} onClose={() => setPwModal(false)} title="Change Password" size="sm">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="input-field"
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="input-field"
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="input-field"
              placeholder="Confirm new password"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setPwModal(false)} className="btn-secondary flex-1" disabled={pwLoading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={pwLoading}>
              {pwLoading ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
