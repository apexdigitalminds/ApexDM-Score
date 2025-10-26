import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { LogoIcon } from './icons';

const SignUpPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useApp();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    setError('');
    setIsLoading(true);
    try {
      const { error } = await signUp({ email, password, username });
      if (error) {
        setError(error.message);
      } else {
        // Supabase sends a confirmation email. Inform the user.
        alert('Sign up successful! Please check your email to confirm your account.');
        navigate('/login');
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
            <h2 className="mt-4 text-2xl font-bold">Create a new account</h2>
        </div>
        <form 
          onSubmit={handleSignUp} 
          className="bg-slate-800/50 backdrop-blur border border-slate-700 shadow-2xl rounded-2xl p-8 space-y-6"
        >
          {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center">{error}</p>}
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500 transition"
              placeholder="Your Name"
            />
          </div>

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
            <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500 transition"
              placeholder="6+ characters"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300">
              Sign In
            </Link>
          </p>
      </div>
    </div>
  );
};

export default SignUpPage;
