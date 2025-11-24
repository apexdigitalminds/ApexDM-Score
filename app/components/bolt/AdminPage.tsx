"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type {
  Reward,
  Profile,
  ActionType,
  BadgeConfig,
  Quest,
  QuestTask,
  StoreItem,
  Action,
  ItemType,
} from "@/types";

import Leaderboard from "./Leaderboard";
import FeatureLock from "./analytics/FeatureLock";
import ActionLogModal from "./ActionLogModal";
import { iconMap, iconMapKeys, LockClosedIcon, TrophyIcon, UserGroupIcon, ShoppingCartIcon, SparklesIcon, LogoIcon, ClockIcon } from "./icons";

const TabButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  icon: React.ReactNode;
  locked?: boolean; 
}> = ({ active, onClick, label, icon, locked }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
      active 
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
    allUsers, rewardsConfig, badgesConfig, isWhopConnected, community, questsAdmin, storeItems,
    selectedUser: adminUser, handleRecordAction, handleAwardBadge, handleAddReward, handleUpdateReward, handleDeleteReward, handleRestoreReward,
    handleAddBadge, handleUpdateBadge, handleDeleteBadge, handleRestoreBadge, handleTriggerWebhook, isFeatureEnabled,
    handleCreateQuest, handleUpdateQuest, handleDeleteQuest, handleRestoreQuest, handleToggleQuest,
    handleCreateStoreItem, handleUpdateStoreItem, handleDeleteStoreItem, handleRestoreStoreItem, handleToggleStoreItemActive,
    adminUpdateUserStats, adminUpdateUserRole, adminBanUser, adminGetUserEmail, getAllUserActions, fetchAllUsers, adminUpdateCommunityTier,
    handleToggleWhiteLabel,
    getUserItemUsage 
  } = useApp();
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'engagement' | 'store' | 'settings'>('users');

  const [targetUserId, setTargetUserId] = useState<string | null>(allUsers.length > 0 ? allUsers[0].id : null);
  const targetUser = allUsers.find((u: Profile) => u.id === targetUserId);
  
  const [targetUserItemLogs, setTargetUserItemLogs] = useState<any[]>([]);

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
  
  const [editBadgeName, setEditBadgeName] = useState<string | null>(null);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeDesc, setNewBadgeDesc] = useState("");
  const [newBadgeIcon, setNewBadgeIcon] = useState(iconMapKeys[0]);
  const [newBadgeColor, setNewBadgeColor] = useState("#ffffff");
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
  const [metaColor, setMetaColor] = useState("#ffffffff");
  const [metaText, setMetaText] = useState("");
  const [metaUrl, setMetaUrl] = useState("");
  const [metaPosition, setMetaPosition] = useState<'prefix' | 'suffix'>('prefix');

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
  const handleAwardXp = async () => { if (targetUser) { const result = await handleRecordAction(targetUser.id, actionType, "manual"); setTimeout(async () => { await fetchAllUsers(); }, 500); showNotification(`Awarded ${result?.xpGained ?? 0} XP.`); } };
  const handleAwardBadgeClick = async () => { if (targetUser && badgeToAward) { await handleAwardBadge(targetUser.id, badgeToAward); setTimeout(async () => { await fetchAllUsers(); }, 500); showNotification(`Badge awarded.`); } };

  const cancelEditReward = () => { setEditRewardAction(null); setNewActionName(""); setNewActionXp(10); };
  const handleRewardSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (editRewardAction) { await handleUpdateReward(editRewardAction, { xpGained: newActionXp }); showNotification("Reward updated."); } else { await handleAddReward({ actionType: newActionName as any, xpGained: newActionXp }); showNotification("Reward added."); } cancelEditReward(); };
  const handleEditRewardClick = (actionType: string, reward: Reward) => { setEditRewardAction(actionType); setNewActionName(actionType); setNewActionXp(reward?.xpGained ?? 0); };
  const handleDeleteRewardClick = async (actionType: string) => { if (window.confirm(`Archive/Delete "${actionType}"?`)) { await handleDeleteReward(actionType); showNotification("Reward processed."); } };
  const handleRestoreRewardClick = async (actionType: string) => { await handleRestoreReward(actionType); showNotification("Restored."); };
  const handleToggleRewardActive = async (actionType: string, isActive: boolean) => { await handleUpdateReward(actionType, { isActive } as any); };

  const cancelEditBadge = () => { setEditBadgeName(null); setNewBadgeName(""); setNewBadgeDesc(""); setBadgeIconType('PRESET'); setNewBadgeIcon(iconMapKeys[0]); };
  const handleAddOrEditBadge = async (e: React.FormEvent) => { e.preventDefault(); const badgeData = { description: newBadgeDesc, icon: newBadgeIcon, color: newBadgeColor }; if (editBadgeName) { await handleUpdateBadge(editBadgeName, badgeData); showNotification("Badge updated."); } else { await handleAddBadge({ id: crypto.randomUUID(), name: newBadgeName, ...badgeData }); showNotification("Badge added."); } cancelEditBadge(); };
  const handleEditBadgeClick = (badgeName: string, config: BadgeConfig) => { setEditBadgeName(badgeName); setNewBadgeName(badgeName); setNewBadgeDesc(config.description); setNewBadgeColor(config.color); if (iconMapKeys.includes(config.icon)) { setBadgeIconType('PRESET'); setNewBadgeIcon(config.icon); } else { setBadgeIconType('EMOJI'); setNewBadgeIcon(config.icon); } };
  const handleDeleteBadgeClick = async (name: string) => { if(window.confirm(`Archive/Delete "${name}"?`)) { await handleDeleteBadge(name); showNotification("Badge processed."); }};
  const handleRestoreBadgeClick = async (name: string) => { await handleRestoreBadge(name); showNotification("Restored."); };
  const handleToggleBadgeActive = async (name: string, isActive: boolean) => { await handleUpdateBadge(name, { isActive }); };

  const resetQuestForm = () => { setEditingQuest(null); setQuestTitle(""); setQuestDescription(""); setQuestXpReward(100); setQuestBadgeReward(null); setQuestTasks([{ actionType: (Object.keys(rewardsConfig)[0] as ActionType) || "watch_content", targetCount: 1, description: "" }]); };
  useEffect(() => { if (Object.keys(rewardsConfig).length > 0 && questTasks.length === 0) resetQuestForm(); }, [rewardsConfig]);
  const handleEditQuestClick = (q: Quest) => { setEditingQuest(q); setQuestTitle(q.title); setQuestDescription(q.description ?? ""); setQuestXpReward(q.xpReward); setQuestBadgeReward(q.badgeReward ?? null); setQuestTasks(q.tasks || []); };
  const handleUpdateTask = (idx: number, field: keyof QuestTask, val: any) => { const t = [...questTasks]; (t[idx] as any)[field] = val; setQuestTasks(t); };
  const handleAddTask = () => setQuestTasks([...questTasks, { actionType: Object.keys(rewardsConfig)[0] as ActionType, targetCount: 1, description: "" }]);
  const handleRemoveTask = (idx: number) => { if (questTasks.length > 1) setQuestTasks(questTasks.filter((_, i) => i !== idx)); };
  const handleQuestSubmit = async (e: React.FormEvent) => { e.preventDefault(); const q = { title: questTitle, description: questDescription, xpReward: questXpReward, badgeRewardId: questBadgeReward ?? undefined, tasks: questTasks as QuestTask[] }; if (editingQuest) await handleUpdateQuest(editingQuest.id, q); else await handleCreateQuest(q); showNotification("Quest saved."); resetQuestForm(); };
  const handleDeleteQuestClick = async (q: Quest) => { if(window.confirm(`Archive/Delete quest "${q.title}"?`)) { await handleDeleteQuest(q.id); showNotification("Quest processed."); }};
  const handleRestoreQuestClick = async (q: Quest) => { if(handleRestoreQuest) { await handleRestoreQuest(q.id); showNotification("Quest restored."); }};
  const handleToggleQuestClick = async (q: Quest) => { await handleToggleQuest(q.id, !q.isActive); };

  const resetItemForm = () => { setEditingItem(null); setItemName(""); setItemDescription(""); setItemCost(500); setItemIcon("Snowflake"); setItemType("INSTANT"); setItemDuration(undefined); setItemModifier(undefined); setMetaColor("#ffffffff"); setMetaPosition("prefix"); setMetaText(""); setMetaUrl(""); };
  const handleEditItemClick = (i: StoreItem) => { setEditingItem(i); setItemName(i.name); setItemDescription(i.description ?? ""); setItemCost(i.cost); setItemIcon(i.icon); setItemType(i.itemType); setItemDuration(i.durationHours); setItemModifier(i.modifier); if (i.metadata?.color) setMetaColor(i.metadata.color); if (i.metadata?.text) setMetaText(i.metadata.text); if (i.metadata?.imageUrl) setMetaUrl(i.metadata.imageUrl); if (i.metadata?.titlePosition) setMetaPosition(i.metadata.titlePosition); };
  const handleItemSubmit = async (e: React.FormEvent) => { e.preventDefault(); const metadata: any = {}; if (itemType === 'NAME_COLOR'|| itemType === 'AVATAR_PULSE') metadata.color = metaColor; if (itemType === 'TITLE') metadata.text = metaText; metadata.titlePosition = metaPosition; if (itemType === 'BANNER' || itemType === 'FRAME') metadata.imageUrl = metaUrl; const i = { name: itemName, description: itemDescription, cost: itemCost, icon: itemIcon, isActive: true, itemType, durationHours: itemType === 'TIMED_EFFECT' ? itemDuration : undefined, modifier: itemType === 'TIMED_EFFECT' ? itemModifier : undefined, metadata }; if(editingItem) await handleUpdateStoreItem(editingItem.id, i); else await handleCreateStoreItem(i); showNotification("Item saved."); resetItemForm(); };
  const handleDeleteItemClick = async (i: StoreItem) => { if(window.confirm("Delete item?")) { await handleDeleteStoreItem(i.id); showNotification("Item deleted."); }};
  const handleRestoreItemClick = async (i: StoreItem) => { await handleRestoreStoreItem(i.id); showNotification("Restored."); };
  const handleToggleStoreItem = async (id: string, isActive: boolean) => { await handleToggleStoreItemActive(id, isActive); };

  const handleAdminStatUpdate = async () => { if(!targetUser) return; await adminUpdateUserStats(targetUser.id, editXp, editStreak, editFreezes); setTimeout(async () => { await fetchAllUsers(); }, 500); showNotification("Stats updated."); };
  const handleAdminRoleUpdate = async () => { if(!targetUser) return; await adminUpdateUserRole(targetUser.id, editRole); setTimeout(async () => { await fetchAllUsers(); }, 500); showNotification("Role updated."); };
  const handleAdminBan = async (h: number|null) => { if(!targetUser) return; if(window.confirm(`Confirm ban?`)) { await adminBanUser(targetUser.id, h); setTimeout(async () => { await fetchAllUsers(); }, 500); showNotification("Ban status updated."); }};
  const handlePasswordReset = async () => { if(!targetUser) return; const e = await adminGetUserEmail(targetUser.id); if(e) alert(`Email: ${e}`); };
  const handleViewLogs = async () => { if(!targetUser) return; const l = await getAllUserActions(targetUser.id); setLogActions(l); setIsLogModalOpen(true); };
  const handleTierChange = async (e: React.ChangeEvent<HTMLSelectElement>) => { const newTier = e.target.value as 'Core' | 'Pro' | 'Elite'; const success = await adminUpdateCommunityTier(newTier); showNotification(success ? `Tier changed.` : `Failed.`); };
  const handleSimulateRenewal = async (userId: string) => { if (!userId) return; const message = await handleTriggerWebhook(userId, "renew_subscription"); if (message) { await fetchAllUsers(); showNotification(message, 4000); } };
  
  const isSelf = targetUser?.id === adminUser?.id;
  const isDev = process.env.NODE_ENV === 'development';

  const filteredRewards = Object.entries(rewardsConfig).filter(([_, r]) => showArchivedRewards ? (r as Reward).isArchived : !(r as Reward).isArchived);
  const filteredQuests = questsAdmin.filter((q: Quest) => showArchivedQuests ? q.isArchived : !q.isArchived);
  const filteredBadges = Object.entries(badgesConfig).filter(([_, b]) => showArchivedBadges ? (b as any).isArchived : !(b as any).isArchived);
  const filteredStore = storeItems.filter((i: StoreItem) => showArchivedStore ? i.isArchived : !i.isArchived);

  const popularEmojis = ["🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🔥", "🚀", "💎", "💰", "🛡️", "⚔️", "🏹", "🧪", "📜", "❤️", "⭐", "👑", "💀", "⚡", "🦄", "🐲", "👾", "🍄", "🎓", "🎟️", "🎨", "🎵", "📣", "🤝", "🌍", "🎁", "💡", "⚙️", "🔒", "🔑"];

  // Helper to render icon preview
  const RenderIconPreview = ({ iconName, color }: { iconName: string, color?: string }) => {
      const IconComponent = iconMap[iconName] || iconMap['Snowflake'];
      return <IconComponent className="w-5 h-5" style={{ color: color || '#a855f7' }} />;
  };

  return (
    <div className="space-y-6 pb-20">
      {notification && <div className="fixed top-20 right-8 bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 border border-slate-600 animate-bounce">{notification}</div>}
      {isLogModalOpen && targetUser && <ActionLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} username={targetUser.username} actions={logActions} />}

      {/* ... (Header and Tabs - Keeping Same) ... */}
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
               <span className="flex items-center gap-1.5 text-green-400"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>Active</span><span className="text-slate-600">|</span><span className="text-slate-200 font-semibold">{allUsers.length} Players</span><span className="text-slate-600">|</span><span className={`uppercase tracking-wider font-bold ${(community?.tier?.toLowerCase() === 'elite') ? 'text-purple-400' : (community?.tier?.toLowerCase() === 'pro') ? 'text-orange-400' : 'text-blue-400'}`}>{community?.tier || "Free"} Plan</span>
             </div>
             <p className="text-slate-400 text-sm mt-3">Manage your gamification economy.</p>
           </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-1">
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" icon={<UserGroupIcon className="w-5 h-5"/>} />
        <TabButton active={activeTab === 'engagement'} onClick={() => setActiveTab('engagement')} label="Engagement" icon={<TrophyIcon className="w-5 h-5"/>} locked={!isFeatureEnabled('quests')} />
        <TabButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} label="XP Store" icon={<ShoppingCartIcon className="w-5 h-5"/>} locked={!isFeatureEnabled('store')} />
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Settings" icon={<SparklesIcon className="w-5 h-5"/>} />
      </div>

      {/* USERS TAB (Omitted for brevity, same as before) */}
      {activeTab === 'users' && (
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
                                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Item History</h4>
                                     <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                         {targetUserItemLogs.length > 0 ? targetUserItemLogs.map((log: any) => (
                                             <div key={log.id} className="flex justify-between text-[10px] bg-slate-900/50 p-1.5 rounded">
                                                 <span className="text-slate-300">{log.item_name}</span>
                                                 <span className="text-slate-500">{new Date(log.used_at).toLocaleDateString()}</span>
                                             </div>
                                         )) : (
                                             <p className="text-xs text-slate-600 italic">No items used.</p>
                                         )}
                                     </div>
                                 </div>
                                 {isDev && <button onClick={handlePasswordReset} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-xs mb-2">Reset Password (Dev Only)</button>}
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
      )}

      {/* ENGAGEMENT TAB */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
            {/* ... (Engagement Tab Code) ... */}
            {/* For brevity, I'm pasting the minimal wrapper, assume same content as before */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Manage XP Reward Actions</h3>
                        <label className="flex items-center cursor-pointer text-xs"><input type="checkbox" checked={showArchivedRewards} onChange={() => setShowArchivedRewards(!showArchivedRewards)} className="sr-only peer"/><span className="text-slate-400 mr-2">Show Archived</span><div className="w-7 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 relative"></div></label>
                    </div>
                     <form onSubmit={handleRewardSubmit} className="bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-600">
                        <div className="flex gap-2 mb-2">
                            <input type="text" value={newActionName} onChange={e => setNewActionName(e.target.value)} placeholder="Action ID" required disabled={!!editRewardAction} className="bg-slate-800 border-slate-600 text-white rounded p-2 flex-1 text-sm" />
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
                                    <div><p className={`font-bold text-sm ${r.isArchived ? 'text-red-300' : 'text-white'}`}>{key}</p><div className="flex gap-2 text-xs mt-0.5"><span className="text-yellow-400 font-bold">{r.xpGained} XP</span>{!r.isArchived && <span className={r.isActive ? "text-green-400" : "text-slate-500"}>{r.isActive ? "Active" : "Draft"}</span>}</div></div>
                                    <div className="flex gap-2 items-center">
                                         {!r.isArchived && <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={r.isActive} onChange={() => handleToggleRewardActive(key, !r.isActive)} /><div className="w-8 h-4 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div></label>}
                                        {r.isArchived ? <button onClick={() => handleRestoreRewardClick(key)} className="text-green-400 hover:text-green-300 text-xs font-bold">Restore</button> : <><button onClick={() => handleEditRewardClick(key, r)} className="text-slate-400 hover:text-white text-xs font-bold">Edit</button><button onClick={() => handleDeleteRewardClick(key)} className="text-red-500 hover:text-red-400 text-xs font-bold">Delete</button></>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Manage Quests</h3>
                        {isFeatureEnabled('quests') ? (
                             <label className="flex items-center cursor-pointer text-xs"><input type="checkbox" checked={showArchivedQuests} onChange={() => setShowArchivedQuests(!showArchivedQuests)} className="sr-only peer"/><span className="text-slate-400 mr-2">Show Archived</span><div className="w-7 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 relative"></div></label>
                        ) : <span className=""></span>}
                    </div>
                    {isFeatureEnabled('quests') ? (
                        <>
                             <form onSubmit={handleQuestSubmit} className="bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-600">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                    <input type="text" value={questTitle} onChange={e => setQuestTitle(e.target.value)} placeholder="Title" required className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm" />
                                    <input type="number" value={questXpReward} onChange={e => setQuestXpReward(parseInt(e.target.value))} placeholder="XP" className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm" />
                                </div>
                                <textarea value={questDescription} onChange={e => setQuestDescription(e.target.value)} placeholder="Description" className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm mb-2" rows={1} />
                                <div className="space-y-1 max-h-20 overflow-y-auto mb-2">
                                    {questTasks.map((t, i) => (
                                        <div key={i} className="flex gap-1">
                                            <select value={t.actionType} onChange={e => handleUpdateTask(i, 'actionType', e.target.value)} className="bg-slate-800 text-white text-xs rounded p-1 border border-slate-600 flex-1">{Object.keys(rewardsConfig).map(k => <option key={k} value={k}>{k}</option>)}</select>
                                            <input type="number" value={t.targetCount} onChange={e => handleUpdateTask(i, 'targetCount', parseInt(e.target.value))} className="bg-slate-800 text-white text-xs rounded p-1 border border-slate-600 w-10 text-center" />
                                            <button type="button" onClick={() => handleRemoveTask(i)} className="text-red-400 px-1">×</button>
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
                                            {!q.isArchived && <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={q.isActive} onChange={() => handleToggleQuestClick(q)} /><div className="w-8 h-4 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div></label>}
                                            {q.isArchived ? <button onClick={() => handleRestoreQuestClick(q)} className="text-green-400 text-xs font-bold">Restore</button> : <><button onClick={() => handleEditQuestClick(q)} className="text-slate-400 text-xs font-bold">Edit</button><button onClick={() => handleDeleteQuestClick(q)} className="text-red-500 text-xs font-bold">Delete</button></>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (<div className="h-full flex flex-col justify-center"><FeatureLock title="Quests System" description="Requires Pro." requiredTier="Pro" /></div>)}
                </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Manage Badges</h3>
                     <label className="flex items-center cursor-pointer text-xs"><input type="checkbox" checked={showArchivedBadges} onChange={() => setShowArchivedBadges(!showArchivedBadges)} className="sr-only peer"/><span className="text-slate-400 mr-2">Show Archived</span><div className="w-7 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 relative"></div></label>
                </div>
                <form onSubmit={handleAddOrEditBadge} className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-4 border border-slate-600">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-1"><label className="text-xs text-slate-400 mb-1 block">Name</label><input type="text" value={newBadgeName} onChange={e => setNewBadgeName(e.target.value)} placeholder="Badge Name" required disabled={!!editBadgeName} className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm" /></div>
                        <div className="col-span-2"><label className="text-xs text-slate-400 mb-1 block">Description</label><input type="text" value={newBadgeDesc} onChange={e => setNewBadgeDesc(e.target.value)} placeholder="Description" required className="bg-slate-800 border-slate-600 text-white rounded p-2 w-full text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="col-span-1">
                             <div className="flex justify-between items-center mb-1"><label className="text-xs text-slate-400 block">Icon Type</label><button type="button" onClick={() => { const newType = badgeIconType === 'PRESET' ? 'EMOJI' : 'PRESET'; setBadgeIconType(newType); setNewBadgeIcon(newType === 'PRESET' ? iconMapKeys[0] : '🏆'); }} className="text-[10px] uppercase font-bold bg-slate-600 px-2 py-0.5 rounded text-white hover:bg-slate-500">{badgeIconType} ⟳</button></div>
                             <div className="flex gap-2 items-center">
                                <div className="w-9 h-9 bg-slate-800 rounded border border-slate-600 flex items-center justify-center flex-none overflow-hidden">{badgeIconType === 'PRESET' ? ((() => { const PreviewIcon = iconMap[newBadgeIcon] || iconMap['Star']; return <PreviewIcon className="w-5 h-5" style={{ color: newBadgeColor }} />; })()) : (<span className="text-xl leading-none select-none">{newBadgeIcon}</span>)}</div>
                                {badgeIconType === 'PRESET' ? (<select value={newBadgeIcon} onChange={e => setNewBadgeIcon(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm h-9 w-full">{iconMapKeys.map(k => <option key={k} value={k}>{k}</option>)}</select>) : (<select value={popularEmojis.includes(newBadgeIcon) ? newBadgeIcon : popularEmojis[0]} onChange={e => setNewBadgeIcon(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm h-9 w-full font-emoji">{popularEmojis.map(emoji => (<option key={emoji} value={emoji}>{emoji}</option>))}</select>)}
                            </div>
                        </div>
                        <div className="col-span-2 flex gap-4 items-end">
                            <div><label className="text-xs text-slate-400 mb-1 block">Color</label><input type="color" value={newBadgeColor} onChange={e => setNewBadgeColor(e.target.value)} className="h-9 w-12 cursor-pointer bg-transparent border-0 p-0" /></div>
                            <div className="flex gap-2 flex-none"><button type="submit" className="bg-blue-600 text-white px-4 h-9 rounded hover:bg-blue-700 font-bold text-sm w-72">{editBadgeName ? 'Update' : 'Add Badge'}</button>{editBadgeName && (<button type="button" onClick={cancelEditBadge} className="bg-slate-600 text-white px-3 h-9 rounded hover:bg-slate-500 text-sm">Cancel</button>)}</div>
                        </div>
                    </div>
                </form>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2 max-h-[400px]">
                     {filteredBadges.map(([name, config]) => {
                        const b = config as any; 
                        const isEmoji = !iconMap[b.icon];
                        const BadgeIcon = iconMap[b.icon] || iconMap['Star'];
                        return (
                        <div key={name} className={`flex justify-between items-center p-3 rounded border ${b.isArchived ? 'bg-red-900/10 border-red-900/30' : 'bg-slate-700/30 border-slate-700 hover:border-slate-500'} transition-colors`}>
                             <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 border border-slate-600">{isEmoji ? (<span className="text-xl select-none">{b.icon}</span>) : (<BadgeIcon className="w-6 h-6" style={{ color: b.color }} />)}</div><div><p className={`font-bold text-sm ${b.isArchived ? 'text-red-300' : 'text-white'}`}>{name}</p><p className="text-xs text-slate-400">{b.description}</p><div className="flex gap-2 text-xs mt-0.5">{!b.isArchived && <span className={b.isActive !== false ? "text-green-400" : "text-slate-500"}>{b.isActive !== false ? "Active" : "Draft"}</span>}</div></div></div>
                            <div className="flex gap-2 items-center">{!b.isArchived && <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={b.isActive !== false} onChange={() => handleToggleBadgeActive(name, !(b.isActive !== false))} /><div className="w-8 h-4 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div></label>}{b.isArchived ? <button onClick={() => handleRestoreBadgeClick(name)} className="text-green-400 text-xs font-bold">Restore</button> : <><button onClick={() => handleEditBadgeClick(name, config as BadgeConfig)} className="text-slate-400 text-xs font-bold">Edit</button><button onClick={() => handleDeleteBadgeClick(name)} className="text-red-500 text-xs font-bold">Delete</button></>}</div>
                        </div>
                    )})}
                </div>
            </div>
        </div>
      )}

      {/* STORE TAB */}
      {activeTab === 'store' && (
             <div className="bg-slate-800 p-6 rounded-2xl shadow-lg h-[800px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">XP Store Management</h3>
                     {isFeatureEnabled('store') ? (
                         <label className="flex items-center cursor-pointer text-xs">
                            <input type="checkbox" checked={showArchivedStore} onChange={() => setShowArchivedStore(!showArchivedStore)} className="sr-only peer"/>
                            <span className="text-slate-400 mr-2">Show Archived</span>
                            <div className="w-7 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 relative"></div>
                        </label>
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

                             {/* Dynamic Type Selector */}
                             <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Item Type</label>
                                    <select value={itemType} onChange={e => setItemType(e.target.value as ItemType)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full">
                                        <option value="INSTANT">Instant Consumable</option>
                                        <option value="TIMED_EFFECT">Timed Effect (Boost)</option>
                                        <option value="NAME_COLOR">Name Color (Cosmetic)</option>
                                        <option value="TITLE">Title / Prefix (Cosmetic)</option>
                                        <option value="BANNER">Profile Banner (Cosmetic)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Icon</label>
                                    <div className="flex gap-2 items-center">
                                        {/* 🟢 NEW: Icon Preview */}
                                        <div className="w-10 h-10 bg-slate-800 rounded border border-slate-600 flex items-center justify-center flex-none">
                                            <RenderIconPreview iconName={itemIcon} color={metaColor || '#a855f7'} />
                                        </div>
                                        <select value={itemIcon} onChange={e => setItemIcon(e.target.value)} className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full h-10">
                                            {iconMapKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                </div>
                             </div>

                             {/* Conditional Fields */}
                             <div className="bg-slate-900/50 p-3 rounded border border-slate-700 mb-4">
                                {itemType === 'TIMED_EFFECT' && (
                                    <div className="flex gap-2">
                                        <input type="number" value={itemDuration || ''} onChange={e => setItemDuration(parseInt(e.target.value))} placeholder="Hours" className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm flex-1" />
                                        <input type="number" value={itemModifier || ''} onChange={e => setItemModifier(parseFloat(e.target.value))} placeholder="Multiplier (e.g. 1.5)" className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm flex-1" />
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
          <label className="block text-xs text-slate-400 mb-1">Image URL</label>
          <input type="text" value={metaUrl} onChange={e => setMetaUrl(e.target.value)} placeholder="https://..." className="bg-slate-800 border-slate-600 text-white rounded p-2 text-sm w-full" />
          {itemType === 'BANNER' && <p className="text-[10px] text-slate-500 mt-1">Recommended Size: 1200x300px (JPG/PNG)</p>}
      </div>
  )}
                                {itemType === 'INSTANT' && <p className="text-xs text-slate-500 italic">Standard consumable item.</p>}
                             </div>

                             <div className="flex gap-2">
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold text-sm w-full">{editingItem ? 'Update Item' : 'Create Item'}</button>
                                {editingItem && <button type="button" onClick={resetItemForm} className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500 text-sm">Cancel</button>}
                            </div>
                        </form>
                        
                        {/* List of Items */}
                        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                            {storeItems.filter(i => showArchivedStore ? i.isArchived : !i.isArchived).map(item => (
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
                                         {!item.isArchived && <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={item.isActive} onChange={() => handleToggleStoreItem(item.id, !item.isActive)} /><div className="w-8 h-4 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div></label>}
                                        {item.isArchived ? <button onClick={() => handleRestoreItemClick(item)} className="text-green-400 text-xs font-bold">Restore</button> : <><button onClick={() => handleEditItemClick(item)} className="text-slate-400 text-xs font-bold">Edit</button><button onClick={() => handleDeleteItemClick(item)} className="text-red-500 text-xs font-bold">Delete</button></>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <FeatureLock title="XP Store" description="Requires Elite." requiredTier="Elite" />
                )}
             </div>
      )}

      {/* SETTINGS TAB (Keeping existing logic) */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Webhook Integration</h3>
                <p className="text-slate-400 text-sm mb-4">Paste this URL into your Whop Developer Dashboard to receive automatic updates for subscriptions and payments.</p>
                <div className="flex items-center gap-2 bg-slate-900 p-3 rounded border border-slate-700">
                    <code className="text-green-400 text-sm flex-1 truncate">{webhookUrl}</code>
                    <button onClick={handleCopyWebhook} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded">Copy</button>
                </div>
            </div>
            {isFeatureEnabled('discord') ? (
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 shadow-md">COMING SOON</div>
                    <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><span className="text-blue-400">Discord Role Sync</span></h3>
                        <div className="space-y-4"><p className="text-sm text-slate-300">Automatically assign Discord roles (e.g. "Viking") when users level up.</p><button disabled className="w-full bg-slate-700 text-slate-400 py-2 rounded cursor-not-allowed text-sm font-bold border border-slate-600">🚧 Under Construction</button></div>
                    </div>
                </div>
            ) : <FeatureLock title="Discord Role Sync" description="Sync roles." requiredTier="Pro"><div className="space-y-4 pt-2"><div className="h-6 w-1/3 bg-slate-600 rounded"></div><div className="flex gap-2"><div className="h-10 flex-grow bg-slate-700 rounded border border-slate-600"></div><div className="h-10 w-20 bg-blue-600/30 rounded"></div></div><div className="h-24 w-full bg-slate-700/50 rounded border border-slate-600"></div></div></FeatureLock>}
            
            {isFeatureEnabled('white_label') ? (
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-500/30">
                    <h3 className="text-lg font-bold text-white mb-4">White-Label Branding</h3>
                    <div className="space-y-4"><label className="flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={community?.whiteLabelEnabled ?? false} onChange={(e) => handleToggleWhiteLabel(e.target.checked)} /><div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 relative mr-3"></div><span className="text-sm text-slate-300 font-medium">Remove "Powered by ApexDM"</span></label><p className="text-xs text-slate-400">Your dashboard footer will be hidden from members.</p></div>
                </div>
            ) : <FeatureLock title="White-Label Branding" description="Remove branding." requiredTier="Elite"><div className="space-y-6 pt-2"><div className="flex items-center justify-between"><div className="h-6 w-32 bg-slate-600 rounded"></div><div className="h-6 w-12 bg-purple-600/30 rounded-full"></div></div><div className="h-px w-full bg-slate-700"></div><div className="h-4 w-3/4 bg-slate-700 rounded"></div><div className="h-4 w-1/2 bg-slate-700 rounded"></div></div></FeatureLock>}

            {isDev && (
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-yellow-600/30 lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><span>🧪</span> Simulation Mode (Dev)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-400 mb-1">Simulate Tier</label><select value={community?.tier?.toLowerCase() || "core"} onChange={handleTierChange} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"><option value="core">Core (Basic)</option><option value="pro">Pro (Quests)</option><option value="elite">Elite (Store)</option></select></div><div className="flex items-end"><button onClick={() => handleSimulateRenewal(targetUserId || '')} disabled={!targetUserId} className="w-full bg-slate-700 text-white py-2 rounded hover:bg-slate-600 text-sm">Simulate Renewal (+XP)</button></div></div>
                </div>
            )}
        </div>
      )}
    </div>
  );
}