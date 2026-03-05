import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AcademicCapIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      toast.success(`Welcome back, ${userData.name}!`);
      const dest = userData.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      const from = location.state?.from?.pathname || dest;
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <AcademicCapIcon className="h-9 w-9 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">GYANRICH</h2>
            <p className="text-primary-100 mt-1 text-sm">Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Sign In</h3>
            <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field pr-10"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Contact your admin if you cannot access your account.
            </p>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          &copy; {new Date().getFullYear()} GYANRICH Institute Management System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
