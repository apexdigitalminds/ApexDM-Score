import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { LogoIcon } from './icons';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'reset'>('login');
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();
  const { signIn, sendPasswordResetEmail } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { error } = await signIn({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setResetMessage('');
      setIsLoading(true);
      try {
          const { error } = await sendPasswordResetEmail(email);
          if (error) {
              setError(error.message);
          } else {
              setResetMessage('Password reset link sent! Please check your email.');
          }
      } catch (err: any) {
           setError(err.message || 'An unexpected error occurred.');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center gap-3 text-2xl font-extrabold tracking-tight">
                <LogoIcon className="h-10 w-10"/>
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                    ApexDM Score
                </span>
            </Link>
            <h2 className="mt-4 text-2xl font-bold">
                {view === 'login' ? 'Sign in to your account' : 'Reset your password'}
            </h2>
        </div>
        
        {view === 'login' ? (
          <form 
            onSubmit={handleLogin} 
            className="bg-slate-800/50 backdrop-blur border border-slate-700 shadow-2xl rounded-2xl p-8 space-y-6"
          >
            {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center">{error}</p>}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500 transition"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
                <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">
                      Password
                    </label>
                     <button
                        type="button"
                        onClick={() => { setView('reset'); setError(''); }}
                        className="text-sm text-purple-400 hover:text-purple-300 font-semibold"
                     >
                        Forgot Password?
                    </button>
                </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500 transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
            <form 
                onSubmit={handlePasswordReset} 
                className="bg-slate-800/50 backdrop-blur border border-slate-700 shadow-2xl rounded-2xl p-8 space-y-6"
            >
                {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center">{error}</p>}
                {resetMessage && <p className="bg-green-500/20 text-green-400 p-3 rounded-lg text-center">{resetMessage}</p>}
                
                 <p className="text-sm text-slate-400 text-center">Enter your email and we'll send you a link to get back into your account.</p>

                <div>
                    <label htmlFor="email-reset" className="block text-sm font-medium text-slate-400 mb-2">
                    Email address
                    </label>
                    <input
                        id="email-reset"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500 transition"
                        placeholder="you@example.com"
                    />
                </div>
                
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>
                 <div className="text-center">
                    <button
                        type="button"
                        onClick={() => { setView('login'); setError(''); }}
                        className="text-sm text-purple-400 hover:text-purple-300 font-semibold"
                     >
                        Back to Sign In
                    </button>
                </div>
            </form>
        )}
         <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-purple-400 hover:text-purple-300">
              Sign Up
            </Link>
          </p>
      </div>
    </div>
  );
};

export default LoginPage;