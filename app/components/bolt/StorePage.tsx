"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { StoreItem } from '@/types';
import { iconMap } from './icons';
import LockedPageMockup from './LockedPageMockup';

const StoreItemCard: React.FC<{
    item: StoreItem;
    userXP: number;
    onPurchase: (itemId: string) => void;
    isPurchasing: boolean;
}> = ({ item, userXP, onPurchase, isPurchasing }) => {
    const canAfford = userXP >= item.cost;
    const IconComponent = iconMap[item.icon] || iconMap['Sparkles'];

    return (
        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 h-32 flex items-center justify-center">
                <IconComponent className="w-20 h-20 text-white/80" />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-2">
                    {/* 🟢 FIX: Small Icon next to Name */}
                    <IconComponent className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">{item.name}</h3>
                </div>
                
                <p className="text-slate-400 text-sm mb-4 flex-grow">
                    {item.description}
                     {item.itemType === 'TIMED_EFFECT' && item.durationHours && (
                        <span className="block mt-2 font-semibold text-purple-300">Lasts for {item.durationHours} hours.</span>
                    )}
                     {/* 🟢 Visual Tag for Cosmetics */}
                     {['NAME_COLOR', 'TITLE', 'BANNER'].includes(item.itemType) && (
                        <span className="block mt-2 text-xs font-bold text-blue-300 uppercase tracking-wide">Cosmetic Item</span>
                    )}
                </p>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-slate-400">Cost:</p>
                    <p className="text-2xl font-bold text-blue-400">{item.cost.toLocaleString()} XP</p>
                </div>
                <button
                    onClick={() => onPurchase(item.id)}
                    disabled={!canAfford || isPurchasing}
                    className="w-full bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-purple-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isPurchasing ? 'Processing...' : (canAfford ? 'Buy Now' : 'Not Enough XP')}
                </button>
            </div>
        </div>
    );
};

const StorePage: React.FC = () => {
  const { selectedUser, storeItems, handleBuyStoreItem, isFeatureEnabled } = useApp();
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  if (!isFeatureEnabled('store')) {
      return (
          <LockedPageMockup 
              title="XP Store" 
              description="Allow members to exchange their hard-earned XP for real or digital rewards." 
              requiredTier="Elite"
              mockType="grid"
          />
      );
  }

  const user = selectedUser!;

  const handlePurchase = async (itemId: string) => {
    setPurchasingId(itemId);
    const result = await handleBuyStoreItem(user.id, itemId);
    setNotification({
      type: result.success ? 'success' : 'error',
      message: result.message
    });
    setPurchasingId(null);
    setTimeout(() => setNotification(null), 3000);
  };
  
  const activeItems = storeItems.filter(item => item.isActive);

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
            <p className="text-slate-400">Spend your XP on powerful items and cosmetics.</p>
        </div>
        <div className="flex gap-6 text-right">
            <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-400">Your XP</p>
                <p className="text-xl font-bold text-blue-400">{user.xp.toLocaleString()}</p>
            </div>
             <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-400">Your Freezes</p>
                <p className="text-xl font-bold text-cyan-400">{user.streakFreezes ?? 0}</p>
            </div>
        </div>
      </div>
        
        {activeItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeItems.map(item => (
                    <StoreItemCard 
                        key={item.id}
                        item={item}
                        userXP={user.xp}
                        onPurchase={handlePurchase}
                        isPurchasing={purchasingId === item.id}
                    />
                ))}
            </div>
        ) : (
             <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center justify-center text-center p-12 h-64">
                <p className="text-slate-500 text-lg font-bold">The store is currently empty.</p>
                <p className="text-slate-600 text-sm">Check back later for new items!</p>
            </div>
        )}
    </div>
  );
};

export default StorePage;