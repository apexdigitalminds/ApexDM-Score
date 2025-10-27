import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { LogoIcon } from './icons';

const avatarStyles = [
  { id: 'lorelei', name: 'Illustrative' },
  { id: 'adventurer', name: 'Adventurer' },
  { id: 'bottts', name: 'Robots' },
  { id: 'pixel-art', name: 'Pixel Art' },
  { id: 'micah', name: 'Avatars' },
  { id: 'miniavs', name: 'Minimalist' },
];

const SignUpPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [avatarStyle, setAvatarStyle] = useState(avatarStyles[0].id);
  const [avatarGridSeeds, setAvatarGridSeeds] = useState<string[]>([]);
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState('');

  const navigate = useNavigate();
  const { signUp } = useApp();

  const generateSeeds = () => {
    const newSeeds = Array.from({ length: 6 }, () => Math.random().toString(36).substring(7));
    setAvatarGridSeeds(newSeeds);
    // Automatically select the first avatar in the new grid
    setSelectedAvatarSeed(newSeeds[0]);
  };
  
  // Generate seeds when the component mounts or when the style changes
  useEffect(() => {
    generateSeeds();
  }, [avatarStyle]);

  const avatarUrl = useMemo(() => {
    if (!selectedAvatarSeed) return '';
    return `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(selectedAvatarSeed)}`;
  }, [avatarStyle, selectedAvatarSeed]);


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    setError('');
    setIsLoading(true);
    try {
      const { error } = await signUp({ email, password, username, avatarUrl });
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
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center text-white">Choose Your Avatar</h3>
            <div>
              <label htmlFor="avatar-style" className="block text-sm font-medium text-slate-400 mb-2">
                1. Select a Style
              </label>
              <select
                id="avatar-style"
                value={avatarStyle}
                onChange={(e) => setAvatarStyle(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500 transition"
              >
                {avatarStyles.map(style => (
                  <option key={style.id} value={style.id}>{style.name}</option>
                ))}
              </select>
            </div>
            
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">
                2. Pick Your Favorite
              </label>
              <div className="grid grid-cols-3 gap-4">
                {avatarGridSeeds.map(seed => (
                  <button
                    type="button"
                    key={seed}
                    onClick={() => setSelectedAvatarSeed(seed)}
                    className={`rounded-full p-1 transition-all duration-200 ${selectedAvatarSeed === seed ? 'bg-purple-600' : 'bg-transparent'}`}
                  >
                    <img 
                      src={`https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`} 
                      alt="Avatar option"
                      className="w-full h-full rounded-full bg-slate-700"
                    />
                  </button>
                ))}
              </div>
            </div>

             <button type="button" onClick={generateSeeds} className="w-full text-sm bg-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-md hover:bg-slate-600 transition-colors">
              Generate More
            </button>
          </div>

          <div className="border-t border-slate-700 pt-6 space-y-6">
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
