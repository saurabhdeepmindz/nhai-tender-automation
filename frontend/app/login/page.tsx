'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserCircle, Lock, Mail, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

// Matches the demo accounts in backend/src/auth/auth.service.ts
const DEMO_CREDENTIALS = {
  vendor: { email: 'vendor@example.com', password: 'password123' },
  admin: { email: 'admin@nhai.gov.in', password: 'admin123' },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'vendor' as 'vendor' | 'admin',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (formData.role === 'vendor') {
          router.push('/vendor/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-nhai-primary rounded-full mb-4 shadow-nhai-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NHAI Tender System</h1>
          <p className="text-gray-600">AI-Driven Query Automation Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-nhai-lg p-8 animate-slide-in">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                role: 'vendor',
                email: DEMO_CREDENTIALS.vendor.email,
                password: DEMO_CREDENTIALS.vendor.password,
              })}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                formData.role === 'vendor'
                  ? 'border-nhai-primary bg-blue-50 text-nhai-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <UserCircle className="w-6 h-6 mx-auto mb-1" />
              <span className="block text-sm font-medium">Vendor</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                role: 'admin',
                email: DEMO_CREDENTIALS.admin.email,
                password: DEMO_CREDENTIALS.admin.password,
              })}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                formData.role === 'admin'
                  ? 'border-nhai-primary bg-blue-50 text-nhai-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Shield className="w-6 h-6 mx-auto mb-1" />
              <span className="block text-sm font-medium">Admin</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="label">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                  className="w-4 h-4 text-nhai-primary focus:ring-nhai-primary rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-nhai-primary hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>Vendor: vendor@example.com / password123</p>
              <p>Admin: admin@nhai.gov.in / admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2026 National Highways Authority of India
        </p>
      </div>
    </div>
  );
}
