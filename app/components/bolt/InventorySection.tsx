"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { UserInventoryItem } from '@/types';
import { api } from '@/services/api';
// FIX: Removed unused ArchiveBoxIcon and XMarkIcon imports
import { SparklesIcon } from './icons';

// Helper Icon for Backpack
const ChestIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
        <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

const InventorySection: React.FC = () => {
    const { getUserInventory, selectedUser, activateInventoryItem, activeEffects, fetchAllUsers } = useApp();
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

    useEffect(() => {
        if (selectedUser) {
            getUserInventory(selectedUser.id).then(setInventory);
        }
    }, [selectedUser, getUserInventory]);

    const showToast = (msg: string, type: 'success'|'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleRefresh = async () => {
        if (selectedUser) {
            const items = await getUserInventory(selectedUser.id);
            setInventory(items);
            await fetchAllUsers(); // Refreshes global user state (metadata)
        }
    };

    const handleEquip = async (item: UserInventoryItem) => {
        if (!item.itemDetails || !selectedUser) return;
        setIsLoading(true);
        try {
            const result = await api.equipCosmetic(selectedUser.id, item.itemDetails);
            if (result.success) {
                showToast("Equipped successfully!");
                await handleRefresh();
            } else {
                showToast(result.message, 'error');
            }
        } catch (e) { showToast("Failed to equip.", 'error'); }
        setIsLoading(false);
    };

    const handleUnequip = async (type: 'NAME_COLOR' | 'TITLE' | 'BANNER' | 'FRAME' | 'AVATAR_PULSE') => {
        if (!selectedUser) return;
        setIsLoading(true);
        try {
            const result = await api.unequipCosmetic(selectedUser.id, type);
            if (result.success) {
                showToast("Unequipped.");
                await handleRefresh();
            }
        } catch (e) { showToast("Failed to unequip.", 'error'); }
        setIsLoading(false);
    };

    const handleUseItem = async (item: UserInventoryItem) => {
        if (!item.itemDetails) return;
        setIsLoading(true);
        const result = await activateInventoryItem(item.id);
        if (result.success) {
             showToast(result.message);
             await handleRefresh();
        } else {
             showToast(result.message, 'error');
        }
        setIsLoading(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 relative">
            {toast && (
                <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl font-bold z-50 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}

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
                            <span className="text-sm font-bold text-green-100">{effect.modifier}x XP Boost</span>
                            <span className="text-xs text-green-300">Active</span>
                        </div>
                    ))}

                    {/* Equipped Cosmetics */}
                    {selectedUser?.metadata?.nameColor && (
                        <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: selectedUser.metadata.nameColor }}></div>
                                <span className="text-sm text-slate-300">Name Color</span>
                            </div>
                            <button onClick={() => handleUnequip('NAME_COLOR')} className="text-xs text-red-400 hover:text-red-300 hover:underline">Unequip</button>
                        </div>
                    )}
                    
                    {selectedUser?.metadata?.title && (
                        <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">TITLE</span>
                                <span className="text-sm text-white font-bold">{selectedUser.metadata.title}</span>
                            </div>
                            <button onClick={() => handleUnequip('TITLE')} className="text-xs text-red-400 hover:text-red-300 hover:underline">Unequip</button>
                        </div>
                    )}

                    {selectedUser?.metadata?.avatarPulseColor && (
                        <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: selectedUser.metadata.avatarPulseColor, boxShadow: `0 0 5px ${selectedUser.metadata.avatarPulseColor}` }}></div>
                                <span className="text-sm text-slate-300">Avatar Pulse</span>
                            </div>
                            <button onClick={() => handleUnequip('AVATAR_PULSE')} className="text-xs text-red-400 hover:text-red-300 hover:underline">Unequip</button>
                        </div>
                    )}

                    {selectedUser?.metadata?.bannerUrl && (
                         <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <img src={selectedUser.metadata.bannerUrl} alt="Banner" className="w-8 h-5 object-cover rounded border border-slate-500" />
                                <span className="text-sm text-slate-300">Profile Banner</span>
                            </div>
                            <button onClick={() => handleUnequip('BANNER')} className="text-xs text-red-400 hover:text-red-300 hover:underline">Unequip</button>
                        </div>
                    )}
                    
                    {activeEffects.length === 0 && !selectedUser?.metadata?.nameColor && !selectedUser?.metadata?.title && !selectedUser?.metadata?.bannerUrl && !selectedUser?.metadata?.avatarPulseColor && (
                        <p className="text-slate-500 text-sm italic text-center py-4">No active effects or cosmetics.</p>
                    )}
                </div>
            </div>

            {/* RIGHT: Backpack */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ChestIcon className="w-5 h-5 text-amber-400" />
                    Backpack
                </h3>
                
                {inventory.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {inventory.map(item => {
                             const type = (item.itemDetails?.itemType || '').toUpperCase();
                             const isCosmetic = ['NAME_COLOR', 'TITLE', 'BANNER', 'FRAME', 'AVATAR_PULSE'].includes(type);
                             
                             return (
                                <div key={item.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm text-white">{item.itemDetails?.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{type.replace('_', ' ')}</p>
                                    </div>
                                    {isCosmetic ? (
                                         <button 
                                            onClick={() => handleEquip(item)}
                                            disabled={isLoading}
                                            className="px-3 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                        >
                                            Equip
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleUseItem(item)}
                                            disabled={isLoading}
                                            className="px-3 py-1.5 rounded text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                                        >
                                            Use
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm italic text-center py-4">Empty. Visit the Store to buy items.</p>
                )}
            </div>
        </div>
    );
};

export default InventorySection;