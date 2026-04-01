"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { updateCommunityBrandingAction } from '@/app/actions';

// Toggle Switch component
const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) => (
    <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${checked ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'
            }`} />
    </button>
);

export default function WhiteLabelSettings() {
    const { community, isFeatureEnabled } = useApp();
    const canWhiteLabel = isFeatureEnabled('white_label');

    // Form state
    const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
    const [customAppName, setCustomAppName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');
    const [customFooterText, setCustomFooterText] = useState('');
    const [hideMemberCount, setHideMemberCount] = useState(false);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Initialize form from community data
    useEffect(() => {
        if (community) {
            setWhiteLabelEnabled(community.whiteLabelEnabled ?? false);
            setCustomAppName(community.customAppName ?? '');
            setLogoUrl(community.logoUrl ?? '');
            setFaviconUrl(community.faviconUrl ?? '');
            setCustomFooterText(community.customFooterText ?? '');
            setHideMemberCount(community.hideMemberCount ?? false);
        }
    }, [community]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            const result = await updateCommunityBrandingAction({
                whiteLabelEnabled,
                customAppName: customAppName.trim() || undefined,
                logoUrl: logoUrl.trim() || undefined,
                faviconUrl: faviconUrl.trim() || undefined,
                customFooterText: customFooterText.trim() || undefined,
                hideMemberCount,
            });

            if (result.success) {
                setMessage({ type: 'success', text: 'Branding settings saved! Refresh the page to see changes.' });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving' });
        } finally {
            setIsSaving(false);
        }
    };

    // Feature locked state
    if (!canWhiteLabel) {
        return (
            <div className="bg-white/80 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🎨</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Custom Branding</h3>
                    <span className="bg-purple-100 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400 text-xs px-2 py-1 rounded-full font-semibold">
                        Elite Only
                    </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Customize your in-app branding with a custom name, logo, and footer text.
                </p>
                <a
                    href="/pricing"
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                    Upgrade to Elite →
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white/80 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🎨</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Custom Branding</h3>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                    <p className="text-slate-900 dark:text-white font-medium">Enable Custom Branding</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Replace CommunityXP references with your own name and logo</p>
                </div>
                <ToggleSwitch checked={whiteLabelEnabled} onChange={setWhiteLabelEnabled} />
            </div>

            {/* Branding Options */}
            <div className={`space-y-5 ${!whiteLabelEnabled ? 'opacity-50 pointer-events-none' : ''}`}>

                {/* Custom App Name */}
                <div>
                    <label className="block text-slate-800 dark:text-white text-sm font-medium mb-2">Custom App Name</label>
                    <input
                        type="text"
                        value={customAppName}
                        onChange={(e) => setCustomAppName(e.target.value)}
                        placeholder="Daily Score"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                    <p className="text-slate-500 text-xs mt-1">Replace &quot;CommunityXP&quot; with your custom name (e.g. &quot;Daily Score&quot;)</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                        <p className="text-blue-700 dark:text-blue-300 text-xs">
                            <strong>💡 Sidebar Tip:</strong> To also rename the app in your Whop sidebar, right-click (or long-press on mobile) on &quot;CommunityXP&quot; in the left menu and select <strong>&quot;Change visibility&quot;</strong> to update the App Name.
                        </p>
                    </div>
                </div>

                {/* Logo URL */}
                <div>
                    <label className="block text-slate-800 dark:text-white text-sm font-medium mb-2">Community Logo URL</label>
                    <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                    <p className="text-slate-500 text-xs mt-1">Used in sidebar header and as default favicon</p>
                </div>



                {/* Custom Footer Text */}
                <div>
                    <label className="block text-slate-800 dark:text-white text-sm font-medium mb-2">Custom Footer Text <span className="text-slate-500 font-normal">(optional)</span></label>
                    <input
                        type="text"
                        value={customFooterText}
                        onChange={(e) => setCustomFooterText(e.target.value)}
                        placeholder="Powered by Your Company"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                    <p className="text-slate-500 text-xs mt-1">If empty, footer text will be hidden</p>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Saving...
                        </>
                    ) : (
                        'Save Branding'
                    )}
                </button>

                {message && (
                    <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}
