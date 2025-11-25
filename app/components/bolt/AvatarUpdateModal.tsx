"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { api } from '@/services/api';
import { UserInventoryItem, StoreItem } from '@/types';

const avatarStyles = [
  { id: 'lorelei', name: 'Illustrative' },
  { id: 'adventurer', name: 'Adventurer' },
  { id: 'bottts', name: 'Robots' },
  { id: 'pixel-art', name: 'Pixel Art' },
  { id: 'micah', name: 'Avatars' },
  { id: 'miniavs', name: 'Minimalist' },
];

interface AvatarUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AvatarUpdateModal: React.FC<AvatarUpdateModalProps> = ({ isOpen, onClose }) => {
    const { selectedUser, fetchAllUsers, getUserInventory } = useApp(); 
    const [activeTab, setActiveTab] = useState<'select' | 'upload' | 'cosmetics'>('select');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [inventory, setInventory] = useState<UserInventoryItem[]>([]);

    // 🟢 FIX: Track if avatar was actually changed
    const [isAvatarDirty, setIsAvatarDirty] = useState(false);

    const [newUsername, setNewUsername] = useState('');
    const [avatarStyle, setAvatarStyle] = useState(avatarStyles[0].id);
    const [avatarGridSeeds, setAvatarGridSeeds] = useState<string[]>([]);
    const [selectedAvatarSeed, setSelectedAvatarSeed] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const generateSeeds = () => {
        const newSeeds = Array.from({ length: 6 }, () => Math.random().toString(36).substring(7));
        setAvatarGridSeeds(newSeeds);
        // Don't auto-select first one to avoid accidental overwrite, let user click
    };

    useEffect(() => {
        if (isOpen && selectedUser) {
            setError('');
            setIsLoading(false);
            setIsAvatarDirty(false); // Reset dirty state
            setSelectedFile(null);
            // 🟢 FIX: Show current avatar as preview
            setPreviewUrl(selectedUser.avatarUrl || null);
            setNewUsername(selectedUser.username || '');
            generateSeeds();
            getUserInventory(selectedUser.id).then(setInventory);
        }
    }, [isOpen, selectedUser]);

    useEffect(() => {
        // Generate seeds when style changes, but don't auto-select
        generateSeeds();
    }, [avatarStyle]);

    const handleSelectSeed = (seed: string) => {
        setSelectedAvatarSeed(seed);
        setIsAvatarDirty(true); // 🟢 User explicitly chose a DiceBear
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('File size cannot exceed 2MB.');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                setError('Please select a valid image file (JPG, PNG, GIF).');
                return;
            }
            setError('');
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setIsAvatarDirty(true); // 🟢 User explicitly chose a File
        }
    };
    
    const handleEquip = async (item: StoreItem) => {
        if (!selectedUser) return;
        setIsLoading(true);
        try {
            const result = await api.equipCosmetic(selectedUser.id, item);
            if (result.success) {
                await fetchAllUsers(); 
                alert("Equipped!");
            } else {
                setError(result.message);
            }
        } catch (err) { setError("Failed to equip item."); }
        finally { setIsLoading(false); }
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        setIsLoading(true);
        setError('');

        let avatarUrlToSave: string | undefined = undefined;
        
        try {
            // 🟢 FIX: Only process avatar if dirty
            if (isAvatarDirty) {
                if (activeTab === 'select' && selectedAvatarSeed) {
                    avatarUrlToSave = `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(selectedAvatarSeed)}`;
                } else if (activeTab === 'upload' && selectedFile) {
                    const uploadedUrl = await api.uploadAvatar(selectedFile, selectedUser.id);
                    if (!uploadedUrl) throw new Error('Failed to upload image.');
                    avatarUrlToSave = uploadedUrl;
                }
            }

            const updates: { avatarUrl?: string; username?: string } = {};
            if (avatarUrlToSave) updates.avatarUrl = avatarUrlToSave;
            if (newUsername.trim() !== '' && newUsername !== selectedUser.username) {
                updates.username = newUsername;
            }

            if (Object.keys(updates).length > 0) {
                const success = await api.updateUserProfile(updates, selectedUser.id);
                if (success) {
                    await fetchAllUsers(); 
                    window.location.reload(); 
                    onClose();
                } else {
                    throw new Error('Failed to update profile.');
                }
            } else {
                onClose();
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const cosmetics = inventory.filter(i => ['NAME_COLOR', 'TITLE', 'BANNER', 'FRAME'].includes(i.itemDetails?.itemType || ''));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 w-full max-w-md text-white p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Edit Profile</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>
                
                {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center text-sm mb-4">{error}</p>}
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" placeholder="Enter username" />
                </div>

                <h3 className="text-sm font-medium text-slate-400 mb-3">Profile Customization</h3>
                <div className="flex border-b border-slate-700 mb-4 text-sm">
                    <button onClick={() => setActiveTab('select')} className={`flex-1 py-2 font-semibold transition-colors ${activeTab === 'select' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>Avatar Library</button>
                    <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 font-semibold transition-colors ${activeTab === 'upload' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>Upload</button>
                    <button onClick={() => setActiveTab('cosmetics')} className={`flex-1 py-2 font-semibold transition-colors ${activeTab === 'cosmetics' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>Cosmetics</button>
                </div>
                
                <div className="space-y-4 min-h-[200px]">
                    {activeTab === 'select' && (
                        <div className="space-y-4">
                             <div>
                                <select value={avatarStyle} onChange={(e) => setAvatarStyle(e.target.value)} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3">
                                    {avatarStyles.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {avatarGridSeeds.map(seed => (
                                <button type="button" key={seed} onClick={() => handleSelectSeed(seed)} className={`rounded-full p-1 transition-all duration-200 ${selectedAvatarSeed === seed && isAvatarDirty ? 'ring-2 ring-purple-500 bg-purple-500/20' : ''}`}>
                                    <img src={`https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`} alt="Avatar" className="w-full h-full rounded-full bg-slate-700/50"/>
                                </button>
                                ))}
                            </div>
                            <button type="button" onClick={generateSeeds} className="w-full text-sm bg-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-md hover:bg-slate-600">Shuffle 🎲</button>
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="space-y-4">
                             <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition-colors group">
                                    {previewUrl ? <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-slate-500"/> : <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400 group-hover:text-white"><p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span></p><p className="text-xs">MAX. 2MB</p></div>}
                                    <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div> 
                            {selectedFile && <p className="text-center text-sm text-slate-400">Selected: {selectedFile.name}</p>}
                        </div>
                    )}

                    {activeTab === 'cosmetics' && (
                        <div className="space-y-2">
                            {cosmetics.length === 0 ? <p className="text-slate-500 text-center italic py-8">You don't own any cosmetics yet.</p> : cosmetics.map(ci => (
                                <div key={ci.id} className="flex justify-between items-center bg-slate-700/30 p-3 rounded border border-slate-700">
                                    <div><p className="font-bold text-sm">{ci.itemDetails?.name}</p><span className="text-xs text-slate-400 uppercase">{ci.itemDetails?.itemType.replace('_', ' ')}</span></div>
                                    <button onClick={() => ci.itemDetails && handleEquip(ci.itemDetails)} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded transition-colors">Equip</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {activeTab !== 'cosmetics' && (
                    <div className="flex gap-4 mt-8 pt-4 border-t border-slate-700">
                        <button onClick={onClose} className="flex-1 bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={isLoading} className="flex-1 bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-500 disabled:cursor-wait">{isLoading ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvatarUpdateModal;