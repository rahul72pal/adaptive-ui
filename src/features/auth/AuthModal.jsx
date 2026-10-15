import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { loginSuccess, closeAuthModal } from '../user/userSlice';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { X, Sparkles, LogIn, UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';

export function AuthModal() {
  const dispatch = useDispatch();
  const { isAuthModalOpen } = useSelector((state) => state.user);
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const getErrorMessage = (err, defaultMsg) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || d.detail || JSON.stringify(d)).join(', ');
    }
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.status === 401) return 'Incorrect email or password.';
    if (err.response?.status === 400) return 'Bad request. Please check your credentials.';
    if (err.message === 'Network Error' || !err.response) return 'Cannot connect to backend server. Please check your connection.';
    if (err.message) return err.message;
    return defaultMsg;
  };

  const loginMutation = useMutation({
    mutationFn: () => authApi.loginApi({ email, password }),
    onSuccess: (data) => {
      dispatch(loginSuccess({ token: data.access_token, user: data.user }));
      resetForm();
    },
    onError: (err) => {
      setErrorMessage(getErrorMessage(err, 'Invalid email or password. Please try again.'));
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => authApi.registerApi({ email, name, password }),
    onSuccess: (data) => {
      dispatch(loginSuccess({ token: data.access_token, user: data.user }));
      resetForm();
    },
    onError: (err) => {
      setErrorMessage(getErrorMessage(err, 'Registration failed. User with this email may already exist.'));
    },
  });

  const resetForm = () => {
    setEmail('');
    setName('');
    setPassword('');
    setErrorMessage('');
  };

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (mode === 'login') {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#111114] rounded-3xl border border-[#292932] shadow-elevated p-6 sm:p-8 space-y-6 text-[#F4F4F5]">
        
        {/* Close Button */}
        <button
          onClick={() => dispatch(closeAuthModal())}
          className="absolute top-5 right-5 p-2 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1C1C23] rounded-xl transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-2">
          <Badge variant="ai" size="sm" className="mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
            Lumina Engine Authentication
          </Badge>
          <h2 className="text-2xl font-extrabold text-[#F4F4F5] tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            {mode === 'login'
              ? 'Sign in to access your dynamic learning path and adaptive progress.'
              : 'Join Nexus Adaptive Platform to build personalized AI curricula.'}
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex bg-[#16161B] p-1 rounded-xl border border-[#292932]">
          <button
            onClick={() => { setMode('login'); setErrorMessage(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F] shadow-xs'
                : 'text-[#71717A] hover:text-[#F4F4F5]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMessage(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F] shadow-xs'
                : 'text-[#71717A] hover:text-[#F4F4F5]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A1A1AA] block">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Developer"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#16161B] border border-[#292932] rounded-xl text-sm focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]/30 text-[#F4F4F5] placeholder:text-[#71717A]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#A1A1AA] block">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.developer@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#16161B] border border-[#292932] rounded-xl text-sm focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]/30 text-[#F4F4F5] placeholder:text-[#71717A]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#A1A1AA] block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#71717A] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#16161B] border border-[#292932] rounded-xl text-sm focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]/30 text-[#F4F4F5] placeholder:text-[#71717A]"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} size="lg" className="w-full font-bold shadow-md cursor-pointer">
            {mode === 'login' ? 'Sign In to Workspace' : 'Complete Registration'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
