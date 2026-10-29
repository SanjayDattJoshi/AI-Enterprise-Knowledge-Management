// Client: Register Page matching Cognitive Enterprise Design

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAuthStore } from '../features/auth/auth.store';

export const Register: React.FC = () => {
  const [form, setForm] = useState({
    organizationName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res: any = await api.post('/auth/register', form);
      setAuth(res.data.user, res.data.accessToken);
      navigate('/app/search');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-background relative">
      <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-8 shadow-sm flex flex-col items-center">
        {/* Logo */}
        <div className="w-16 h-16 mb-4 rounded-xl overflow-hidden bg-surface-container-low flex items-center justify-center border border-outline-variant/40 shadow-xs">
          <img
            alt="AI Knowledge Search Logo"
            className="w-full h-full object-cover"
            src="/logo.png"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              (e.target as HTMLElement).parentElement!.innerHTML =
                '<span class="material-symbols-outlined text-primary text-[32px]">neurology</span>';
            }}
          />
        </div>

        <div className="text-center mb-6 w-full">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-1">Create your account</h1>
          <p className="text-sm text-on-surface-variant">Set up your enterprise knowledge space</p>
        </div>

        {error && (
          <div className="w-full mb-4 p-3 bg-error-container/60 border border-error/20 text-on-error-container text-xs rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-error">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-on-surface-variant px-1" htmlFor="orgName">
              Organization Name
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">
                corporate_fare
              </span>
              <input
                id="orgName"
                type="text"
                placeholder="Acme Global Corp"
                value={form.organizationName}
                onChange={handleChange('organizationName')}
                required
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-outline-variant/80 bg-surface-container-lowest text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant px-1" htmlFor="first">
                First Name
              </label>
              <input
                id="first"
                type="text"
                placeholder="Alex"
                value={form.firstName}
                onChange={handleChange('firstName')}
                required
                className="w-full h-10 px-3 rounded-lg border border-outline-variant/80 bg-surface-container-lowest text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant px-1" htmlFor="last">
                Last Name
              </label>
              <input
                id="last"
                type="text"
                placeholder="Vance"
                value={form.lastName}
                onChange={handleChange('lastName')}
                required
                className="w-full h-10 px-3 rounded-lg border border-outline-variant/80 bg-surface-container-lowest text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-on-surface-variant px-1" htmlFor="regEmail">
              Work Email
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">
                mail
              </span>
              <input
                id="regEmail"
                type="email"
                placeholder="alex.vance@acme.com"
                value={form.email}
                onChange={handleChange('email')}
                required
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-outline-variant/80 bg-surface-container-lowest text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-on-surface-variant px-1" htmlFor="regPassword">
              Password
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">
                lock
              </span>
              <input
                id="regPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange('password')}
                minLength={8}
                required
                className="w-full h-10 pl-10 pr-10 rounded-lg border border-outline-variant/80 bg-surface-container-lowest text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant focus:outline-none flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-11 rounded-lg bg-primary-container text-on-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="w-full mt-6 pt-4 border-t border-outline-variant/40 flex justify-center">
          <p className="text-xs text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
