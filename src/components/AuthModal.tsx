import React, { useState } from 'react';
import { X, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup'
}) => {
  const { loginWithGoogle, signUpWithEmail, loginWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync mode if initialMode changes when opened
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const getCleanErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Incorrect email or password. Please try again.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Try logging in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed before completing.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network connection issue. Please check your internet connection.';
    }
    return err?.message || 'Authentication failed. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      setSuccessMsg('Successfully logged in with Google!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, fullName);
        setSuccessMsg(`Welcome to LearnLoom, ${fullName || 'Student'}!`);
      } else {
        await loginWithEmail(email, password);
        setSuccessMsg('Welcome back to LearnLoom!');
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#0F1219] border-2 border-[#383838] rounded-3xl w-full max-w-md p-5 sm:p-8 shadow-brutal-xl relative animate-in zoom-in-95 duration-150 text-[#F7F1E5] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#181E2B] border border-[#383838] shadow-brutal-sm hover:bg-[#F59E0B] hover:text-[#090B0E] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-white hover:text-[#090B0E]" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <img
            src="/assets/aistudio/Abstract_Ribbon_M_Emblem_4a31ed28.png"
            alt="LearnLoom logo"
            className="w-11 h-11 object-contain rounded-full border-2 border-[#383838] shadow-brutal-sm bg-black"
          />
          <div>
            <h3 className="font-display font-extrabold text-2xl text-white leading-tight">
              {mode === 'signup' ? 'Create an Account' : 'Welcome Back'}
            </h3>
            <p className="text-xs font-mono text-[#A3A3A3]">
              {mode === 'signup'
                ? 'Join thousands of students on LearnLoom.'
                : 'Log in to continue your study flow.'}
            </p>
          </div>
        </div>

        {/* Tab Switcher (Signup / Login) */}
        <div className="grid grid-cols-2 p-1 bg-[#090B0E] rounded-xl border border-[#2D2D2D] mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#7C3AED] text-white shadow-brutal-sm border border-[#A78BFA]'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#7C3AED] text-white shadow-brutal-sm border border-[#A78BFA]'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Log In
          </button>
        </div>

        {/* Status / Error Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Sign-In Button (Recommended) */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full relative flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-[#181E2B] hover:bg-[#2A2A2A] text-white font-display font-extrabold text-sm border-2 border-[#383838] hover:border-[#7C3AED] shadow-brutal brutal-btn-press transition-all cursor-pointer disabled:opacity-50"
        >
          {/* Google 4-color SVG */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED] text-[#F59E0B] border border-[#A78BFA]/50 uppercase tracking-wider">
            Recommended
          </span>
        </button>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333333]"></div>
          </div>
          <span className="relative px-3 bg-[#0F1219] text-[11px] font-mono text-[#888888] uppercase tracking-wider">
            or continue with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#D4D4D4] mb-1.5">
                Full Name <span className="text-[#A78BFA]">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin"
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl bg-[#181E2B] border-2 border-[#383838] text-sm text-white focus:outline-none focus:border-[#7C3AED] shadow-brutal-sm placeholder-[#737373]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#D4D4D4] mb-1.5">
              Email Address <span className="text-[#A78BFA]">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-[#181E2B] border-2 border-[#383838] text-sm text-white focus:outline-none focus:border-[#7C3AED] shadow-brutal-sm placeholder-[#737373]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#D4D4D4] mb-1.5">
              Password <span className="text-[#A78BFA]">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                disabled={loading}
                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-[#181E2B] border-2 border-[#383838] text-sm text-white focus:outline-none focus:border-[#7C3AED] shadow-brutal-sm placeholder-[#737373]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* NO FORGOT PASSWORD LINK - strictly omitted as requested by user ("koi forgot wageraa kaa nahi") */}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 font-display font-extrabold text-sm bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 rounded-xl border-2 border-[#A78BFA] shadow-brutal brutal-btn-press transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Switcher */}
          <div className="pt-2 text-center text-xs font-mono text-[#A3A3A3]">
            {mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-[#F59E0B] hover:underline cursor-pointer"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-bold text-[#F59E0B] hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
