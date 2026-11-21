import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';

export const CrmLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/crm/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username: username.trim(), password: password.trim() });
      navigate(from, { replace: true });
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.message && err.message.includes('Network Error')) {
        setError('Unable to reach server. Please try again.');
      } else {
        setError('Invalid username or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl z-10 space-y-7 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Company Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-xl shadow-indigo-600/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-2.5">
              <img
                src="/tab.png"
                alt="Premium Mobile Repair"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Premium Mobile Repair
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold mt-1.5">
              <span>Admin Control Center</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Sign in with your Administrator credentials
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              User ID or Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter user ID or email"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-xs mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In as Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Admin Demo Login Button */}
        <div className="pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setUsername('admin');
              setPassword('admin@123');
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Auto-fill Admin (admin / admin@123)</span>
          </button>
        </div>

        {/* Back Link */}
        <div className="pt-2 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
