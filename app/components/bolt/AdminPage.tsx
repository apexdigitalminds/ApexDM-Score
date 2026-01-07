"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";
import type {
    Reward,
    Profile,
    ActionType,
    BadgeConfig,
    Quest,
    QuestTask,
    StoreItem,
    ItemType,
    Badge,
    Action
} from "@/types";

import Leaderboard from "./Leaderboard";
import FeatureLock from "./analytics/FeatureLock";
import ActionLogModal from "./ActionLogModal";
import ConfirmationModal from "./ConfirmationModal";
import WhiteLabelSettings from "./WhiteLabelSettings"; // 🆕 White-label branding
import OnboardingModal from "./OnboardingModal"; // 🆕 First-visit wizard
import GettingStartedCard from "./GettingStartedCard"; // 🆕 Setup guide
import { iconMap, iconMapKeys, LockClosedIcon, TrophyIcon, UserGroupIcon, ShoppingCartIcon, SparklesIcon, LogoIcon, ClockIcon } from "./icons";

// Inlined Icons
const CreditCardIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
);

const ChatBubbleLeftIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
);

// Toggle Component
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <div
        onClick={(e) => {
            e.stopPropagation();
            onChange(!checked);
        }}
        className={`relative w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${checked ? 'bg-green-500' : 'bg-slate-600'
            }`}
    >
        <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'
                }`}
        ></div>
    </div>
);

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    locked?: boolean;
}> = ({ active, onClick, label, icon, locked }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${active
            ? "bg-purple-600 text-white shadow-lg"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
    >
        {icon}
        <span>{label}</span>
        {locked && <LockClosedIcon className="w-3 h-3 text-white/50 ml-1" />}
    </button>
);

export default function AdminPage() {
    const {
        allUsers, rewardsConfig, badgesConfig, community, questsAdmin, storeItems,
        selectedUser: adminUser, handleRecordAction, handleAwardBadge, handleAddReward, handleUpdateReward, handleDeleteReward, handleRestoreReward,
        handleAddBadge, handleUpdateBadge, handleDeleteBadge, handleRestoreBadge, handleTriggerWebhook, isFeatureEnabled,
        handleCreateQuest, handleUpdateQuest, handleDeleteQuest, handleRestoreQuest, handleToggleQuest,
        handleCreateStoreItem, handleUpdateStoreItem, handleDeleteStoreItem, handleRestoreStoreItem, handleToggleStoreItemActive,
        adminUpdateUserStats, adminUpdateUserRole, adminBanUser, adminGetUserEmail, getAllUserActions, fetchAllUsers, adminUpdateCommunityTier,
        handleToggleWhiteLabel,
        getUserItemUsage
    } = useApp();

    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'engagement' | 'quests' | 'store' | 'settings' | 'subscription'>('users');

    const [localRewards, setLocalRewards] = useState(rewardsConfig);
    const [localBadges, setLocalBadges] = useState(badgesConfig);
    const [localQuests, setLocalQuests] = useState(questsAdmin);
    const [localStore, setLocalStore] = useState(storeItems);

    // Check if we are in development mode
    const isDev = process.env.NODE_ENV === 'development';

    useEffect(() => { setLocalRewards(rewardsConfig); }, [rewardsConfig]);
    useEffect(() => { setLocalBadges(badgesConfig); }, [badgesConfig]);
    useEffect(() => { setLocalQuests(questsAdmin); }, [questsAdmin]);
    useEffect(() => { setLocalStore(storeItems); }, [storeItems]);

    const [targetUserId, setTargetUserId] = useState<string | null>(allUsers.length > 0 ? allUsers[0].id : null);
    const targetUser = allUsers.find((u: Profile) => u.id === targetUserId);
    const [targetUserItemLogs, setTargetUserItemLogs] = useState<any[]>([]);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

    const withRefresh = async (action: () => Promise<any>) => {
        await action();
        setTimeout(async () => {
            await fetchAllUsers();
            router.refresh();
        }, 50);
    };

    useEffect(() => { if (!targetUserId && allUsers.length > 0) setTargetUserId(allUsers[0].id); }, [allUsers, targetUserId]);

    useEffect(() => {
        const fetchLogs = async () => {
            if (targetUserId && getUserItemUsage) {
                const logs = await getUserItemUsage(targetUserId);
                setTargetUserItemLogs(logs || []);
            }
        };
        fetchLogs();
    }, [targetUserId, getUserItemUsage]);

    const [actionType, setActionType] = useState<ActionType>("watch_content");
    const [badgeToAward, setBadgeToAward] = useState<string>(Object.keys(badgesConfig)[0] || "");
    const [notification, setNotification] = useState("");

    const [editRewardAction, setEditRewardAction] = useState<string | null>(null);
    const [newActionName, setNewActionName] = useState("");
    const [newActionXp, setNewActionXp] = useState(10);
    const [newDisplayName, setNewDisplayName] = useState("");

    const [editBadgeName, setEditBadgeName] = useState<string | null>(null);
    const [newBadgeName, setNewBadgeName] = useState("");
    const [newBadgeDesc, setNewBadgeDesc] = useState("");
    const [newBadgeIcon, setNewBadgeIcon] = useState(iconMapKeys[0]);
    const [newBadgeColor, setNewBadgeColor] = useState("#ffffff");
    const [newBadgeXp, setNewBadgeXp] = useState(0);
    const [newBadgeTriggerType, setNewBadgeTriggerType] = useState<'none' | 'xp_threshold' | 'streak_days' | 'action_count'>('none');
    const [newBadgeTriggerValue, setNewBadgeTriggerValue] = useState(0);
    const [newBadgeTriggerAction, setNewBadgeTriggerAction] = useState("");
    const [badgeIconType, setBadgeIconType] = useState<'PRESET' | 'EMOJI'>('PRESET');

    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [questTitle, setQuestTitle] = useState("");
    const [questDescription, setQuestDescription] = useState("");
    const [questXpReward, setQuestXpReward] = useState(100);
    const [questBadgeReward, setQuestBadgeReward] = useState<string | null>(null);
    const [questTasks, setQuestTasks] = useState<Partial<QuestTask>[]>([]);

    const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
    const [itemName, setItemName] = useState("");
    const [itemDescription, setItemDescription] = useState("");
    const [itemCost, setItemCost] = useState(500);
    const [itemIcon, setItemIcon] = useState("Snowflake");
    const [itemType, setItemType] = useState<ItemType>("INSTANT");
    const [itemDuration, setItemDuration] = useState<number | undefined>(undefined);
    const [itemModifier, setItemModifier] = useState<number | undefined>(undefined);
    const [metaColor, setMetaColor] = useState("#ffffff");
    const [metaText, setMetaText] = useState("");
    const [metaUrl, setMetaUrl] = useState("");
    const [metaPosition, setMetaPosition] = useState<'prefix' | 'suffix'>('prefix');
    const [xpAmount, setXpAmount] = useState<number>(100);
    const [xpMin, setXpMin] = useState<number>(50);
    const [xpMax, setXpMax] = useState<number>(200);

    const [editXp, setEditXp] = useState(0);
    const [editStreak, setEditStreak] = useState(0);
    const [editFreezes, setEditFreezes] = useState(0);
    const [editRole, setEditRole] = useState<"member" | "admin">("member");
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logActions, setLogActions] = useState<Action[]>([]);
    const [webhookUrl, setWebhookUrl] = useState("");

    const [showArchivedRewards, setShowArchivedRewards] = useState(false);
    const [showArchivedQuests, setShowArchivedQuests] = useState(false);
    const [showArchivedBadges, setShowArchivedBadges] = useState(false);
    const [showArchivedStore, setShowArchivedStore] = useState(false);

    useEffect(() => { if (typeof window !== "undefined") setWebhookUrl(`${window.location.origin}/api/webhooks`); }, []);
    useEffect(() => { if (targetUser) { setEditXp(targetUser.xp); setEditStreak(targetUser.streak); setEditFreezes(targetUser.streakFreezes ?? 0); setEditRole((targetUser.role as "member" | "admin") ?? "member"); } }, [targetUser]);

    const showNotification = (message: string, duration: number = 3000) => { setNotification(message); setTimeout(() => setNotification(""), duration); };
    const handleCopyWebhook = () => { navigator.clipboard.writeText(webhookUrl); showNotification("Webhook URL copied to clipboard!"); };
    const handleAwardXp = async () => { if (targetUser) { const result = await handleRecordAction(targetUser.id, actionType, "manual"); await withRefresh(async () => { }); showNotification(`Awarded ${result?.xpGained ?? 0} XP.`); } };
    const handleAwardBadgeClick = async () => { if (targetUser && badgeToAward) { await handleAwardBadge(targetUser.id, badgeToAward); await withRefresh(async () => { }); showNotification(`Badge awarded.`); } };

    // Sync Branding
    const handleSyncBranding = async () => {
        const res = await api.syncBrandingFromWhop();
        if (res.success) {
            showNotification("Branding synced!");
            await withRefresh(async () => { });
        } else {
            showNotification(res.message || "Failed to sync.");
        }
    };

    // Handle Tier Update
    const handleTierUpdate = async (newTier: string) => {
        const success = await adminUpdateCommunityTier(newTier as 'Core' | 'Pro' | 'Elite');
        if (success) {
            showNotification(`Plan updated to ${newTier}`);
            await withRefresh(async () => { });
        } else {
            showNotification("Failed to update plan.");
        }
    };

    // 🟢 FIXED: Re-added handleTierChange for the Dev Simulation Dropdown
    const handleTierChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTier = e.target.value as 'Core' | 'Pro' | 'Elite';
        await handleTierUpdate(newTier);
    };

    const handleToggleRewardActive = async (actionType: string, isActive: boolean) => {
        setLocalRewards(prev => ({ ...prev, [actionType]: { ...prev[actionType], isActive } }));
        await handleUpdateReward(actionType, { isActive } as any);
        await withRefresh(async () => { });
    };

    const handleToggleBadgeActive = async (name: string, isActive: boolean) => {
        setLocalBadges(prev => ({ ...prev, [name]: { ...prev[name], isActive } }));
        await handleUpdateBadge(name, { isActive });
        await withRefresh(async () => { });
    };

    const handleToggleQuestClick = async (q: Quest) => {
        const newState = !q.isActive;
        setLocalQuests(prev => prev.map(quest => quest.id === q.id ? { ...quest, isActive: newState } : quest));
        await handleToggleQuest(q.id, newState);
        await withRefresh(async () => { });
    };

    const handleToggleStoreItem = async (id: string, isActive: boolean) => {
        setLocalStore(prev => prev.map(item => item.id === id ? { ...item, isActive } : item));
        await handleToggleStoreItemActive(id, isActive);
        await withRefresh(async () => { });
    };

    const cancelEditReward = () => { setEditRewardAction(null); setNewActionName(""); setNewActionXp(10); setNewDisplayName(""); };

    // 🟢 FIXED: Rewards - Allow Name Editing & Pass New Name to Update Function
    const handleRewardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editRewardAction) {
            // Include actionType and displayName to support renaming and labeling
            await handleUpdateReward(editRewardAction, { xpGained: newActionXp, actionType: newActionName, displayName: newDisplayName || newActionName });
            showNotification("Reward updated.");
        } else {
            await handleAddReward({ actionType: newActionName as any, xpGained: newActionXp, displayName: newDisplayName || newActionName });
            showNotification("Reward added.");
        }
        cancelEditReward();
        await withRefresh(async () => { });
    };

    const handleEditRewardClick = (actionType: string, reward: Reward) => { setEditRewardAction(actionType); setNewActionName(actionType); setNewActionXp(reward?.xpGained ?? 0); setNewDisplayName(reward?.displayName || ''); };
    const handleDeleteRewardClick = (actionType: string) => { setModalConfig({ isOpen: true, title: "Archive Reward?", message: `Archive "${actionType}"?`, isDestructive: true, onConfirm: async () => { await handleDeleteReward(actionType); showNotification("Reward processed."); await withRefresh(async () => { }); closeModal(); } }); };
    const handleRestoreRewardClick = async (actionType: string) => { await handleRestoreReward(actionType); showNotification("Restored."); await withRefresh(async () => { }); };

    const cancelEditBadge = () => { setEditBadgeName(null); setNewBadgeName(""); setNewBadgeDesc(""); setBadgeIconType('PRESET'); setNewBadgeIcon(iconMapKeys[0]); setNewBadgeXp(0); setNewBadgeTriggerType('none'); setNewBadgeTriggerValue(0); setNewBadgeTriggerAction(""); };

    // 🟢 FIXED: Duplicate 'name' property resolved
    const handleAddOrEditBadge = async (e: React.FormEvent) => {
        e.preventDefault();
        const iconToSave = badgeIconType === 'EMOJI' ? newBadgeIcon : newBadgeIcon;
        // name is already included in badgeData
        const badgeData = { description: newBadgeDesc, icon: iconToSave, color: newBadgeColor, name: newBadgeName, xpReward: newBadgeXp, triggerType: newBadgeTriggerType, triggerValue: newBadgeTriggerValue, triggerAction: newBadgeTriggerAction || undefined };

        if (editBadgeName) {
            await handleUpdateBadge(editBadgeName, badgeData);
            showNotification("Badge updated.");
        }
        else {
            // 🟢 FIX: Do not spread 'badgeData' AND specify 'name' separately.
            await handleAddBadge({ id: crypto.randomUUID(), ...badgeData });
            showNotification("Badge added.");
        }
        cancelEditBadge();
        await withRefresh(async () => { });
    };

    const handleEditBadgeClick = (badgeName: string, config: BadgeConfig) => {
        setEditBadgeName(badgeName); setNewBadgeName(badgeName); setNewBadgeDesc(config.description); setNewBadgeColor(config.color); setNewBadgeXp((config as any).xpReward ?? 0);
        setNewBadgeTriggerType((config as any).triggerType ?? 'none'); setNewBadgeTriggerValue((config as any).triggerValue ?? 0); setNewBadgeTriggerAction((config as any).triggerAction ?? '');
        if (iconMapKeys.includes(config.icon)) { setBadgeIconType('PRESET'); setNewBadgeIcon(config.icon); }
        else { setBadgeIconType('EMOJI'); setNewBadgeIcon(config.icon || "🏆"); }
    };
    const handleDeleteBadgeClick = (name: string) => { setModalConfig({ isOpen: true, title: "Archive Badge?", message: `Archive "${name}"?`, isDestructive: true, onConfirm: async () => { await handleDeleteBadge(name); showNotification("Badge archived."); await withRefresh(async () => { }); closeModal(); } }); };
    const handleRestoreBadgeClick = async (name: string) => { await handleRestoreBadge(name); showNotification("Restored."); await withRefresh(async () => { }); };

    const resetQuestForm = () => { setEditingQuest(null); setQuestTitle(""); setQuestDescription(""); setQuestXpReward(100); setQuestBadgeReward(null); setQuestTasks([{ actionType: (Object.keys(rewardsConfig)[0] as ActionType) || "watch_content", targetCount: 1, description: "" }]); };
    useEffect(() => { if (Object.keys(rewardsConfig).length > 0 && questTasks.length === 0) resetQuestForm(); }, [rewardsConfig]);
    const handleEditQuestClick = (q: Quest) => { setEditingQuest(q); setQuestTitle(q.title); setQuestDescription(q.description ?? ""); setQuestXpReward(q.xpReward); setQuestBadgeReward(q.badgeReward ?? null); setQuestTasks(q.tasks || []); };
    const handleUpdateTask = (idx: number, field: keyof QuestTask, val: any) => { const t = [...questTasks]; (t[idx] as any)[field] = val; setQuestTasks(t); };
    const handleAddTask = () => setQuestTasks([...questTasks, { actionType: Object.keys(rewardsConfig)[0] as ActionType, targetCount: 1, description: "" }]);
    const handleRemoveTask = (idx: number) => { if (questTasks.length > 1) setQuestTasks(questTasks.filter((_, i) => i !== idx)); };
    const handleQuestSubmit = async (e: React.FormEvent) => { e.preventDefault(); const q = { title: questTitle, description: questDescription, xpReward: questXpReward, badgeRewardId: questBadgeReward ?? undefined, tasks: questTasks as QuestTask[] }; if (editingQuest) await handleUpdateQuest(editingQuest.id, q); else await handleCreateQuest(q); showNotification("Quest saved."); resetQuestForm(); await withRefresh(async () => { }); };
    const handleDeleteQuestClick = (q: Quest) => { setModalConfig({ isOpen: true, title: "Archive Quest", message: `Archive "${q.title}"?`, isDestructive: true, onConfirm: async () => { await handleDeleteQuest(q.id); showNotification("Quest archived."); await withRefresh(async () => { }); closeModal(); } }); };
    const handleRestoreQuestClick = async (q: Quest) => { if (handleRestoreQuest) { await handleRestoreQuest(q.id); showNotification("Quest restored."); await withRefresh(async () => { }); } };

    const resetItemForm = () => { setEditingItem(null); setItemName(""); setItemDescription(""); setItemCost(500); setItemIcon("Snowflake"); setItemType("INSTANT"); setItemDuration(undefined); setItemModifier(undefined); setMetaColor("#ffffff"); setMetaText(""); setMetaUrl(""); setMetaPosition("prefix"); setXpAmount(100); setXpMin(50); setXpMax(200); };
    const handleEditItemClick = (i: StoreItem) => { setEditingItem(i); setItemName(i.name); setItemDescription(i.description ?? ""); setItemCost(i.cost); setItemIcon(i.icon); setItemType(i.itemType); setItemDuration(i.durationHours); setItemModifier(i.modifier); if (i.metadata?.color) setMetaColor(i.metadata.color); if (i.metadata?.text) setMetaText(i.metadata.text); if (i.metadata?.imageUrl) setMetaUrl(i.metadata.imageUrl); if (i.metadata?.titlePosition) setMetaPosition(i.metadata.titlePosition); if (i.metadata?.xpAmount) setXpAmount(i.metadata.xpAmount); if (i.metadata?.xpMin) setXpMin(i.metadata.xpMin); if (i.metadata?.xpMax) setXpMax(i.metadata.xpMax); };
    const handleItemSubmit = async (e: React.FormEvent) => { e.preventDefault(); const metadata: any = {}; if (itemType === 'NAME_COLOR' || itemType === 'AVATAR_PULSE') metadata.color = metaColor; if (itemType === 'TITLE') { metadata.text = metaText; metadata.titlePosition = metaPosition; } if (itemType === 'BANNER' || itemType === 'FRAME') metadata.imageUrl = metaUrl; if (itemType === 'XP_GIFT') metadata.xpAmount = xpAmount; if (itemType === 'RANDOM_XP') { metadata.xpMin = xpMin; metadata.xpMax = xpMax; } const i = { name: itemName, description: itemDescription, cost: itemCost, icon: itemIcon, isActive: true, itemType, durationHours: itemType === 'TIMED_EFFECT' ? itemDuration : undefined, modifier: itemType === 'TIMED_EFFECT' ? itemModifier : undefined, metadata }; if (editingItem) await handleUpdateStoreItem(editingItem.id, i); else await handleCreateStoreItem(i); showNotification("Item saved."); resetItemForm(); await withRefresh(async () => { }); };
    const handleDeleteItemClick = (i: StoreItem) => { setModalConfig({ isOpen: true, title: "Delete Item?", message: `Delete "${i.name}"?`, isDestructive: true, onConfirm: async () => { await handleDeleteStoreItem(i.id); showNotification("Item deleted."); await withRefresh(async () => { }); closeModal(); } }); };
    const handleRestoreItemClick = async (i: StoreItem) => { await handleRestoreStoreItem(i.id); showNotification("Restored."); await withRefresh(async () => { }); };

    const handleAdminStatUpdate = async () => { if (!targetUser) return; await adminUpdateUserStats(targetUser.id, editXp, editStreak, editFreezes); await withRefresh(async () => { }); showNotification("Stats updated."); };
    const handleAdminRoleUpdate = async () => { if (!targetUser) return; await adminUpdateUserRole(targetUser.id, editRole); await withRefresh(async () => { }); showNotification("Role updated."); };
    const handleAdminBan = (h: number | null) => { if (!targetUser) return; setModalConfig({ isOpen: true, title: h ? "Ban User (24h)" : "Permaban User", message: `Ban ${targetUser.username}?`, isDestructive: true, onConfirm: async () => { await adminBanUser(targetUser.id, h); await withRefresh(async () => { }); showNotification("Ban status updated."); closeModal(); } }); };
    const handlePasswordReset = async () => { if (!targetUser) return; const e = await adminGetUserEmail(targetUser.id); if (e) alert(`Email: ${e}`); };
    const handleViewLogs = async () => { if (!targetUser) return; const l = await getAllUserActions(targetUser.id); setLogActions(l); setIsLogModalOpen(true); };
    const handleSimulateRenewal = async (userId: string) => { if (!userId) return; const message = await handleTriggerWebhook(userId, "renew_subscription"); if (message) { await withRefresh(async () => { }); showNotification(message, 4000); } };
    const handleToggleWhiteLabelClick = async (enabled: boolean) => { await handleToggleWhiteLabel(enabled); await withRefresh(async () => { }); };

    const isSelf = targetUser?.id === adminUser?.id;

    const filteredRewards = Object.entries(localRewards)
        .filter(([_, r]) => showArchivedRewards ? (r as Reward).isArchived : !(r as Reward).isArchived)
        .sort((a, b) => a[0].localeCompare(b[0]));

    const filteredQuests = localQuests
        .filter((q: Quest) => showArchivedQuests ? q.isArchived : !q.isArchived)
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    const filteredBadges = Object.entries(localBadges)
        .filter(([_, b]) => showArchivedBadges ? (b as any).isArchived : !(b as any).isArchived)
        .sort((a, b) => a[0].localeCompare(b[0]));

    const filteredStore = localStore
        .filter((i: StoreItem) => showArchivedStore ? i.isArchived : !i.isArchived)
        .sort((a, b) => a.name.localeCompare(b.name));

    const popularEmojis = ["🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🔥", "🚀", "💎", "💰", "🛡️", "⚔️", "🏹", "🧪", "📜", "❤️", "⭐", "👑", "💀", "⚡", "🦄", "🐲", "👾", "🍄", "🎓", "🎟️", "🎨", "🎵", "📣", "🤝", "🌍", "🎁", "💡", "⚙️", "🔒", "🔑"];

    const RenderIconPreview = ({ iconName, color }: { iconName: string, color?: string }) => {
        const IconComponent = iconMap[iconName] || iconMap['Snowflake'];
        return <IconComponent className="w-5 h-5" style={{ color: color || '#a855f7' }} />;
    };

    return (
        <div className="space-y-6 pb-20">
            <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={closeModal} isDestructive={modalConfig.isDestructive} />
            {/* 🆕 First-visit onboarding popup */}
            <OnboardingModal onNavigateToSetup={() => setActiveTab('subscription')} />
            {notification && <div className="fixed top-20 right-8 bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 border border-slate-600 animate-bounce">{notification}</div>}
            {isLogModalOpen && targetUser && <ActionLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} username={targetUser.username} actions={logActions} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-700 pb-8">
                <div className="flex items-center gap-5">
                    {community?.logoUrl ? (
                        <img src={community.logoUrl} alt={community.name} className="w-16 h-16 rounded-xl shadow-lg object-cover border border-slate-600" />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10">
                            <LogoIcon className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">{community?.name || "Admin Dashboard"}</h1>
                        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 shadow-sm">
                            <span className="flex items-center gap-1.5 text-green-400"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>Active</span><span className="text-slate-600">|</span><span className="text-slate-200 font-semibold">{allUsers.length} Users</span><span className="text-slate-600">|</span><span className={`uppercase tracking-wider font-bold ${(community?.tier?.toLowerCase() === 'elite') ? 'text-purple-400' : (community?.tier?.toLowerCase() === 'pro') ? 'text-orange-400' : 'text-blue-400'}`}>{community?.tier || "Free"} Plan</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-1">
                <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" icon={<UserGroupIcon className="w-5 h-5" />} />
                <TabButton active={activeTab === 'engagement'} onClick={() => setActiveTab('engagement')} label="Engagement" icon={<TrophyIcon className="w-5 h-5" />} />
                <TabButton active={activeTab === 'quests'} onClick={() => setActiveTab('quests')} label="Quests" icon={<ClockIcon className="w-5 h-5" />} locked={!isFeatureEnabled('quests')} />
                <TabButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} label="XP Store" icon={<ShoppingCartIcon className="w-5 h-5" />} locked={!isFeatureEnabled('store')} />
                <TabButton active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} label="Subscription" icon={<CreditCardIcon className="w-5 h-5" />} />
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Settings" icon={<SparklesIcon className="w-5 h-5" />} />
            </div>

            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Tab Description Banner */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <h2 className="text-lg font-bold text-white mb-1">👥 User Management</h2>
                        <p className="text-slate-400 text-sm">View and manage your community members, their XP totals, badges, and activity. Select a user to view their detailed action history or manually award XP and badges.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-4">Select User</h3>
                                <select id="user-select" value={targetUserId || ''} onChange={(e) => setTargetUserId(e.target.value)} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500">
                                    {allUsers.map((u: Profile) => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>
                            {targetUser && (
                                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                                    <div className="flex justify-between items-start mb-6">
                                        <div><h3 className="text-xl font-bold text-white">{targetUser.username}</h3><span className={`text-xs px-2 py-0.5 rounded-full ${targetUser.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-600 text-slate-300'}`}>{targetUser.role.toUpperCase()}</span></div>
                                        {targetUser.bannedUntil && new Date(targetUser.bannedUntil) > new Date() && <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm animate-pulse">BANNED</span>}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                                            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Manual Awards</label>
                                            <div className="flex gap-2 mb-3 items-end">
                                                <div className="flex-1"><label className="text-[10px] text-slate-500 uppercase mb-1 block">Action</label><select value={actionType} onChange={e => setActionType(e.target.value as ActionType)} className="w-full bg-slate-700 text-white rounded p-2 text-sm border border-slate-600">{Object.keys(rewardsConfig).map(k => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}</select></div>
                                                <button onClick={handleAwardXp} disabled={!targetUser} className="bg-green-600 text-white px-2 rounded hover:bg-green-700 text-sm font-bold h-[38px] w-32">+XP</button>
                                            </div>
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1"><label className="text-[10px] text-slate-500 uppercase mb-1 block">Badge</label><select value={badgeToAward} onChange={e => setBadgeToAward(e.target.value)} className="w-full bg-slate-700 text-white rounded p-2 text-sm border border-slate-600">{Object.keys(badgesConfig).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                                                <button onClick={handleAwardBadgeClick} disabled={!targetUser} className="bg-yellow-600 text-white px-2 rounded hover:bg-yellow-700 text-sm font-bold h-[38px] w-32">Award Badge</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-slate-900 p-2 rounded"><div className="text-xs text-slate-400">XP</div><input type="number" value={editXp} onChange={e => setEditXp(parseInt(e.target.value))} className="w-full bg-transparent text-center font-bold text-white focus:outline-none border-b border-slate-700 focus:border-purple-500" /></div>
                                            <div className="bg-slate-900 p-2 rounded"><div className="text-xs text-slate-400">Streak</div><input type="number" value={editStreak} onChange={e => setEditStreak(parseInt(e.target.value))} className="w-full bg-transparent text-center font-bold text-white focus:outline-none border-b border-slate-700 focus:border-purple-500" /></div>
                                            <div className="bg-slate-900 p-2 rounded"><div className="text-xs text-slate-400">Freezes</div><input type="number" value={editFreezes} onChange={e => setEditFreezes(parseInt(e.target.value))} className="w-full bg-transparent text-center font-bold text-white focus:outline-none border-b border-slate-700 focus:border-purple-500" /></div>
                                        </div>
                                        <button onClick={handleAdminStatUpdate} className="w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white py-2 rounded transition-colors text-sm font-semibold">Save Stats</button>
                                        <div className="border-t border-slate-700 pt-4">
                                            <div className="mb-4">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Item History</h4>
                                                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                                    {targetUserItemLogs.length > 0 ? targetUserItemLogs.map((log: any) => (
                                                        <div key={log.id} className="flex justify-between text-[10px] bg-slate-900/50 p-1.5 rounded">
                                                            <span className="text-slate-300">{log.item_name}</span>
                                                            <span className="text-slate-500">{new Date(log.used_at).toLocaleDateString()}</span>
                                                        </div>
                                                    )) : <p className="text-xs text-slate-600 italic">No items used.</p>}
                                                </div>
                                            </div>
                                            <button onClick={handleViewLogs} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-xs mb-2">View Action Logs</button>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => handleAdminBan(24)} disabled={isSelf} className="bg-red-900/30 text-red-400 hover:bg-red-900/50 py-2 rounded text-xs disabled:opacity-50">Ban 24h</button>
                                                <button onClick={() => handleAdminBan(null)} disabled={isSelf} className="bg-red-600 text-white hover:bg-red-700 py-2 rounded text-xs disabled:opacity-50">Permaban</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-3">
                            <Leaderboard users={allUsers} currentUserId={targetUserId || ''} />
                        </div>
                    </div>
                </div>
            )}

            {/* 🟢 NEW SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
                <div className="space-y-6">
                    {/* 🆕 Getting Started Guide */}
                    <GettingStartedCard onNavigateToTab={(tab) => setActiveTab(tab as 'users' | 'engagement' | 'quests' | 'store' | 'settings')} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-500/20 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Current Plan</h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide
                          ${community?.tier === 'Elite' ? 'bg-purple-600 text-white' :
                                        community?.tier === 'Pro' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                                    {community?.tier || 'Free'}
                                </span>
                            </div>

                            <div className="space-y-4 flex-1">
                                <p className="text-slate-400 text-sm">
                                    Your community is currently on the <strong>{community?.tier}</strong> tier.
                                    {community?.trialEndsAt && ` Trial ends on ${new Date(community.trialEndsAt).toLocaleDateString()}.`}
                                </p>

                                {/* 🟢 CONDITIONAL RENDER: Only show override in Dev Mode */}
                                {isDev && (
                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                            Manual Plan Override (Dev Mode)
                                        </label>
                                        <div className="flex gap-2">
                                            {['Core', 'Pro', 'Elite'].map((tier) => (
                                                <button
                                                    key={tier}
                                                    onClick={() => handleTierUpdate(tier)}
                                                    className={`flex-1 py-2 rounded text-sm font-bold transition-all ${community?.tier === tier
                                                        ? 'bg-purple-600 text-white shadow-lg'
                                                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                                                        }`}
                                                >
                                                    {tier}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link href="/pricing" className="block w-full text-center bg-white text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors mt-6">
                                View Pricing & Features
                            </Link>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col">
                            <div className="flex-1 flex flex-col justify-center text-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ChatBubbleLeftIcon className="w-8 h-8 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
                                <p className="text-slate-400 text-sm">
                                    Have a feature request or found a bug? Email our support team directly.
                                </p>
                            </div>
                            <a href="mailto:apexdigitalminds@gmail.com" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg text-center mt-6">
                                Contact Support via Email
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Rest of the tabs (Engagement, Store, Settings) */}
            {activeTab === 'engagement' && (
                <div className="space-y-6">
                    {/* Tab Description Banner */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <h2 className="text-lg font-bold text-white mb-1">🏆 Engagement</h2>
                        <p className="text-slate-400 text-sm">Configure how members earn recognition in your community. Set up XP reward actions to incentivize participation and create achievement badges for milestones.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-[600px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">Manage XP Reward Actions</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Show Archived</span>
                                    <ToggleSwitch checked={showArchivedRewards} onChange={setShowArchivedRewards} />
                                </div>
                            </div>
                            <form onSubmit={handleRewardSubmit} className="bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-600">
                                <div className="flex gap-2 mb-2">
                                    {/* 🟢 FIXED: Removed disabled={!!editRewardAction} to allow editing */}
                                    <input type="text" value={newActionName} onChange={e => setNewActionName(e.target.value)} placeholder="Action Type (e.g. daily_login)" required className="bg-slate-800 border-slate-600 text-white rounded p-2 flex-1 text-sm" />
                                    <input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="Display Name (e.g. Daily Login)" className="bg-slate-800 border-slate-600 text-white rounded p-2 flex-1 text-sm" />
                                    <input type="number" value={newActionXp} onChange={e => setNewActionXp(parseInt(e.target.value))} placeholder="XP" required className="bg-slate-800 border-slate-600 text-white rounded p-2 w-20 text-sm" />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 font-bold w-full text-sm">{editRewardAction ? 'Update' : 'Add'}</button>
                                    {editRewardAction && <button type="button" onClick={cancelEditReward} className="bg-slate-600 text-white px-4 py-1.5 rounded hover:bg-slate-500 text-sm">Cancel</button>}
                                </div>
                            </form>
                            <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                                {filteredRewards.map(([key, value]) => {
                                    const r = value as Reward;
                                    return (
                                        <div key={key} className={`flex justify-between items-center p-3 rounded border ${r.isArchived ? 'bg-red-900/10 border-red-900/30' : 'bg-slate-700/30 border-slate-700 hover:border-slate-500'} transition-colors`}>
                                            <div><p className={`font-bold text-sm ${r.isArchived ? 'text-red-300' : 'text-white'}`}>{r.displayName || key}</p><div className="flex gap-2 text-xs mt-0.5"><span className="text-slate-500">{key}</span><span className="text-yellow-400 font-bold">{r.xpGained} XP</span>{!r.isArchived && <span className={r.isActive ? "text-green-400" : "text-slate-500"}>{r.isActive ? "Active" : "Draft"}</span>}</div></div>
                                            <div className="flex gap-2 items-center">
                                                {!r.isArchived && (
                                                    <ToggleSwitch checked={r.isActive} onChange={(val) => handleToggleRewardActive(key, val)} />
                                                )}
                                                {r.isArchived ? <button onClick={() => handleRestoreRewardClick(key)} className="text-green-400 hover:text-green-300 text-xs font-bold">Restore</button> : <><button onClick={() => handleEditRewardClick(key, r)} className="text-slate-400 hover:text-white text-xs font-bold">Edit</button><button onClick={() => handleDeleteRewardClick(key)} className="text-red-500 hover:text-red-400 text-xs font-bold">Delete</button></>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* BADGES */}
                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-[600px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">Manage Badges</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Show Archived</span>
                                    <ToggleSwitch checked={showArchivedBadges} onChange={setShowArchivedBadges} />
                                </div>
                            </div>
                            <form onSubmit={handleAddOrEditBadge} className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-4 border border-slate-600">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* 🟢 FIXED: Removed disabled={!!editBadgeName} to allow editing */}
                                    <div className="col-span-1"><label className="text-xs text-slate-400 mb-1 block">Name</label><input type="text" value={newBadgeName} onChange={e => setNewBadgeName(e.target.value)} placeholder="Badge Name" required className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm" /></div>
                                    <div className="col-span-2"><label className="text-xs text-slate-400 mb-1 block">Description</label><input type="text" value={newBadgeDesc} onChange={e => setNewBadgeDesc(e.target.value)} placeholder="Description" required className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm" /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div className="col-span-1">
                                        <div className="flex justify-between items-center mb-1"><label className="text-xs text-slate-400 block">Icon Type</label><button type="button" onClick={() => { const newType = badgeIconType === 'PRESET' ? 'EMOJI' : 'PRESET'; setBadgeIconType(newType); setNewBadgeIcon(newType === 'PRESET' ? iconMapKeys[0] : '🏆'); }} className="text-[10px] uppercase font-bold bg-slate-600 px-2 py-0.5 rounded text-white hover:bg-slate-500">{badgeIconType} ⟳</button></div>
                                        <div className="flex gap-2 items-center">
                                            <div className="w-9 h-9 bg-slate-800 rounded border border-slate-600 flex items-center justify-center flex-none overflow-hidden">{badgeIconType === 'PRESET' ? ((() => { const PreviewIcon = iconMap[newBadgeIcon] || iconMap['Snowflake']; return <PreviewIcon className="w-5 h-5" style={{ color: newBadgeColor }} />; })()) : (<span className="text-xl leading-none select-none">{newBadgeIcon}</span>)}</div>
                                            {badgeIconType === 'PRESET' ? (<select value={newBadgeIcon} onChange={e => setNewBadgeIcon(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm h-9 w-full">{iconMapKeys.map(k => <option key={k} value={k}>{k}</option>)}</select>) : (<select value={popularEmojis.includes(newBadgeIcon) ? newBadgeIcon : popularEmojis[0]} onChange={e => setNewBadgeIcon(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm h-9 w-full font-emoji">{popularEmojis.map(emoji => (<option key={emoji} value={emoji}>{emoji}</option>))}</select>)}
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex gap-4 items-end flex-wrap">
                                        <div><label className="text-xs text-slate-400 mb-1 block">Color</label><input type="color" value={newBadgeColor} onChange={e => setNewBadgeColor(e.target.value)} className="h-9 w-12 cursor-pointer bg-transparent border-0 p-0" /></div>
                                        <div><label className="text-xs text-slate-400 mb-1 block">XP Reward</label><input type="number" value={newBadgeXp} onChange={e => setNewBadgeXp(parseInt(e.target.value) || 0)} placeholder="0" className="bg-slate-800 border-slate-600 text-white rounded p-2 w-20 text-sm h-9" /></div>
                                        <div><label className="text-xs text-slate-400 mb-1 block">Auto-Trigger</label><select value={newBadgeTriggerType} onChange={e => setNewBadgeTriggerType(e.target.value as any)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm h-9 w-36"><option value="none">None (Manual)</option><option value="xp_threshold">XP Threshold</option><option value="streak_days">Streak Days</option><option value="action_count">Action Count</option></select></div>
                                        {newBadgeTriggerType !== 'none' && (<div><label className="text-xs text-slate-400 mb-1 block">{newBadgeTriggerType === 'xp_threshold' ? 'XP Amount' : newBadgeTriggerType === 'streak_days' ? 'Days' : 'Count'}</label><input type="number" value={newBadgeTriggerValue} onChange={e => setNewBadgeTriggerValue(parseInt(e.target.value) || 0)} className="bg-slate-800 border-slate-600 text-white rounded p-2 w-20 text-sm h-9" /></div>)}
                                        {newBadgeTriggerType === 'action_count' && (<div><label className="text-xs text-slate-400 mb-1 block">Action Type</label><select value={newBadgeTriggerAction} onChange={e => setNewBadgeTriggerAction(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm h-9 w-36">{Object.keys(rewardsConfig).map(a => <option key={a} value={a}>{(rewardsConfig as any)[a]?.displayName || a}</option>)}</select></div>)}
                                        <div className="flex gap-2 flex-none"><button type="submit" className="bg-blue-600 text-white px-4 h-9 rounded hover:bg-blue-700 font-bold text-sm w-48">{editBadgeName ? 'Update' : 'Add Badge'}</button>{editBadgeName && (<button type="button" onClick={cancelEditBadge} className="bg-slate-600 text-white px-3 h-9 rounded hover:bg-slate-500 text-sm">Cancel</button>)}</div>
                                    </div>
                                </div>
                            </form>
                            <div className="flex-grow overflow-y-auto pr-2 space-y-2 max-h-[400px]">
                                {filteredBadges.map(([name, config]) => {
                                    const b = config as any;
                                    const isPreset = iconMapKeys.includes(b.icon);
                                    const BadgeIcon = isPreset ? (iconMap[b.icon] || iconMap['Snowflake']) : null;
                                    const isActive = b.isActive !== undefined ? b.isActive : true;

                                    return (
                                        <div key={name} className={`flex justify-between items-center p-3 rounded border ${b.isArchived ? 'bg-red-900/10 border-red-900/30' : 'bg-slate-700/30 border-slate-700 hover:border-slate-500'} transition-colors`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 border border-slate-600">
                                                    {isPreset && BadgeIcon ? <BadgeIcon className="w-6 h-6" style={{ color: b.color }} /> : <span className="text-xl select-none">{b.icon}</span>}
                                                </div>
                                                <div><p className={`font-bold text-sm ${b.isArchived ? 'text-red-300' : 'text-white'}`}>{name}</p><p className="text-xs text-slate-400">{b.description}</p><div className="flex gap-2 text-xs mt-0.5">{b.xpReward > 0 && <span className="text-yellow-400 font-bold">{b.xpReward} XP</span>}{!b.isArchived && <span className={isActive ? "text-green-400" : "text-slate-500"}>{isActive ? "Active" : "Draft"}</span>}</div></div>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                {!b.isArchived && (
                                                    <ToggleSwitch checked={isActive} onChange={(val) => handleToggleBadgeActive(name, val)} />
                                                )}
                                                {b.isArchived ? <button onClick={() => handleRestoreBadgeClick(name)} className="text-green-400 text-xs font-bold">Restore</button> : <><button onClick={() => handleEditBadgeClick(name, config as BadgeConfig)} className="text-slate-400 hover:text-white text-xs font-bold">Edit</button><button onClick={() => handleDeleteBadgeClick(name)} className="text-red-500 hover:text-red-400 text-xs font-bold">Delete</button></>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QUESTS TAB - Separated from Engagement for tier gating */}
            {activeTab === 'quests' && (
                <div className="space-y-6">
                    {/* Tab Description Banner */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <h2 className="text-lg font-bold text-white mb-1">🎯 Quests</h2>
                        <p className="text-slate-400 text-sm">Create multi-step challenges that guide members through structured activities. Quests combine multiple XP actions into engaging journeys.</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-[600px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Manage Quests</h3>
                            {isFeatureEnabled('quests') ? (
                                <label className="flex items-center cursor-pointer text-xs"><input type="checkbox" checked={showArchivedQuests} onChange={() => setShowArchivedQuests(!showArchivedQuests)} className="sr-only peer" /><span className="text-slate-400 mr-2">Show Archived</span><div className="w-7 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 relative"></div></label>
                            ) : <span className=""></span>}
                        </div>
                        {isFeatureEnabled('quests') ? (
                            <>
                                <form onSubmit={handleQuestSubmit} className="bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-600">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                        <input type="text" value={questTitle} onChange={e => setQuestTitle(e.target.value)} placeholder="Title" required className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm" />
                                        <input type="number" value={questXpReward} onChange={e => setQuestXpReward(parseInt(e.target.value))} placeholder="XP" className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm" />
                                        <select value={questBadgeReward || ''} onChange={e => setQuestBadgeReward(e.target.value || null)} className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm">
                                            <option value="">No Badge Reward</option>
                                            {Object.entries(badgesConfig).filter(([_, b]) => !(b as any).isArchived).map(([name]) => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <textarea value={questDescription} onChange={e => setQuestDescription(e.target.value)} placeholder="Description" className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm mb-2" rows={1} />
                                    <div className="space-y-1 max-h-20 overflow-y-auto mb-2">
                                        {questTasks.map((t, i) => (
                                            <div key={i} className="flex gap-1 mb-1">
                                                <div className="flex-1 flex flex-col gap-1">
                                                    <div className="flex gap-1">
                                                        <select value={t.actionType} onChange={e => handleUpdateTask(i, 'actionType', e.target.value)} className="bg-slate-800 text-white text-xs rounded p-1 border border-slate-600 flex-1">{Object.keys(rewardsConfig).map(k => <option key={k} value={k}>{k}</option>)}</select>
                                                        <input type="number" value={t.targetCount} onChange={e => handleUpdateTask(i, 'targetCount', parseInt(e.target.value))} className="bg-slate-800 text-white text-xs rounded p-1 border border-slate-600 w-12 text-center" />
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveTask(i)} className="text-red-400 px-1 self-start pt-1">×</button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={handleAddTask} className="text-xs text-blue-400">+ Task</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 font-bold w-full text-sm">{editingQuest ? 'Update' : 'Create'}</button>
                                        {editingQuest && <button type="button" onClick={resetQuestForm} className="bg-slate-600 text-white px-4 py-1.5 rounded hover:bg-slate-500 text-sm">Cancel</button>}
                                    </div>
                                </form>
                                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                                    {filteredQuests.map(q => (
                                        <div key={q.id} className={`flex justify-between items-center p-3 rounded border ${q.isArchived ? 'bg-red-900/10 border-red-900/30' : 'bg-slate-700/30 border-slate-700 hover:border-slate-500'} transition-colors`}>
                                            <div><p className={`font-bold text-sm ${q.isArchived ? 'text-red-300' : 'text-white'}`}>{q.title}</p><div className="flex gap-2 text-xs mt-0.5"><span className="text-yellow-400 font-bold">{q.xpReward} XP</span>{!q.isArchived && <span className={q.isActive ? "text-green-400" : "text-slate-500"}>{q.isActive ? "Active" : "Draft"}</span>}</div></div>
                                            <div className="flex gap-2 items-center">
                                                {!q.isArchived && <ToggleSwitch checked={q.isActive} onChange={(val) => handleToggleQuestClick(q)} />}
                                                {q.isArchived ? <button onClick={() => handleRestoreQuestClick(q)} className="text-green-400 text-xs font-bold">Restore</button> : <><button onClick={() => handleEditQuestClick(q)} className="text-slate-400 text-xs font-bold">Edit</button><button onClick={() => handleDeleteQuestClick(q)} className="text-red-500 text-xs font-bold">Delete</button></>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (<div className="h-full flex flex-col justify-center"><FeatureLock title="Quests System" description="Unlock with Pro." requiredTier="Pro" /></div>)}
                    </div>
                </div>
            )}

            {activeTab === 'store' && (
                <div className="space-y-6">
                    {/* Tab Description Banner */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <h2 className="text-lg font-bold text-white mb-1">🛒 XP Store</h2>
                        <p className="text-slate-400 text-sm">Let members spend their hard-earned XP on rewards you define. Create store items like XP boosters, streak freezes, or cosmetic rewards.</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-[800px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">XP Store Management</h3>
                            {isFeatureEnabled('store') ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Show Archived</span>
                                    <ToggleSwitch checked={showArchivedStore} onChange={setShowArchivedStore} />
                                </div>
                            ) : null}
                        </div>

                        {isFeatureEnabled('store') ? (
                            <>
                                <form onSubmit={handleItemSubmit} className="bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-600">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Item Name</label>
                                            <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} required className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Cost (XP)</label>
                                            <input type="number" value={itemCost} onChange={e => setItemCost(parseInt(e.target.value))} required className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-xs text-slate-400 mb-1">Description</label>
                                        <textarea value={itemDescription} onChange={e => setItemDescription(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full" rows={2} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Item Type</label>
                                            <select value={itemType} onChange={e => setItemType(e.target.value as ItemType)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full">
                                                <optgroup label="Consumables">
                                                    <option value="STREAK_FREEZE">Streak Freeze (+1 Freeze)</option>
                                                    <option value="XP_GIFT">XP Gift (Flat XP Bonus)</option>
                                                    <option value="RANDOM_XP">Random XP (Range)</option>
                                                </optgroup>
                                                <optgroup label="Boosts">
                                                    <option value="TIMED_EFFECT">Timed XP Effect (Boost)</option>
                                                </optgroup>
                                                <optgroup label="Cosmetics">
                                                    <option value="NAME_COLOR">Name Color</option>
                                                    <option value="AVATAR_PULSE">Avatar Pulse</option>
                                                    <option value="TITLE">Title - Prefix/Suffix</option>
                                                    <option value="BANNER">Profile Banner</option>
                                                </optgroup>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Icon</label>
                                            <div className="flex gap-2 items-center">
                                                <div className="w-10 h-10 bg-slate-800 rounded border border-slate-600 flex items-center justify-center flex-none">
                                                    {/* 🟢 FIXED: RenderIconPreview now correctly uses metaColor */}
                                                    <RenderIconPreview iconName={itemIcon} color={metaColor || '#a855f7'} />
                                                </div>
                                                <select value={itemIcon} onChange={e => setItemIcon(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full h-10">
                                                    {iconMapKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700 mb-4">
                                        {itemType === 'TIMED_EFFECT' && (
                                            <div className="flex gap-2">
                                                <input type="number" value={itemDuration || ''} onChange={e => setItemDuration(parseInt(e.target.value))} placeholder="Hours" className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm flex-1" />
                                                <input type="number" value={itemModifier || ''} onChange={e => setItemModifier(parseFloat(e.target.value))} placeholder="Multiplier (e.g. 1.5)" className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm flex-1" />
                                            </div>
                                        )}
                                        {itemType === 'XP_GIFT' && (
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">XP Amount to Award</label>
                                                <input type="number" value={xpAmount} onChange={e => setXpAmount(parseInt(e.target.value))} min="1" className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full" placeholder="e.g. 100" />
                                            </div>
                                        )}
                                        {itemType === 'RANDOM_XP' && (
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-xs text-slate-400 mb-1">Min XP</label>
                                                    <input type="number" value={xpMin} onChange={e => setXpMin(parseInt(e.target.value))} min="1" className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-slate-400 mb-1">Max XP</label>
                                                    <input type="number" value={xpMax} onChange={e => setXpMax(parseInt(e.target.value))} min="1" className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full" />
                                                </div>
                                            </div>
                                        )}
                                        {(itemType === 'NAME_COLOR' || itemType === 'AVATAR_PULSE') && (
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Select Color</label>
                                                <div className="flex gap-2 items-center">
                                                    <input type="color" value={metaColor} onChange={e => setMetaColor(e.target.value)} className="h-10 w-10 cursor-pointer border-none bg-transparent" />
                                                    <input type="text" value={metaColor} onChange={e => setMetaColor(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-24" />
                                                </div>
                                            </div>
                                        )}
                                        {itemType === 'TITLE' && (
                                            <div className="flex gap-2">
                                                <div className="flex-grow">
                                                    <label className="block text-xs text-slate-400 mb-1">Title Text</label>
                                                    <input type="text" value={metaText} onChange={e => setMetaText(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full" placeholder="e.g. The Wizard" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Position</label>
                                                    <select value={metaPosition} onChange={e => setMetaPosition(e.target.value as any)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm">
                                                        <option value="prefix">Prefix (Start)</option>
                                                        <option value="suffix">Suffix (End)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                        {(itemType === 'BANNER' || itemType === 'FRAME') && (
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Banner Image</label>
                                                {metaUrl && (
                                                    <div className="mb-2">
                                                        <img src={metaUrl} alt="Preview" className="h-20 w-full object-cover rounded border border-slate-600" />
                                                        <button type="button" onClick={() => setMetaUrl('')} className="text-xs text-red-400 underline mt-1">Remove</button>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const url = await api.uploadAvatar(file, adminUser?.id);
                                                            if (url) setMetaUrl(url);
                                                        }
                                                    }}
                                                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                                                />
                                                <p className="text-[10px] text-slate-500 mt-1">Recommended Size: 1200x300px (JPG/PNG)</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold text-sm w-full">{editingItem ? 'Update Item' : 'Create Item'}</button>
                                        {editingItem && <button type="button" onClick={resetItemForm} className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500 text-sm">Cancel</button>}
                                    </div>
                                </form>

                                {/* Collapsible Item Type Guide - positioned to not affect item list */}
                                <details className="group mb-2 relative">
                                    <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2">
                                        <span className="group-open:rotate-90 transition-transform">▶</span>
                                        📖 Item Type Reference Guide
                                    </summary>
                                    <div className="absolute z-20 left-0 right-0 mt-2 space-y-3 text-sm text-slate-300 bg-slate-900 p-4 rounded-lg border border-slate-600 shadow-xl max-h-[250px] overflow-y-auto">
                                        <div>
                                            <h4 className="font-bold text-purple-400 mb-1">🔥 Consumables</h4>
                                            <ul className="space-y-1 ml-4 text-xs">
                                                <li><span className="text-white">Streak Freeze</span> - Adds +1 freeze. No extra fields.</li>
                                                <li><span className="text-white">XP Gift</span> - Awards flat XP. Set <code className="bg-slate-800 px-1 rounded">XP Amount</code>.</li>
                                                <li><span className="text-white">Random XP</span> - Random XP in range. Set <code className="bg-slate-800 px-1 rounded">Min/Max XP</code>.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-yellow-400 mb-1">⚡ Boosts</h4>
                                            <ul className="space-y-1 ml-4 text-xs">
                                                <li><span className="text-white">Timed XP Effect</span> - XP multiplier. Set <code className="bg-slate-800 px-1 rounded">Duration</code> + <code className="bg-slate-800 px-1 rounded">Multiplier</code>.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-pink-400 mb-1">✨ Cosmetics</h4>
                                            <ul className="space-y-1 ml-4 text-xs">
                                                <li><span className="text-white">Name Color</span> / <span className="text-white">Avatar Pulse</span> - Set <code className="bg-slate-800 px-1 rounded">Color</code> (hex).</li>
                                                <li><span className="text-white">Title</span> - Set <code className="bg-slate-800 px-1 rounded">Title Text</code> + <code className="bg-slate-800 px-1 rounded">Position</code>.</li>
                                                <li><span className="text-white">Banner</span> - Set <code className="bg-slate-800 px-1 rounded">Image URL</code>.</li>
                                            </ul>
                                        </div>
                                        <p className="text-xs text-slate-500 pt-1 border-t border-slate-700">💡 Consumables are used from inventory. Cosmetics can be equipped/unequipped.</p>
                                    </div>
                                </details>

                                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                                    {filteredStore.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-3 rounded border bg-slate-700/30 border-slate-700">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
                                                        <RenderIconPreview iconName={item.icon} color={item.metadata?.color || '#a855f7'} />
                                                    </div>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-600`}>{item.itemType}</span>
                                                    <p className="font-bold text-sm text-white">{item.name}</p>
                                                </div>
                                                <p className="text-xs text-slate-400">{item.cost} XP</p>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                {!item.isArchived && <ToggleSwitch checked={item.isActive} onChange={(val) => handleToggleStoreItem(item.id, val)} />}
                                                {item.isArchived ? <button onClick={() => handleRestoreItemClick(item)} className="text-green-400 text-xs font-bold">Restore</button> : <><button onClick={() => handleEditItemClick(item)} className="text-slate-400 hover:text-white text-xs font-bold">Edit</button><button onClick={() => handleDeleteItemClick(item)} className="text-red-500 hover:text-red-400 text-xs font-bold">Delete</button></>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <FeatureLock title="XP Store" description="Unlock with Elite." requiredTier="Elite" />
                        )}
                    </div>
                </div>
            )}

            {/* 🟢 FULL SETTINGS TAB RESTORED WITH BRANDING SYNC */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    {/* Tab Description Banner */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <h2 className="text-lg font-bold text-white mb-1">⚙️ Settings</h2>
                        <p className="text-slate-400 text-sm">Configure advanced options including webhooks and white-label branding. Connect external systems via webhooks to automatically award XP.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                            <h3 className="text-lg font-bold text-white mb-4">Webhook Integration</h3>
                            <p className="text-slate-400 text-sm mb-4">Paste this URL into your Whop Developer Dashboard to receive automatic updates for subscriptions and payments.</p>
                            <div className="flex items-center gap-2 bg-slate-900 p-3 rounded border border-slate-700 mb-4">
                                <code className="text-green-400 text-sm flex-1 truncate">{webhookUrl}</code>
                                <button onClick={handleCopyWebhook} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded">Copy</button>
                            </div>

                            {/* Collapsible Webhook Setup Guide */}
                            <details className="group">
                                <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2">
                                    <span className="group-open:rotate-90 transition-transform">▶</span>
                                    Webhook Setup Guide
                                </summary>
                                <div className="mt-4 space-y-4 text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                    <div>
                                        <h4 className="font-bold text-white mb-2">Step 1: Access Your Whop Developer Dashboard</h4>
                                        <p>Navigate to <a href="https://dash.whop.com/developer" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">dash.whop.com/developer</a> and select your app.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-2">Step 2: Open Webhook Settings</h4>
                                        <p>Click on the <strong>"Webhooks"</strong> tab in the left sidebar.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-2">Step 3: Add the Webhook URL</h4>
                                        <p>Click <strong>"Create Webhook"</strong> and paste the URL from above into the endpoint field.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-2">Step 4: Select Events</h4>
                                        <p>Enable these webhook events:</p>
                                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-slate-400">
                                            <li><code className="text-green-400">membership.went_valid</code> – New subscription</li>
                                            <li><code className="text-green-400">membership.went_invalid</code> – Subscription ended</li>
                                            <li><code className="text-green-400">payment.succeeded</code> – Renewal payment</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-2">Step 5: Save & Test</h4>
                                        <p>Click <strong>"Save"</strong>, then use the <strong>"Send Test"</strong> button to verify the connection.</p>
                                    </div>
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 mt-4">
                                        <p className="text-purple-300"><strong>💡 Tip:</strong> Once configured, XP will be awarded automatically when members subscribe or renew!</p>
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* Discord section removed - not ready for launch */}

                        {/* 🆕 Full White-Label Branding Settings */}
                        <WhiteLabelSettings />

                        {isDev && (
                            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-yellow-600/30 lg:col-span-2">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><span>🧪</span> Simulation Mode (Dev)</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Simulate Tier</label>
                                            <select value={community?.tier?.toLowerCase() || "starter"} onChange={handleTierChange} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 text-sm">
                                                <option value="starter">Starter (Free)</option>
                                                <option value="pro">Pro ($79)</option><option value="elite">Elite ($149)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Trigger Events (For Quest Testing)</label>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => handleSimulateRenewal(targetUserId || '')} disabled={!targetUserId} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs border border-slate-600">
                                                Simulate Renewal
                                            </button>
                                            <button onClick={async () => {
                                                if (!targetUserId) return;
                                                await handleRecordAction(targetUserId, 'post_chat_message', 'manual'); await withRefresh(async () => { });
                                                showNotification("Simulated: Post Message");
                                            }} disabled={!targetUserId} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs border border-slate-600">
                                                Simulate Message
                                            </button>
                                            <button onClick={async () => {
                                                if (!targetUserId) return;
                                                await handleRecordAction(targetUserId, 'complete_module', 'manual'); await withRefresh(async () => { });
                                                showNotification("Simulated: Lesson Complete");
                                            }} disabled={!targetUserId} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs border border-slate-600">
                                                Simulate Lesson
                                            </button>
                                            <button onClick={async () => {
                                                if (!targetUserId) return;
                                                await handleRecordAction(targetUserId, 'invite_friend', 'manual'); await withRefresh(async () => { });
                                                showNotification("Simulated: Invite");
                                            }} disabled={!targetUserId} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs border border-slate-600">
                                                Simulate Invite
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}