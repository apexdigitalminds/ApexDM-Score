"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { UserInventoryItem } from '@/types';
import { api } from '@/services/api';
import { SparklesIcon, ClockIcon } from './icons';

// Helper Icons
const ChestIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
        <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

const BeakerIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12.22 2.026A1.199 1.199 0 0 1 12 2.25a.75.75 0 1 0 0 1.5 2.7 2.7 0 0 1 .626.072l.084.025a.75.75 0 0 0 .42-1.44l-.083-.025a1.2 1.2 0 0 0-.827-.356zm-3.506.227a.75.75 0 0 0-.42 1.44l.083.024c.206.06.416.084.626.072a.75.75 0 0 0 0-1.5 2.7 2.7 0 0 1-.22-.236 1.2 1.2 0 0 0-.069-.025zm11.161 12.61a.75.75 0 0 0-1.06 1.06l.212.212a.75.75 0 0 0 1.061-1.06l-.213-.212zM12 6.75a.75.75 0 0 0-.75.75v11.25c0 .207.084.405.232.55l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0 .233-.55V7.5a.75.75 0 0 0-.75-.75H12z" clipRule="evenodd" />
        <path d="M7.336 18.849a.75.75 0 0 1-1.061 0l-3-3a.75.75 0 0 1 .233-.55V7.5a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 .75.75v7.799a.75.75 0 0 1 .232.55l-3 3H7.336z" />
    </svg>
);

interface InventorySectionProps {
    inventory?: UserInventoryItem[];
    activeEffects?: any[];
    history?: any[];
    userMetadata?: any; 
    onRefresh?: () => void;
}

const InventorySection: React.FC<InventorySectionProps> = ({ 
    inventory = [], 
    activeEffects = [], 
    history = [], 
    userMetadata = null,
    onRefresh 
}) => {
    const { selectedUser, activateInventoryItem } = useApp();
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
    
    // Optimistic State
    const [localMetadata, setLocalMetadata] = useState<any>(userMetadata || selectedUser?.metadata || {});

    // Sync effect
    useEffect(() => {
        if (userMetadata) {
            setLocalMetadata(userMetadata);
        } else if (selectedUser?.metadata) {
            setLocalMetadata(selectedUser.metadata);
        }
    }, [userMetadata, selectedUser?.metadata]);

    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [unequippingType, setUnequippingType] = useState<string | null>(null);

    const showToast = (msg: string, type: 'success'|'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleEquip = async (item: UserInventoryItem) => {
        if (!item.itemDetails || !selectedUser) return;
        
        setProcessingIds(prev => new Set(prev).add(item.id));
        const prevMetadata = { ...localMetadata };

        const type = item.itemDetails.itemType;
        const newMeta = { ...localMetadata };
        
        if (type === 'NAME_COLOR') newMeta.nameColor = item.itemDetails.metadata?.color;
        if (type === 'TITLE') newMeta.title = item.itemDetails.metadata?.text;
        if (type === 'BANNER') newMeta.bannerUrl = item.itemDetails.metadata?.imageUrl;
        if (type === 'AVATAR_PULSE') newMeta.avatarPulseColor = item.itemDetails.metadata?.color;
        
        setLocalMetadata(newMeta);

        try {
            const result = await api.equipCosmetic(selectedUser.id, item.itemDetails);
            if (result.success) {
                showToast("Equipped!");
                if (onRefresh) onRefresh();
            } else {
                throw new Error(result.message);
            }
        } catch (e: any) { 
            showToast(e.message || "Failed to equip.", 'error'); 
            setLocalMetadata(prevMetadata); 
        } finally {
            setProcessingIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
        }
    };

    const handleUnequip = async (type: string) => {
        if (!selectedUser) return;
        setUnequippingType(type); 
        
        const prevMetadata = { ...localMetadata };
        const newMeta = { ...localMetadata };

        if (type === 'NAME_COLOR') delete newMeta.nameColor;
        if (type === 'TITLE') delete newMeta.title;
        if (type === 'BANNER') delete newMeta.bannerUrl;
        if (type === 'AVATAR_PULSE') delete newMeta.avatarPulseColor;
        
        setLocalMetadata(newMeta);

        try {
            const result = await api.unequipCosmetic(selectedUser.id, type);
            if (result.success) {
                showToast("Unequipped.");
                if (onRefresh) onRefresh();
            } else {
                throw new Error(result.message);
            }
        } catch (e: any) { 
            showToast(e.message || "Failed to unequip.", 'error');
            setLocalMetadata(prevMetadata);
        } finally {
            setUnequippingType(null);
        }
    };

    const handleUseItem = async (item: UserInventoryItem) => {
        if (!item.itemDetails) return;
        setProcessingIds(prev => new Set(prev).add(item.id));
        
        const result = await activateInventoryItem(item.id);
        if (result.success) {
             showToast(result.message);
             if (onRefresh) onRefresh();
        } else {
             showToast(result.message, 'error');
        }
        setProcessingIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
    };

    // Filter Items
    const visibleInventory = inventory.filter(i => !processingIds.has(i.id));
    
    // 🟢 Group Consumables Logic
    const rawConsumables = visibleInventory.filter(i => ['INSTANT', 'TIMED_EFFECT'].includes(i.itemDetails?.itemType || ''));
    
    // Group by ID to show counters
    const groupedConsumables = Object.values(rawConsumables.reduce((acc, item) => {
        const key = item.itemDetails?.id || 'unknown';
        if (!acc[key]) {
            acc[key] = { item, count: 0 };
        }
        acc[key].count++;
        return acc;
    }, {} as Record<string, { item: UserInventoryItem, count: number }>));

    const wearables = visibleInventory.filter(i => {
        const type = i.itemDetails?.itemType || '';
        if (['INSTANT', 'TIMED_EFFECT'].includes(type)) return false;
        
        const meta = localMetadata || {};
        const itemMeta = i.itemDetails?.metadata;
        if (!itemMeta) return true;

        if (type === 'NAME_COLOR' && meta.nameColor === itemMeta.color) return false;
        if (type === 'TITLE' && meta.title === itemMeta.text) return false;
        if (type === 'BANNER' && meta.bannerUrl === itemMeta.imageUrl) return false;
        if (type === 'AVATAR_PULSE' && meta.avatarPulseColor === itemMeta.color) return false;

        return true;
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative">
             {toast && (
                <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl font-bold z-50 animate-fade-in-up ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* COL 1: Active Effects */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-yellow-400" /> Active & Equipped
                </h3>
                
                <div className="space-y-3 flex-grow">
                    {/* Active Buffs */}
                    {activeEffects.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Boosts</h4>
                            {activeEffects.map(effect => (
                                <div key={effect.id} className="flex justify-between items-center bg-green-900/20 border border-green-500/30 p-3 rounded-lg mb-2">
                                    <span className="text-sm font-bold text-green-100">{effect.modifier}x XP Boost</span>
                                    <span className="text-xs text-green-300">
                                        Expires: {effect.expiresAt ? new Date(effect.expiresAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Cosmetics</h4>
                        {/* 🟢 Muted Unequip Button Style */}
                        {localMetadata?.nameColor && (
                            <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: localMetadata.nameColor }}></div>
                                    <span className="text-sm text-slate-300">Name Color</span>
                                </div>
                                <button onClick={() => handleUnequip('NAME_COLOR')} disabled={!!unequippingType} className="px-3 py-1 rounded text-[10px] font-bold bg-slate-700 text-slate-300 hover:bg-red-900/80 hover:text-red-200 transition-colors border border-slate-600">
                                    {unequippingType === 'NAME_COLOR' ? '...' : 'Unequip'}
                                </button>
                            </div>
                        )}
                        {localMetadata?.title && (
                            <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">TITLE</span>
                                    <span className="text-sm text-white font-bold">{localMetadata.title}</span>
                                </div>
                                <button onClick={() => handleUnequip('TITLE')} disabled={!!unequippingType} className="px-3 py-1 rounded text-[10px] font-bold bg-slate-700 text-slate-300 hover:bg-red-900/80 hover:text-red-200 transition-colors border border-slate-600">
                                    {unequippingType === 'TITLE' ? '...' : 'Unequip'}
                                </button>
                            </div>
                        )}
                        {localMetadata?.avatarPulseColor && (
                            <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: localMetadata.avatarPulseColor, boxShadow: `0 0 5px ${localMetadata.avatarPulseColor}` }}></div>
                                <span className="text-sm text-slate-300">Avatar Pulse</span>
                            </div>
                            <button onClick={() => handleUnequip('AVATAR_PULSE')} disabled={!!unequippingType} className="px-3 py-1 rounded text-[10px] font-bold bg-slate-700 text-slate-300 hover:bg-red-900/80 hover:text-red-200 transition-colors border border-slate-600">
                                {unequippingType === 'AVATAR_PULSE' ? '...' : 'Unequip'}
                            </button>
                        </div>
                        )}
                        {localMetadata?.bannerUrl && (
                            <div className="bg-slate-700/30 border border-slate-600 p-3 rounded-lg flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <img src={localMetadata.bannerUrl} alt="Banner" className="w-8 h-5 object-cover rounded border border-slate-500" />
                                    <span className="text-sm text-slate-300">Banner</span>
                                </div>
                                <button onClick={() => handleUnequip('BANNER')} disabled={!!unequippingType} className="px-3 py-1 rounded text-[10px] font-bold bg-slate-700 text-slate-300 hover:bg-red-900/80 hover:text-red-200 transition-colors border border-slate-600">
                                    {unequippingType === 'BANNER' ? '...' : 'Unequip'}
                                </button>
                            </div>
                        )}

                        {activeEffects.length === 0 && !localMetadata?.nameColor && !localMetadata?.title && !localMetadata?.bannerUrl && !localMetadata?.avatarPulseColor && (
                            <p className="text-slate-500 text-sm italic text-center py-4">No active items.</p>
                        )}
                    </div>
                </div>
                
                 {history.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Recent Usage</h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                {history.map((log: any) => (
                                    <div key={log.id} className="flex justify-between text-[10px] bg-slate-900/30 p-1.5 rounded">
                                        <span className="text-slate-300">{log.item_name}</span>
                                        <span className="text-slate-500">{new Date(log.used_at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                    </div>
                )}
            </div>

            {/* COL 2: Consumables (Grouped) */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BeakerIcon className="w-5 h-5 text-blue-400" /> Consumables
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {groupedConsumables.length > 0 ? groupedConsumables.map(({ item, count }) => (
                        <div key={item.id} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 flex justify-between items-center relative">
                            {/* 🟢 Counter Badge */}
                            {count > 1 && (
                                <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-800 shadow-sm z-10">
                                    {count}x
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-sm text-white">{item.itemDetails?.name}</p>
                                <p className="text-[10px] text-slate-400">{item.itemDetails?.description}</p>
                            </div>
                            <button 
                                onClick={() => handleUseItem(item)}
                                className="px-3 py-1.5 rounded text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-lg shadow-purple-500/20"
                            >
                                Use
                            </button>
                        </div>
                    )) : <p className="text-slate-500 text-sm italic text-center py-8">No consumables.</p>}
                </div>
            </div>

            {/* COL 3: Wearables */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ChestIcon className="w-5 h-5 text-amber-400" /> Wearables
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {wearables.length > 0 ? wearables.map(item => (
                        <div key={item.id} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-sm text-white">{item.itemDetails?.name}</p>
                                <p className="text-[10px] text-slate-400">{item.itemDetails?.description}</p>
                            </div>
                            <button 
                                onClick={() => handleEquip(item)}
                                className="px-3 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Equip
                            </button>
                        </div>
                    )) : <p className="text-slate-500 text-sm italic text-center py-8">No available wearables.</p>}
                </div>
            </div>
        </div>
    );
};

export default InventorySection;