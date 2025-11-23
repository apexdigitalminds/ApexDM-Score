"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { api } from '@/services/api';

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
    const { selectedUser, fetchAllUsers } = useApp(); 
    const [activeTab, setActiveTab] = useState<'select' | 'upload'>('select');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Username State
    const [newUsername, setNewUsername] = useState('');

    // DiceBear State
    const [avatarStyle, setAvatarStyle] = useState(avatarStyles[0].id);
    const [avatarGridSeeds, setAvatarGridSeeds] = useState<string[]>([]);
    const [selectedAvatarSeed, setSelectedAvatarSeed] = useState('');

    // Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const generateSeeds = () => {
        const newSeeds = Array.from({ length: 6 }, () => Math.random().toString(36).substring(7));
        setAvatarGridSeeds(newSeeds);
        setSelectedAvatarSeed(newSeeds[0]);
    };

    useEffect(() => {
        if (isOpen && selectedUser) {
            setError('');
            setIsLoading(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            setNewUsername(selectedUser.username || ''); // Pre-fill current username
            generateSeeds();
        }
    }, [isOpen, selectedUser]);

    useEffect(() => {
        generateSeeds();
    }, [avatarStyle]);

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
        }
    };
    
    const handleSave = async () => {
        if (!selectedUser) return;
        
        setIsLoading(true);
        setError('');

        let avatarUrlToSave: string | undefined = undefined;
        
        try {
            // Handle Avatar Logic
            if (activeTab === 'select') {
                // Only update if they explicitly interacted with the grid, otherwise keep existing
                // But here we assume if they are on this tab, they might want this one. 
                // Let's simply generate the URL for the selected seed.
                avatarUrlToSave = `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(selectedAvatarSeed)}`;
            } else if (activeTab === 'upload' && selectedFile) {
                const uploadedUrl = await api.uploadAvatar(selectedFile, selectedUser.id);
                if (!uploadedUrl) throw new Error('Failed to upload image.');
                avatarUrlToSave = uploadedUrl;
            }

            // Prepare Update Object
            const updates: { avatarUrl?: string; username?: string } = {};
            
            // Only include avatar if it changed (simplified logic: always send if generated/uploaded)
            if (avatarUrlToSave) updates.avatarUrl = avatarUrlToSave;
            
            // Only include username if it changed and isn't empty
            if (newUsername.trim() !== '' && newUsername !== selectedUser.username) {
                updates.username = newUsername;
            }

            // Call API
            if (Object.keys(updates).length > 0) {
                const success = await api.updateUserProfile(updates, selectedUser.id);
                if (success) {
                    await fetchAllUsers(); 
                    window.location.reload(); 
                    onClose();
                } else {
                    throw new Error('Failed to update profile in database.');
                }
            } else {
                onClose(); // Nothing changed
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 w-full max-w-md text-white p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Edit Profile</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>
                
                {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center text-sm mb-4">{error}</p>}
                
                {/* Username Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
                    <input 
                        type="text" 
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter username"
                    />
                </div>

                <h3 className="text-sm font-medium text-slate-400 mb-3">Profile Picture</h3>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 mb-4">
                    <button 
                        onClick={() => setActiveTab('select')}
                        className={`flex-1 py-2 font-semibold transition-colors ${activeTab === 'select' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        Avatar Library
                    </button>
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-2 font-semibold transition-colors ${activeTab === 'upload' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        Upload Custom
                    </button>
                </div>
                
                {/* Tab Content */}
                <div className="space-y-4">
                    {activeTab === 'select' && (
                        <div className="space-y-4">
                             <div>
                                <select
                                    value={avatarStyle}
                                    onChange={(e) => setAvatarStyle(e.target.value)}
                                    className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3"
                                >
                                    {avatarStyles.map(style => (
                                    <option key={style.id} value={style.id}>{style.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {avatarGridSeeds.map(seed => (
                                <button
                                    type="button"
                                    key={seed}
                                    onClick={() => setSelectedAvatarSeed(seed)}
                                    className={`rounded-full p-1 transition-all duration-200 ${selectedAvatarSeed === seed ? 'ring-2 ring-purple-500 bg-purple-500/20' : ''}`}
                                >
                                    <img 
                                        src={`https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`} 
                                        alt="Avatar option"
                                        className="w-full h-full rounded-full bg-slate-700/50"
                                    />
                                </button>
                                ))}
                            </div>
                            <button type="button" onClick={generateSeeds} className="w-full text-sm bg-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-md hover:bg-slate-600">
                                Shuffle Options 🎲
                            </button>
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="space-y-4">
                             <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition-colors group">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-slate-500"/>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400 group-hover:text-white">
                                            <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs">PNG, JPG or GIF (MAX. 2MB)</p>
                                        </div>
                                    )}
                                    <input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} />
                                </label>
                            </div> 
                            {selectedFile && <p className="text-center text-sm text-slate-400">Selected: {selectedFile.name}</p>}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8 pt-4 border-t border-slate-700">
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                     <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600 disabled:cursor-wait"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarUpdateModal;