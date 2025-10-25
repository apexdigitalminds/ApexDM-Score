import React, { useState } from 'react';
import { useApp } from '../App';
import { SnowflakeIcon } from './icons';

const STREAK_FREEZE_COST = 500;

const StorePage: React.FC = () => {
  const { selectedUser, buyStreakFreeze } = useApp();
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // ProtectedRoute ensures user is not null
  const user = selectedUser!;

  const handlePurchase = async () => {
    setIsPurchasing(true);
    const result = await buyStreakFreeze(user.id);
    setNotification({
      type: result.success ? 'success' : 'error',
      message: result.message
    });
    setIsPurchasing(false);
    setTimeout(() => setNotification(null), 3000);
  };
  
  const canAfford = user.xp >= STREAK_FREEZE_COST;

  return (
    <div className="space-y-6">
       {notification && (
        <div className={`fixed top-20 right-8 text-white px-4 py-2 rounded-lg shadow-lg z-20 border ${notification.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">XP Store</h1>
            <p className="text-slate-400">Spend your XP on powerful items.</p>
        </div>
        <div className="flex gap-6 text-right">
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-400">Your XP</p>
                <p className="text-xl font-bold text-blue-400">{user.xp.toLocaleString()}</p>
            </div>
             <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-400">Your Freezes</p>
                <p className="text-xl font-bold text-cyan-400">{user.streakFreezes}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Streak Freeze Item */}
        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 h-32 flex items-center justify-center">
                <SnowflakeIcon className="w-20 h-20 text-white/80" />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-2">Streak Freeze</h3>
                <p className="text-slate-400 text-sm mb-4 flex-grow">
                    Protect your hard-earned streak! If you miss a day, a Streak Freeze will be used automatically to keep your streak intact.
                </p>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-slate-400">Cost:</p>
                    <p className="text-2xl font-bold text-blue-400">{STREAK_FREEZE_COST} XP</p>
                </div>
                <button 
                    onClick={handlePurchase}
                    disabled={!canAfford || isPurchasing}
                    className="w-full bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-purple-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isPurchasing ? 'Processing...' : (canAfford ? 'Buy Now' : 'Not Enough XP')}
                </button>
            </div>
        </div>
        {/* Future items can be added here */}
         <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center justify-center text-center p-6 opacity-50">
            <p className="text-slate-500 text-lg font-bold">More items coming soon!</p>
            <p className="text-slate-600 text-sm">Check back later for more ways to use your XP.</p>
        </div>

      </div>

    </div>
  );
};

export default StorePage;