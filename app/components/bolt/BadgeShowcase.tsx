"use client";

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import BadgeItem from './BadgeItem';
import StreakShowcase from './StreakShowcase';
import type { Badge, BadgeConfig, UserInventoryItem } from '@/types';
import { api } from '@/services/api';
import { SparklesIcon, ClockIcon } from './icons';

const BadgeShowcase: React.FC = () => {
    const { badgesConfig, getUserInventory, selectedUser, activateInventoryItem, activeEffects, fetchAllUsers } = useApp();
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Inventory on mount
    useEffect(() => {
        if (selectedUser) {
            getUserInventory(selectedUser.id).then(setInventory);
        }
    }, [selectedUser, getUserInventory]);

    const handleRefresh = async () => {
        if (selectedUser) {
            const items = await getUserInventory(selectedUser.id);
            setInventory(items);
            await fetchAllUsers(); // Refresh profile/header
        }
    };

    const handleUseItem = async (item: UserInventoryItem) => {
        if (!item.itemDetails) return;
        setIsLoading(true);

        // 🟢 LOGIC SPLIT: Equip vs Activate
        const isCosmetic = ['NAME_COLOR', 'TITLE', 'BANNER', 'FRAME'].includes(item.itemDetails.itemType);

        if (isCosmetic) {
            // Cosmetic -> Equip (Update Profile Metadata)
            const result = await api.equipCosmetic(selectedUser!.id, item.itemDetails);
            alert(result.message); // Simple feedback
        } else {
            // Consumable -> Activate (Consume Item)
            const result = await activateInventoryItem(item.id);
            alert(result.message);
        }

        await handleRefresh(); // Refresh list
        setIsLoading(false);
    };

    const allBadges: Badge[] = Object.entries(badgesConfig).map(([name, config], index) => ({
        id: `showcase_${index}`,
        name,
        description: (config as BadgeConfig).description,
        icon: (config as BadgeConfig).icon,
        color: (config as BadgeConfig).color,
        communityId: '',
        isActive: true
    }));

    return (
        <div className="space-y-8">
            
            {/* SECTION 1: ACTIVE EFFECTS & INVENTORY */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Inventory & Active Effects</h3>
                
                {/* Active Effects List */}
                {activeEffects.length > 0 && (
                    <div className="space-y-2 mb-6">
                        {activeEffects.map(effect => (
                            <div key={effect.id} className="flex justify-between items-center bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-green-400" />
                                    <span className="font-bold text-green-100">
                                        {effect.modifier}x XP Boost Active
                                    </span>
                                </div>
                                <span className="text-xs text-green-300">
                                    Expires in: {effect.expiresAt ? Math.ceil((new Date(effect.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : 0}h
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inventory Grid */}
                {inventory.length > 0 ? (
                    <div className="grid gap-4">
                        {inventory.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-700/30 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-2xl">
                                        {/* Render item icon if available in future, for now generic */}
                                        🎒
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{item.itemDetails?.name}</h4>
                                        <p className="text-xs text-slate-400 uppercase">{item.itemDetails?.itemType.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleUseItem(item)}
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${
                                        ['NAME_COLOR', 'TITLE', 'BANNER'].includes(item.itemDetails?.itemType || '')
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white' // Equip Color
                                        : 'bg-purple-600 hover:bg-purple-700 text-white' // Use Color
                                    }`}
                                >
                                    {['NAME_COLOR', 'TITLE', 'BANNER'].includes(item.itemDetails?.itemType || '') ? 'Equip' : 'Use Item'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-4 italic">Your inventory is empty. Visit the XP Store!</p>
                )}
            </div>

            {/* SECTION 2: BADGES */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Badge Collection</h3>
                {allBadges.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                        {allBadges.map((badge) => (
                            <div key={badge.id} className="flex flex-col items-center">
                                <BadgeItem badge={badge} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-700/30 rounded-xl border border-dashed border-slate-600">
                        <p className="text-slate-500">No badges configured yet.</p>
                    </div>
                )}
            </div>

            {/* SECTION 3: STREAK TIERS */}
            <StreakShowcase />
        </div>
    );
};

export default BadgeShowcase;