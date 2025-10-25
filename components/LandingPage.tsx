import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { LogoIcon, TrophyIcon, CrownIcon, ChartBarIcon, UserGroupIcon, ArrowTrendingUpIcon } from './icons';

interface FeatureCardProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, iconBg, title, description }) => (
    <div className="bg-slate-800/50 backdrop-blur p-6 rounded-2xl border border-slate-700 text-left">
        <div className={`p-3 rounded-lg inline-block mb-4 ${iconBg}`}>
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-slate-400">{description}</p>
    </div>
);


const LandingPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = (role: 'admin' | 'member') => {
    // In our mock data, user_1 is the admin and user_2 is a regular member.
    const userId = role === 'admin' ? 'user_1' : 'user_2';
    login(userId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 py-16">
      <div className="text-center w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-4">
            <LogoIcon className="h-16 w-16" />
            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">ApexDM Score</span>
        </div>
        
        <div className="inline-block bg-purple-500/10 text-purple-400 text-sm font-semibold px-4 py-1 rounded-full mb-4">
          Gamified Community Engagement
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Improve Retention and Engagement for your Community
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto mb-8">
          Reward members with XP, badges, and streaks for learning and taking action. Boost engagement and retention with powerful gamification.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => handleLogin('member')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105"
            >
              <UserGroupIcon className="h-6 w-6" />
              Login as Member (Demo)
            </button>
             <button
              onClick={() => handleLogin('admin')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-600 transition-all"
            >
               <ArrowTrendingUpIcon className="h-6 w-6" />
              Login as Admin (Demo)
            </button>
        </div>
      </div>

       <div className="mt-16 w-full max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
                icon={<TrophyIcon className="w-8 h-8 text-yellow-400" />}
                iconBg="bg-yellow-500/10"
                title="XP System"
                description="Award points for watching content, completing modules, and activities."
            />
            <FeatureCard
                icon={<CrownIcon className="w-8 h-8 text-green-400" />}
                iconBg="bg-green-500/10"
                title="Badges & Milestones"
                description="Unlock achievements at XP thresholds and celebrate member progress."
            />
            <FeatureCard
                icon={<ChartBarIcon className="w-8 h-8 text-orange-400" />}
                iconBg="bg-orange-500/10"
                title="Leaderboards"
                description="Drive competition with real-time rankings based on XP and streaks."
            />
        </div>
      </div>

      <div className="mt-20 w-full max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center shadow-2xl shadow-purple-500/20">
        <h2 className="text-4xl font-extrabold text-white mb-4">
          Ready for Whop Integration
        </h2>
        <p className="text-lg text-blue-100 max-w-3xl mx-auto mb-8">
          Built with OAuth and webhook support. Connect your Whop store to
          automatically reward members for subscriptions, renewals, and community
          participation.
        </p>
        <button
          onClick={() => handleLogin('admin')}
          className="inline-block bg-white text-purple-700 font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-200 transition-all transform hover:scale-105 shadow-lg"
        >
          Explore Admin Features
        </button>
      </div>

    </div>
  );
};

export default LandingPage;