// Client: Sign In Page matching approved design (login/code.html)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useAuthStore } from '../features/auth/auth.store';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginRes: any = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', loginRes.data.accessToken);

      const meRes: any = await api.get('/auth/me');
      setAuth(meRes.data, loginRes.data.accessToken);

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/app/search');
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body-md flex flex-col min-h-screen">
      {/* Fixed Navigation Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-container-margin flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[20px]">hub</span>
            </div>
            <span className="font-title-lg text-title-lg text-on-surface tracking-tight font-bold">KNOWLEDGE</span>
          </div>

          <div className="flex items-center gap-md">
            <button className="w-8 h-8 flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined">search</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex flex-col relative w-full pt-16 pb-xxl bg-surface">
        <div className="flex flex-col w-full h-full min-h-[calc(100vh-4rem)] items-center justify-center p-md bg-surface relative overflow-hidden">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary-fixed blur-[140px] rounded-full"></div>
          </div>

          {/* Login Container Card */}
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_rgba(15,23,42,0.12)] p-lg relative z-10 flex flex-col items-center border border-outline-variant/30">
            {/* Enterprise Logo Area */}
            <div className="w-24 h-24 mb-xl rounded-full overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.08)] bg-surface-bright flex items-center justify-center border border-outline-variant/30">
              <div className="w-full h-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[44px]">neurology</span>
              </div>
            </div>

            {/* Typography Header */}
            <div className="text-center mb-xl w-full">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-sm font-bold">
                Welcome Back
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Sign in to access enterprise knowledge.</p>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="w-full mb-lg p-3 bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm flex items-center gap-2 border border-error/20">
                <span className="material-symbols-outlined text-[20px] text-error">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form Elements */}
            <form className="w-full flex flex-col gap-lg" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
                  Email Address
                </label>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-md text-on-surface-variant group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                  <input
                    className="w-full h-12 pl-xxl pr-md bg-surface-bright rounded-lg font-body-md text-body-md text-on-surface outline-none transition-all border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/20 placeholder:text-outline"
                    id="email"
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="font-label-md text-label-md text-primary hover:text-secondary transition-colors">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative flex items-center group">
                  <span className="material-symbols-outlined absolute left-md text-on-surface-variant group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full h-12 pl-xxl pr-xxl bg-surface-bright rounded-lg font-body-md text-body-md text-on-surface outline-none transition-all border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/20 placeholder:text-outline"
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-md text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none flex items-center justify-center h-full"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-sm mt-xs">
                <div className="relative flex items-center">
                  <input
                    className="peer w-5 h-5 appearance-none border border-outline-variant rounded-md checked:bg-primary checked:border-primary transition-colors cursor-pointer focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="material-symbols-outlined absolute pointer-events-none text-on-primary text-[16px] opacity-0 peer-checked:opacity-100 transition-opacity left-[2px] top-[2px]">
                    check
                  </span>
                </div>
                <label className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer select-none" htmlFor="remember">
                  Remember this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                className={`w-full h-12 mt-md ${
                  isSuccess
                    ? 'bg-tertiary-fixed-dim text-on-tertiary-fixed'
                    : 'bg-primary text-on-primary hover:bg-on-primary-fixed'
                } rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm transition-colors shadow-[0_4px_12px_rgba(15,23,42,0.08)] relative overflow-hidden group disabled:opacity-70`}
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? (
                  <svg className="animate-spin w-5 h-5 text-on-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                  </svg>
                ) : isSuccess ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Success</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">login</span>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Account Creation & Legal / Footer */}
            <div className="mt-xl text-center w-full flex flex-col gap-sm">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Need an account?{' '}
                <Link to="/register" className="text-primary font-semibold hover:text-secondary">
                  Create Organization Account
                </Link>
              </p>
              <p className="font-label-md text-label-md text-outline">
                Protected by <span className="text-on-surface-variant font-semibold">Enterprise Auth</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
