"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { api } from '@/services/api'; // Already imported, which is correct

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
    // FIX: Removed 'updateUserProfile', it's not in the context
    const { selectedUser } = useApp();
    const [activeTab, setActiveTab] = useState<'select' | 'upload'>('select');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // State for DiceBear selection
    const [avatarStyle, setAvatarStyle] = useState(avatarStyles[0].id);
    const [avatarGridSeeds, setAvatarGridSeeds] = useState<string[]>([]);
    const [selectedAvatarSeed, setSelectedAvatarSeed] = useState('');

    // State for custom upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const generateSeeds = () => {
        const newSeeds = Array.from({ length: 6 }, () => Math.random().toString(36).substring(7));
        setAvatarGridSeeds(newSeeds);
        setSelectedAvatarSeed(newSeeds[0]);
    };

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setError('');
            setIsLoading(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            generateSeeds();
        }
    }, [isOpen]);

    useEffect(() => {
        generateSeeds();
    }, [avatarStyle]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
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
        setIsLoading(true);
        setError('');

        let newAvatarUrl: string | null = null;
        
        if (activeTab === 'select') {
            newAvatarUrl = `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(selectedAvatarSeed)}`;
        } else if (activeTab === 'upload' && selectedFile) {
            newAvatarUrl = await api.uploadAvatar(selectedFile);
            if (!newAvatarUrl) {
                setError('Failed to upload image. Please try again.');
                setIsLoading(false);
                return;
            }
        }
        
        if (newAvatarUrl) {
            // FIX: Call the 'api' service directly
// FIX: Pass the selectedUser.id so the API knows which row to update
const success = await api.updateUserProfile({ avatarUrl: newAvatarUrl }, selectedUser?.id);
if (success) {
    window.location.reload(); // Force refresh to show new avatar
    onClose();
} else {
                setError('Failed to update profile. Please try again.');
            }
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 w-full max-w-md text-white p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-4">Update Avatar</h2>
                
                {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center text-sm mb-4">{error}</p>}
                
                {/* Tabs */}
                <div className="flex border-b border-slate-700 mb-4">
                    <button 
                        onClick={() => setActiveTab('select')}
                        className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'select' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        Select Avatar
                    </button>
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'upload' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        Upload Image
                    </button>
                </div>
                
                {/* Tab Content */}
                <div className="space-y-4">
                    {activeTab === 'select' && (
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="modal-avatar-style" className="block text-sm font-medium text-slate-400 mb-2">
                                    Avatar Style
                                </label>
                                <select
                                    id="modal-avatar-style"
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
                                    className={`rounded-full p-1 transition-all duration-200 ${selectedAvatarSeed === seed ? 'ring-2 ring-purple-500' : ''}`}
                                >
                                    <img 
                                        src={`https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`} 
                                        alt="Avatar option"
                                        className="w-full h-full rounded-full bg-slate-700"
                                    />
                                </button>
                                ))}
                            </div>
                            <button type="button" onClick={generateSeeds} className="w-full text-sm bg-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-md hover:bg-slate-600">
                                Generate More
                            </button>
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="space-y-4">
                             <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover"/>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg className="w-8 h-8 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                                            <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-slate-500">PNG, JPG or GIF (MAX. 2MB)</p>
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
                <div className="flex gap-4 mt-6">
                    <button 
                        onClick={onClose}
                        className="w-full bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors"
                    >
                        Cancel
                    </button>
                     <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-500 disabled:cursor-wait"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarUpdateModal;