"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { UserInventoryItem } from '@/types';
import { api } from '@/services/api';
import { SparklesIcon } from './icons';

const InventorySection: React.FC = () => {
    const { getUserInventory, selectedUser, activateInventoryItem, activeEffects, fetchAllUsers } = useApp();
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedUser) {
            getUserInventory(selectedUser.id).then(setInventory);
        }
    }, [selectedUser, getUserInventory]);

    const handleRefresh = async () => {
        if (selectedUser) {
            const items = await getUserInventory(selectedUser.id);
            setInventory(items);
            await fetchAllUsers();
        }
    };

    const handleUseItem = async (item: UserInventoryItem) => {
        if (!item.itemDetails) return;
        setIsLoading(true);

        const type = (item.itemDetails.itemType || '').toUpperCase();
        const isCosmetic = ['NAME_COLOR', 'TITLE', 'BANNER', 'FRAME', 'AVATAR_PULSE'].includes(type);

        if (isCosmetic) {
            const result = await api.equipCosmetic(selectedUser!.id, item.itemDetails);
            alert(result.message);
        } else {
            const result = await activateInventoryItem(item.id);
            alert(result.message);
        }

        await handleRefresh();
        setIsLoading(false);
    };

    // Separate items
    const consumables = inventory.filter(i => ['INSTANT', 'TIMED_EFFECT'].includes(i.itemDetails?.itemType || ''));
    const cosmetics = inventory.filter(i => !['INSTANT', 'TIMED_EFFECT'].includes(i.itemDetails?.itemType || ''));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* LEFT: Active & Equipped */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-yellow-400" />
                    Active & Equipped
                </h3>
                
                <div className="space-y-3">
                    {/* Active Buffs */}
                    {activeEffects.map(effect => (
                        <div key={effect.id} className="flex justify-between items-center bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
                            <span className="text-sm font-bold text-green-100">
                                {effect.modifier}x XP Boost
                            </span>
                            <span className="text-xs text-green-300">
                                {effect.expiresAt ? Math.ceil((new Date(effect.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : 0}h left
                            </span>
                        </div>
                    ))}
                    
                    {/* Equipped Cosmetics Summary */}
                    {selectedUser?.metadata?.title && (
                        <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg text-sm">
                            <span className="text-slate-400">Title:</span> <span className="text-white font-bold">{selectedUser.metadata.title}</span>
                        </div>
                    )}
                    {selectedUser?.metadata?.nameColor && (
                        <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <span className="text-slate-400">Name Color:</span> 
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedUser.metadata.nameColor }}></div>
                        </div>
                    )}
                    
                    {activeEffects.length === 0 && !selectedUser?.metadata?.title && !selectedUser?.metadata?.nameColor && (
                        <p className="text-slate-500 text-sm italic">No active effects or cosmetics.</p>
                    )}
                </div>
            </div>

            {/* RIGHT: Backpack */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Backpack</h3>
                
                {inventory.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {inventory.map(item => {
                             const type = (item.itemDetails?.itemType || '').toUpperCase();
                             const isCosmetic = ['NAME_COLOR', 'TITLE', 'BANNER', 'FRAME', 'AVATAR_PULSE'].includes(type);
                             
                             return (
                                <div key={item.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                                    <div>
                                        <p className="font-bold text-sm text-white">{item.itemDetails?.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{type.replace('_', ' ')}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleUseItem(item)}
                                        disabled={isLoading}
                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                                            isCosmetic ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                                        }`}
                                    >
                                        {isLoading ? '...' : (isCosmetic ? 'Equip' : 'Use')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm italic">Empty. Visit the Store to buy items.</p>
                )}
            </div>
        </div>
    );
};

export default InventorySection;