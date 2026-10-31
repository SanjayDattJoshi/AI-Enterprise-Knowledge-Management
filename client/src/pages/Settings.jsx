import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { getStoredTheme, applyTheme } from '../lib/theme';
export const Settings = () => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    // Preferences State
    const [themeMode, setThemeMode] = useState(() => getStoredTheme());
    const [language, setLanguage] = useState('English (US)');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [searchDigest, setSearchDigest] = useState(true);
    const [systemAlerts, setSystemAlerts] = useState(true);
    // Active Modals State
    const [activeModal, setActiveModal] = useState(null);
    // Security Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [securityMessage, setSecurityMessage] = useState('');
    useEffect(() => {
        applyTheme(themeMode);
    }, [themeMode]);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const getInitials = () => {
        const first = user?.firstName?.[0] || 'U';
        const last = user?.lastName?.[0] || '';
        return (first + last).toUpperCase();
    };
    const toggleTheme = () => {
        const nextTheme = themeMode === 'Light' ? 'Dark' : themeMode === 'Dark' ? 'System' : 'Light';
        setThemeMode(nextTheme);
        applyTheme(nextTheme);
    };
    const handleSecuritySubmit = (e) => {
        e.preventDefault();
        setSecurityMessage('Password updated successfully!');
        setTimeout(() => {
            setSecurityMessage('');
            setCurrentPassword('');
            setNewPassword('');
            setActiveModal(null);
        }, 1200);
    };
    return (<div className="flex flex-col w-full max-w-3xl mx-auto px-container-margin py-lg gap-lg pb-safe">
      {/* Profile Header Card */}
      <div className="flex flex-col items-center bg-surface-container rounded-2xl p-lg shadow-sm border border-outline-variant/30 text-center">
        <div className="w-24 h-24 rounded-full bg-primary text-on-primary font-bold text-2xl flex items-center justify-center shadow-md mb-md">
          {user ? getInitials() : 'U'}
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-xs font-bold">
          {user ? `${user.firstName} ${user.lastName}` : 'User Profile'}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-md font-medium">
          {user?.email || 'user@enterprise.com'}
        </p>
        <div className="flex items-center gap-xs">
          <span className="font-label-md text-label-md text-primary bg-primary/10 px-md py-sm rounded-full font-bold uppercase tracking-wider">
            {user?.role || 'MEMBER'}
          </span>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="flex flex-col gap-sm">
        <h3 className="font-title-lg text-title-lg text-on-surface px-sm font-bold">Preferences</h3>
        <div className="bg-surface-container rounded-2xl shadow-sm flex flex-col overflow-hidden border border-outline-variant/30">
          {/* Account Security */}
          <div onClick={() => setActiveModal('SECURITY')} className="flex items-center justify-between p-md hover:bg-surface-container-high transition-colors cursor-pointer group">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                security
              </span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">Account Security</span>
            </div>
            <div className="flex items-center gap-xs text-on-surface-variant">
              <span className="font-body-sm text-xs font-medium">Password & 2FA</span>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </div>
          </div>

          <div className="h-px bg-outline-variant/30 w-full"/>

          {/* Notifications */}
          <div onClick={() => setActiveModal('NOTIFICATIONS')} className="flex items-center justify-between p-md hover:bg-surface-container-high transition-colors cursor-pointer group">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                notifications
              </span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">Notifications</span>
            </div>
            <div className="flex items-center gap-xs text-on-surface-variant">
              <span className="font-body-sm text-xs font-medium">
                {emailNotifications ? 'Enabled' : 'Disabled'}
              </span>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </div>
          </div>

          <div className="h-px bg-outline-variant/30 w-full"/>

          {/* Theme Mode */}
          <div onClick={toggleTheme} className="flex items-center justify-between p-md hover:bg-surface-container-high transition-colors cursor-pointer group">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                {themeMode === 'Dark' ? 'dark_mode' : themeMode === 'Light' ? 'light_mode' : 'settings_brightness'}
              </span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">Theme Mode</span>
            </div>
            <span className="font-body-sm text-body-sm text-primary font-bold px-sm py-xs bg-primary/10 rounded-full">
              {themeMode}
            </span>
          </div>

          <div className="h-px bg-outline-variant/30 w-full"/>

          {/* Language */}
          <div onClick={() => setActiveModal('LANGUAGE')} className="flex items-center justify-between p-md hover:bg-surface-container-high transition-colors cursor-pointer group">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                language
              </span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">Language</span>
            </div>
            <div className="flex items-center gap-xs text-on-surface-variant">
              <span className="font-body-sm text-body-sm font-medium mr-xs">{language}</span>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Section */}
      <div className="flex flex-col gap-sm">
        <h3 className="font-title-lg text-title-lg text-on-surface px-sm font-bold">Organization</h3>
        <div className="bg-surface-container rounded-2xl shadow-sm p-md flex flex-col gap-xs border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md text-on-surface font-bold">Enterprise Knowledge Search Ltd.</span>
            <span className="font-label-md text-label-md bg-tertiary-fixed-dim/20 text-on-tertiary-container px-sm py-xs rounded-full font-bold">
              Active Enterprise License
            </span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Vector Database RAG Engine • Unlimited Ingestion
          </span>
        </div>
      </div>

      {/* Logout Button */}
      <button onClick={handleLogout} className="w-full mt-md bg-error-container text-on-error-container font-label-md text-label-md py-md rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-sm font-bold">
        <span className="material-symbols-outlined">logout</span>
        <span>Sign Out</span>
      </button>

      {/* ---------------- ACCOUNT SECURITY MODAL ---------------- */}
      {activeModal === 'SECURITY' && (<div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-lg shadow-xl border border-outline-variant/30 flex flex-col gap-md">
            <div className="flex justify-between items-center pb-sm border-b border-outline-variant/30">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Account Security</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {securityMessage && (<div className="p-3 bg-tertiary-container/30 text-on-tertiary-container rounded-xl text-body-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{securityMessage}</span>
              </div>)}

            <form onSubmit={handleSecuritySubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs font-semibold text-on-surface">Current Password</label>
                <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 px-md rounded-xl bg-surface border border-outline-variant outline-none focus:border-primary text-body-md"/>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-xs font-semibold text-on-surface">New Password</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 px-md rounded-xl bg-surface border border-outline-variant outline-none focus:border-primary text-body-md"/>
              </div>

              <button type="submit" className="w-full mt-sm py-md bg-primary text-on-primary font-label-md font-bold rounded-xl shadow-md hover:bg-on-primary-fixed transition-colors">
                Update Password
              </button>
            </form>
          </div>
        </div>)}

      {/* ---------------- NOTIFICATIONS MODAL ---------------- */}
      {activeModal === 'NOTIFICATIONS' && (<div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-lg shadow-xl border border-outline-variant/30 flex flex-col gap-md">
            <div className="flex justify-between items-center pb-sm border-b border-outline-variant/30">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Notification Preferences</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-md">
              <div className="flex items-center justify-between p-sm rounded-xl bg-surface-container-low">
                <div>
                  <p className="font-body-md text-sm font-semibold text-on-surface">Email Notifications</p>
                  <p className="font-body-sm text-xs text-on-surface-variant">Receive weekly search activity summary</p>
                </div>
                <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="w-5 h-5 accent-primary cursor-pointer"/>
              </div>

              <div className="flex items-center justify-between p-sm rounded-xl bg-surface-container-low">
                <div>
                  <p className="font-body-md text-sm font-semibold text-on-surface">Search Digest</p>
                  <p className="font-body-sm text-xs text-on-surface-variant">Daily AI vector indexing updates</p>
                </div>
                <input type="checkbox" checked={searchDigest} onChange={(e) => setSearchDigest(e.target.checked)} className="w-5 h-5 accent-primary cursor-pointer"/>
              </div>

              <div className="flex items-center justify-between p-sm rounded-xl bg-surface-container-low">
                <div>
                  <p className="font-body-md text-sm font-semibold text-on-surface">System Alerts</p>
                  <p className="font-body-sm text-xs text-on-surface-variant">Security and document processing alerts</p>
                </div>
                <input type="checkbox" checked={systemAlerts} onChange={(e) => setSystemAlerts(e.target.checked)} className="w-5 h-5 accent-primary cursor-pointer"/>
              </div>

              <button onClick={() => setActiveModal(null)} className="w-full mt-sm py-md bg-primary text-on-primary font-label-md font-bold rounded-xl shadow-md hover:bg-on-primary-fixed transition-colors">
                Save Preferences
              </button>
            </div>
          </div>
        </div>)}

      {/* ---------------- LANGUAGE MODAL ---------------- */}
      {activeModal === 'LANGUAGE' && (<div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-lg shadow-xl border border-outline-variant/30 flex flex-col gap-md">
            <div className="flex justify-between items-center pb-sm border-b border-outline-variant/30">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Select Language</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-xs">
              {['English (US)', 'English (UK)', 'Spanish', 'French', 'German'].map((langOption) => (<button key={langOption} onClick={() => {
                    setLanguage(langOption);
                    setActiveModal(null);
                }} className={`w-full flex items-center justify-between p-md rounded-xl text-body-md font-medium transition-colors ${language === langOption
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'hover:bg-surface-container text-on-surface'}`}>
                  <span>{langOption}</span>
                  {language === langOption && (<span className="material-symbols-outlined text-primary text-[20px]">check</span>)}
                </button>))}
            </div>
          </div>
        </div>)}
    </div>);
};
