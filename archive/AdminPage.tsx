"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useApp } from "@/context/AppContext";

import type {
  Reward,
  Profile,
  ActionType,
  BadgeConfig,
  Badge,
  Quest,
  QuestTask,
  StoreItem,
  Action,
} from "@/types";

import Leaderboard from "./Leaderboard";
import BadgeItem from "./BadgeItem";
import ActionLogModal from "./ActionLogModal";
import { iconMapKeys, LockClosedIcon, DiscordIcon, TrophyIcon } from "./icons";

export default function AdminPage() {
  const {
    allUsers,
    rewardsConfig,
    badgesConfig,
    isWhopConnected,
    community,
    questsAdmin,
    storeItems,
    selectedUser: adminUser,
    handleRecordAction,
    handleAwardBadge,
    handleAddReward,
    handleUpdateReward,
    handleDeleteReward,
    handleRestoreReward,
    handleAddBadge,
    handleUpdateBadge,
    handleDeleteBadge,
    handleRestoreBadge,
    handleTriggerWebhook,
    isFeatureEnabled,
    handleCreateQuest,
    handleUpdateQuest,
    handleDeleteQuest,
    handleToggleQuest,
    handleCreateStoreItem,
    handleUpdateStoreItem,
    handleDeleteStoreItem,
    handleToggleStoreItemActive,
    adminUpdateUserStats,
    adminUpdateUserRole,
    adminBanUser,
    adminGetUserEmail,
    getAllUserActions,
    fetchAllUsers, 
    adminUpdateCommunityTier,
  } = useApp();
  const router = useRouter();

  const [targetUserId, setTargetUserId] = useState<string | null>(
    allUsers.length > 0 ? allUsers[0].id : null
  );
  const targetUser = allUsers.find((u: Profile) => u.id === targetUserId);

  useEffect(() => {
    if (!targetUserId && allUsers.length > 0) {
      setTargetUserId(allUsers[0].id);
    }
  }, [allUsers, targetUserId]);

  const [actionType, setActionType] = useState<ActionType>("watch_content");
  const [badgeToAward, setBadgeToAward] = useState<string>(
    Object.keys(badgesConfig)[0] || ""
  );
  const [notification, setNotification] = useState("");

  const [editRewardAction, setEditRewardAction] = useState<string | null>(null);
  const [newActionName, setNewActionName] = useState("");
  const [newActionXp, setNewActionXp] = useState(10);

  const [editBadgeName, setEditBadgeName] = useState<string | null>(null);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeDesc, setNewBadgeDesc] = useState("");
  const [newBadgeIcon, setNewBadgeIcon] = useState(iconMapKeys[0]);
  const [newBadgeColor, setNewBadgeColor] = useState("#ffffff");

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
  const [itemType, setItemType] = useState<"INSTANT" | "TIMED_EFFECT">("INSTANT");
  const [itemDuration, setItemDuration] = useState<number | undefined>(undefined);
  const [itemModifier, setItemModifier] = useState<number | undefined>(undefined);

  const discordActions = ["ask_good_question", "share_alpha"];
  const [discordAction, setDiscordAction] = useState(discordActions[0]);
  const [discordChannel, setDiscordChannel] = useState("#general");

  const [editXp, setEditXp] = useState(0);
  const [editStreak, setEditStreak] = useState(0);
  const [editFreezes, setEditFreezes] = useState(0);
  const [editRole, setEditRole] = useState<"member" | "admin">("member");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logActions, setLogActions] = useState<Action[]>([]);

  useEffect(() => {
    if (targetUser) {
      setEditXp(targetUser.xp);
      setEditStreak(targetUser.streak);
      setEditFreezes(targetUser.streakFreezes ?? 0);
      setEditRole((targetUser.role as "member" | "admin") ?? "member");
    }
  }, [targetUser]);

  const showNotification = (message: string, duration: number = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(""), duration);
  };

  const handleAwardXp = async () => {
    if (targetUser) {
      const result = await handleRecordAction(
        targetUser.id,
        actionType,
        "manual"
      );
      if (result) await fetchAllUsers(); 
      const gained = result?.xpGained ?? 0;
      showNotification(
        `Awarded ${gained} XP for ${actionType.replace(/_/g, " ")} to ${
          targetUser.username
        }.`
      );
    }
  };

  const handleAwardBadgeClick = async () => {
    if (targetUser && badgeToAward) {
      await handleAwardBadge(targetUser.id, badgeToAward);
      await fetchAllUsers(); 
      showNotification(`Badge "${badgeToAward}" awarded to ${targetUser.username}`);
    }
  };

  const cancelEditReward = () => {
    setEditRewardAction(null);
    setNewActionName("");
    setNewActionXp(10);
  };

  const handleRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editRewardAction) {
      await handleUpdateReward(editRewardAction, { xpGained: newActionXp });
      showNotification(`Updated reward '${editRewardAction}' to ${newActionXp} XP.`);
    } else {
      await handleAddReward({
        actionType: newActionName,
        xpGained: newActionXp,
      });
      showNotification(`Added new action: '${newActionName}' (${newActionXp} XP).`);
    }
    cancelEditReward();
  };

  const handleEditRewardClick = (actionType: string, reward: Reward) => {
    setEditRewardAction(actionType);
    setNewActionName(actionType);
    setNewActionXp(reward?.xpGained ?? 0);
  };

  const handleDeleteRewardClick = async (actionType: string) => {
    if (
      window.confirm(
        `This will archive the reward "${actionType}" if it has been used, or delete it permanently if it has not. Continue?`
      )
    ) {
      await handleDeleteReward(actionType);
      showNotification(`Reward "${actionType}" deleted.`, 4000);
    }
  };

  const handleRestoreRewardClick = async (actionType: string) => {
    await handleRestoreReward(actionType);
    showNotification(`Reward "${actionType}" restored successfully.`);
  };

  const cancelEditBadge = () => {
    setEditBadgeName(null);
    setNewBadgeName("");
    setNewBadgeDesc("");
    setNewBadgeIcon(iconMapKeys[0]);
    setNewBadgeColor("#ffffff");
  };

  const handleAddOrEditBadge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editBadgeName) {
      await handleUpdateBadge(editBadgeName, {
        description: newBadgeDesc,
        icon: newBadgeIcon,
        color: newBadgeColor,
      });
      showNotification(`Updated badge '${editBadgeName}'.`);
      cancelEditBadge();
    } else {
      await handleAddBadge({
        id: crypto.randomUUID(),
        name: newBadgeName,
        description: newBadgeDesc || "",
        icon: newBadgeIcon || "",
        color: newBadgeColor || "",
      });
      showNotification(`Added new badge: '${newBadgeName}'.`);
      cancelEditBadge();
    }
  };

  const handleEditBadgeClick = (badgeName: string, config: BadgeConfig) => {
    setEditBadgeName(badgeName);
    setNewBadgeName(badgeName);
    setNewBadgeDesc(config.description);
    setNewBadgeIcon(config.icon);
    setNewBadgeColor(config.color);
  };

  const handleDeleteBadgeClick = async (badgeName: string) => {
    if (
      window.confirm(
        `This will archive the badge "${badgeName}" if it has been awarded, or delete it permanently if it has not. Continue?`
      )
    ) {
      const result = await handleDeleteBadge(badgeName);
      showNotification(result?.message || `Deleted badge: ${badgeName}`, 4000);
    }
  };

  const handleRestoreBadgeClick = async (badgeName: string) => {
    const result = await handleRestoreBadge(badgeName);
    showNotification(result.message);
  };

  const resetQuestForm = () => {
    setEditingQuest(null);
    setQuestTitle("");
    setQuestDescription("");
    setQuestXpReward(100);
    setQuestBadgeReward(null);
    setQuestTasks([
      {
        actionType: (Object.keys(rewardsConfig)[0] as ActionType) ?? "watch_content",
        targetCount: 1,
        description: "",
      },
    ]);
  };

  useEffect(() => {
    if (Object.keys(rewardsConfig).length > 0 && questTasks.length === 0) {
      resetQuestForm();
    }
  }, [rewardsConfig]);

  const handleEditQuestClick = (quest: Quest) => {
    setEditingQuest(quest);
    setQuestTitle(quest.title);
    setQuestDescription(quest.description ?? "");
    setQuestXpReward(quest.xpReward);
    setQuestBadgeReward(quest.badgeReward ?? null);
    setQuestTasks((quest.tasks ?? []).map((t) => ({ ...t })));
  };

  const handleUpdateTask = (
    index: number,
    field: keyof QuestTask,
    value: string | number
  ) => {
    const newTasks = [...questTasks];
    (newTasks[index] as any)[field] = value;
    setQuestTasks(newTasks);
  };

  const handleAddTask = () => {
    setQuestTasks([
      ...questTasks,
      {
        actionType: Object.keys(rewardsConfig)[0] as ActionType,
        targetCount: 1,
        description: "",
      },
    ]);
  };

  const handleRemoveTask = (index: number) => {
    if (questTasks.length > 1) {
      setQuestTasks(questTasks.filter((_, i) => i !== index));
    }
  };

  const handleQuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const questData = {
      title: questTitle,
      description: questDescription,
      xpReward: questXpReward,
      badgeReward: questBadgeReward,
      tasks: questTasks as QuestTask[],
    };

    let success = false;
    if (editingQuest) {
      success = await handleUpdateQuest(editingQuest.id, questData);
      if (success) showNotification(`Updated quest: ${questTitle}`);
    } else {
      success = await handleCreateQuest(questData);
      if (success) showNotification(`Created new quest: ${questTitle}`);
    }

    if (success) {
      resetQuestForm();
    } else {
      showNotification("An error occurred. Please try again.");
    }
  };

  const handleDeleteQuestClick = async (quest: Quest) => {
    if (
      window.confirm(
        `Are you sure you want to delete the quest "${quest.title}"? This cannot be undone.`
      )
    ) {
      const success = await handleDeleteQuest(quest.id);
      if (success) {
        showNotification(`Deleted quest: ${quest.title}`);
        if (editingQuest?.id === quest.id) {
          resetQuestForm();
        }
      } else {
        showNotification(`Failed to delete quest.`);
      }
    }
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemName("");
    setItemDescription("");
    setItemCost(500);
    setItemIcon("Snowflake");
    setItemType("INSTANT");
    setItemDuration(undefined);
    setItemModifier(undefined);
  };

  const handleEditItemClick = (item: StoreItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description ?? "");
    setItemCost(item.cost);
    setItemIcon(item.icon);
    setItemType(item.itemType);
    setItemDuration(item.durationHours || undefined);
    setItemModifier(item.modifier || undefined);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData: Partial<StoreItem> = {
      name: itemName,
      description: itemDescription,
      cost: itemCost,
      icon: itemIcon,
      isActive: editingItem?.isActive ?? true,
      itemType: itemType,
      durationHours: itemType === "TIMED_EFFECT" ? itemDuration || 24 : undefined,
      modifier: itemType === "TIMED_EFFECT" ? itemModifier || 1 : undefined,
    };

    let success = false;
    if (editingItem) {
      success = await handleUpdateStoreItem(editingItem.id, itemData);
      if (success) showNotification(`Updated item: ${itemName}`);
    } else {
      success = await handleCreateStoreItem(itemData);
      if (success) showNotification(`Created new item: ${itemName}`);
    }

    if (success) {
      resetItemForm();
    } else {
      showNotification("An error occurred saving the item.");
    }
  };

  const handleDeleteItemClick = async (item: StoreItem) => {
    if (
      window.confirm(
        `Are you sure you want to delete the item "${item.name}"? This is only possible if it has not been purchased by any users.`
      )
    ) {
      const result = await handleDeleteStoreItem(item.id);
      showNotification(result.message, 4000);
      if (result.success && editingItem?.id === item.id) {
        resetItemForm();
      }
    }
  };

  const handleSimulateRenewal = async () => {
    if (!targetUser) return;
    const message = await handleTriggerWebhook(
      targetUser.id,
      "renew_subscription"
    );
    if (message) {
      await fetchAllUsers(); 
      showNotification(message, 4000);
    }
  };

  const handleDiscordAward = async () => {
    if (targetUser) {
      const result = await handleRecordAction(
        targetUser.id,
        discordAction as ActionType,
        "discord"
      );
      if (result) await fetchAllUsers(); 
      const actionText = discordAction.replace(/_/g, " ");
      showNotification(
        `🤖 Bot awarded ${result?.xpGained} XP to ${targetUser.username} in ${discordChannel} for: "${actionText}".`,
        4000
      );
    }
  };

  const handleAdminStatUpdate = async () => {
    if (!targetUser) return;
    const result = await adminUpdateUserStats(
      targetUser.id,
      editXp,
      editStreak,
      editFreezes
    );
    if (result.success) await fetchAllUsers(); 
    showNotification(result.message);
  };

  const handleAdminRoleUpdate = async () => {
    if (!targetUser) return;
    const result = await adminUpdateUserRole(targetUser.id, editRole);
    if (result.success) await fetchAllUsers(); 
    showNotification(result.message);
  };

  const handleAdminBan = async (durationHours: number | null) => {
    if (!targetUser) return;
    const durationText =
      durationHours === 0
        ? "unbanned"
        : durationHours
        ? `banned for ${durationHours}h`
        : "permanently banned";
    if (
      window.confirm(
        `Are you sure you want to have ${targetUser.username} ${durationText}?`
      )
    ) {
      const result = await adminBanUser(targetUser.id, durationHours);
      if (result.success) await fetchAllUsers(); 
      showNotification(result.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!targetUser) return;
    const email = await adminGetUserEmail(targetUser.id);
    if (email) {
      alert(
        `User's email: ${email}\n\nPlease instruct the user to visit the login page and use the "Forgot Password" feature. For security reasons, admins cannot set passwords directly.`
      );
    } else {
      showNotification(
        "Could not retrieve user's email. This may be a permissions issue.",
        4000
      );
    }
  };

  const handleViewLogs = async () => {
    if (!targetUser) return;
    const actions = await getAllUserActions(targetUser.id);
    setLogActions(actions);
    setIsLogModalOpen(true);
  };

const handleTierChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    // FIX: Updated to Capitalized types
    const newTier = e.target.value as 'Core' | 'Pro' | 'Elite';
    const success = await adminUpdateCommunityTier(newTier);
    showNotification(success ? `Community tier changed to ${newTier}. Refresh to see changes.` : `Failed to change tier.`);
  };

  const allBadgesForShowcase: Badge[] = Object.entries(badgesConfig).map(
    ([name, config], index) => ({
      id: `cfg_${index}`,
      communityId: community?.id ?? "",
      isActive: true,
      name,
      description: config.description,
      icon: config.icon,
      color: config.color,
    })
  );

  const isSelf = targetUser?.id === adminUser?.id;

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed top-20 right-8 bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg z-20 border border-slate-600">
          {notification}
        </div>
      )}
      {isLogModalOpen && targetUser && (
        <ActionLogModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          username={targetUser.username}
          actions={logActions}
        />
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button
          onClick={() => router.push("/connect/whop")}
          disabled={isWhopConnected}
          className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-colors ${
            isWhopConnected
              ? "bg-green-600 text-white cursor-default"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isWhopConnected ? "Whop Connected" : "Connect Whop Account"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Forms */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">
              Select User to Manage
            </h3>
            <select
              id="user-select"
              value={targetUserId || ""}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {allUsers.map((u: Profile) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          {targetUser && (
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4">
                Manage: {targetUser.username}
              </h3>
              <div className="space-y-4">
                {/* Edit Stats */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-300">Edit Stats</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-400">XP</label>
                      <input
                        type="number"
                        value={editXp}
                        onChange={(e) => setEditXp(parseInt(e.target.value))}
                        className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                        aria-label="XP"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Streak</label>
                      <input
                        type="number"
                        value={editStreak}
                        onChange={(e) => setEditStreak(parseInt(e.target.value))}
                        className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                        aria-label="Streak"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Freezes</label>
                      <input
                        type="number"
                        value={editFreezes}
                        onChange={(e) =>
                          setEditFreezes(parseInt(e.target.value))
                        }
                        className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                        aria-label="Streak Freezes"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAdminStatUpdate}
                    className="w-full text-sm bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update Stats
                  </button>
                </div>
                {/* Edit Role */}
                <div className="space-y-2 border-t border-slate-700 pt-4">
                  <h4 className="font-semibold text-slate-300">Change Role</h4>
                  <div className="flex gap-2">
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      disabled={isSelf}
                      className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 disabled:opacity-50"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={handleAdminRoleUpdate}
                      disabled={isSelf}
                      className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-600"
                    >
                      Set Role
                    </button>
                  </div>
                  {isSelf && (
                    <p className="text-xs text-slate-500 text-center">
                      You cannot change your own role.
                    </p>
                  )}
                </div>
                {/* Ban User */}
                <div className="space-y-2 border-t border-slate-700 pt-4">
                  <h4 className="font-semibold text-red-400">Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePasswordReset}
                      className="w-full text-sm bg-slate-600 hover:bg-slate-500 font-semibold py-2 rounded-lg"
                    >
                      Password Help
                    </button>
                    <button
                      onClick={handleViewLogs}
                      className="w-full text-sm bg-slate-600 hover:bg-slate-500 font-semibold py-2 rounded-lg"
                    >
                      View Logs
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {targetUser.bannedUntil &&
                    new Date(targetUser.bannedUntil) > new Date() ? (
                      <button
                        onClick={() => handleAdminBan(0)}
                        disabled={isSelf}
                        className="col-span-2 w-full text-sm bg-green-600 hover:bg-green-500 font-semibold py-2 rounded-lg disabled:bg-slate-600"
                      >
                        Unban User
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAdminBan(24)}
                          disabled={isSelf}
                          className="w-full text-sm bg-red-600 hover:bg-red-500 font-semibold py-2 rounded-lg disabled:bg-slate-600"
                        >
                          Ban 24h
                        </button>
                        <button
                          onClick={() => handleAdminBan(null)}
                          disabled={isSelf}
                          className="w-full text-sm bg-red-800 hover:bg-red-700 font-semibold py-2 rounded-lg disabled:bg-slate-600"
                        >
                          Perma-ban
                        </button>
                      </>
                    )}
                  </div>
                  {isSelf && (
                    <p className="text-xs text-slate-500 text-center">
                      You cannot ban yourself.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Manual Awards</h3>
            <div className="space-y-4">
              <div className="border-t border-slate-700 pt-4">
                <label
                  htmlFor="action-type"
                  className="block text-sm font-medium text-slate-400 mb-1"
                >
                  Action Type
                </label>
                <select
                  id="action-type"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                >
                  {Object.keys(rewardsConfig).map((key) => (
                    <option key={key} value={key}>
                      {key.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAwardXp}
                  disabled={!targetUser}
                  className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600"
                >
                  Award XP
                </button>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <label
                  htmlFor="badge-type"
                  className="block text-sm font-medium text-slate-400 mb-1"
                >
                  Badge
                </label>
                <select
                  id="badge-type"
                  value={badgeToAward}
                  onChange={(e) => setBadgeToAward(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                >
                  {Object.keys(badgesConfig).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAwardBadgeClick}
                  disabled={!targetUser}
                  className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600"
                >
                  Award Badge
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Data Display */}
        <div className="lg:col-span-2">
          <Leaderboard users={allUsers} currentUserId={targetUser?.id || ""} />
        </div>
      </div>

      {/* Manage Quests */}
      {isFeatureEnabled("quests") ? (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Manage Quests</h3>
          <form
            onSubmit={handleQuestSubmit}
            className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="Quest Title"
                required
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
              />
              <textarea
                value={questDescription}
                onChange={(e) => setQuestDescription(e.target.value)}
                placeholder="Quest Description"
                required
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 md:col-span-2"
                rows={2}
              />
              <input
                type="number"
                value={questXpReward}
                onChange={(e) => setQuestXpReward(parseInt(e.target.value))}
                placeholder="XP Reward"
                required
                min="0"
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
              />
              <select
                value={questBadgeReward || ""}
                onChange={(e) => setQuestBadgeReward(e.target.value || null)}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
              >
                <option value="">No Badge Reward</option>
                {Object.keys(badgesConfig).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-t border-slate-600 pt-4 space-y-3">
              <h4 className="font-semibold text-slate-300">Tasks</h4>
              {questTasks.map((task, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center bg-slate-800/50 p-3 rounded-md"
                >
                  <select
                    value={task.actionType}
                    onChange={(e) =>
                      handleUpdateTask(index, "actionType", e.target.value)
                    }
                    className="w-full bg-slate-700 border-slate-600 text-white rounded p-2 md:col-span-2"
                  >
                    {Object.keys(rewardsConfig).map((key) => (
                      <option key={key} value={key}>
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={task.targetCount}
                    onChange={(e) =>
                      handleUpdateTask(
                        index,
                        "targetCount",
                        parseInt(e.target.value)
                      )
                    }
                    min="1"
                    className="w-full bg-slate-700 border-slate-600 text-white rounded p-2 md:col-span-1"
                  />
                  <input
                    type="text"
                    value={task.description}
                    onChange={(e) =>
                      handleUpdateTask(index, "description", e.target.value)
                    }
                    placeholder="Task Description (e.g., 'Log 5 trades')"
                    required
                    className="w-full bg-slate-700 border-slate-600 text-white rounded p-2 md:col-span-4"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(index)}
                    disabled={questTasks.length <= 1}
                    className="text-red-500 hover:text-red-400 disabled:opacity-50 md:col-span-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddTask}
                className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md"
              >
                Add Task
              </button>
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-600">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                {editingQuest ? "Update Quest" : "Create Quest"}
              </button>
              {editingQuest && (
                <button
                  type="button"
                  onClick={resetQuestForm}
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {questsAdmin.map((quest: Quest) => (
              <div key={quest.id} className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{quest.title}</h4>
                    <p className="text-sm text-slate-400">{quest.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm font-semibold text-yellow-400">
                        <TrophyIcon className="w-4 h-4" /> {quest.xpReward} XP
                      </span>
                      {quest.badgeReward && (
                        <span className="text-xs font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                          {quest.badgeReward}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <label className="flex items-center cursor-pointer">
                      <span className="mr-2 text-sm text-slate-400">
                        {quest.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={quest.isActive}
                          onChange={() =>
                            handleToggleQuest(quest.id, !quest.isActive)
                          }
                          className="sr-only"
                        />
                        <div
                          className={`block w-10 h-6 rounded-full ${
                            quest.isActive ? "bg-green-500" : "bg-slate-600"
                          }`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                            quest.isActive ? "translate-x-4" : ""
                          }`}
                        ></div>
                      </div>
                    </label>
                    <button
                      onClick={() => handleEditQuestClick(quest)}
                      className="text-sm font-semibold text-slate-400 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestClick(quest)}
                      className="text-sm font-semibold text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-2xl z-10">
            <LockClosedIcon className="w-12 h-12 text-yellow-400 mb-4" />
            <p className="text-xl font-bold text-white">Manage Quests</p>
            <p className="text-sm text-slate-300">
              This feature is available on the{" "}
              <span className="font-bold">Pro</span> plan and above.
            </p>
            <Link
              href="/pricing"
              className="mt-4 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
          <h3 className="text-lg font-bold text-white mb-4 opacity-30">
            Manage Quests
          </h3>
          <div className="opacity-30 space-y-2">
            <div className="h-12 bg-slate-700/50 rounded-lg"></div>
            <div className="h-24 bg-slate-700/50 rounded-lg"></div>
          </div>
        </div>
      )}

      {/* Manage Store Items */}
      {isFeatureEnabled("store") ? (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">
            Manage Store Items
          </h3>
          <form
            onSubmit={handleItemSubmit}
            className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item Name"
                required
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
              />
              <input
                type="number"
                value={itemCost}
                onChange={(e) => setItemCost(parseInt(e.target.value))}
                placeholder="XP Cost"
                required
                min="0"
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
              />
              <textarea
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Item Description"
                required
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 md:col-span-2"
                rows={2}
              />
              <select
                value={itemIcon}
                onChange={(e) => setItemIcon(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
              >
                {iconMapKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as any)}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
              >
                <option value="INSTANT">Instant Use</option>
                <option value="TIMED_EFFECT">Timed Effect</option>
              </select>
              {itemType === "TIMED_EFFECT" && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={itemDuration || ""}
                      onChange={(e) =>
                        setItemDuration(parseInt(e.target.value))
                      }
                      placeholder="e.g., 48"
                      required
                      min="1"
                      className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      XP Modifier
                    </label>
                    <input
                      type="number"
                      value={itemModifier || ""}
                      onChange={(e) =>
                        setItemModifier(parseFloat(e.target.value))
                      }
                      placeholder="e.g., 2 for 2x"
                      required
                      min="1"
                      step="0.1"
                      className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-600">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                {editingItem ? "Update Item" : "Create Item"}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {storeItems.map((item: StoreItem) => (
              <div key={item.id} className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{item.name}</h4>
                    <p className="text-sm text-slate-400">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm font-semibold text-blue-400">
                        <TrophyIcon className="w-4 h-4" /> {item.cost} XP
                      </span>
                      <span className="text-xs font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                        {item.itemType === "TIMED_EFFECT"
                          ? `Timed (${item.durationHours}h, ${item.modifier}x)`
                          : "Instant"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <label className="flex items-center cursor-pointer">
                      <span className="mr-2 text-sm text-slate-400">
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={() =>
                            handleToggleStoreItemActive(item.id, !item.isActive)
                          }
                          className="sr-only"
                        />
                        <div
                          className={`block w-10 h-6 rounded-full ${
                            item.isActive ? "bg-green-500" : "bg-slate-600"
                          }`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                            item.isActive ? "translate-x-4" : ""
                          }`}
                        ></div>
                      </div>
                    </label>
                    <button
                      onClick={() => handleEditItemClick(item)}
                      className="text-sm font-semibold text-slate-400 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItemClick(item)}
                      className="text-sm font-semibold text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-2xl z-10">
            <LockClosedIcon className="w-12 h-12 text-yellow-400 mb-4" />
            <p className="text-xl font-bold text-white">Manage XP Store</p>
            <p className="text-sm text-slate-300">
              This feature is available on the{" "}
              <span className="font-bold">Elite</span> plan.
            </p>
            <Link
              href="/pricing"
              className="mt-4 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
          <h3 className="text-lg font-bold text-white mb-4 opacity-30">
            Manage Store Items
          </h3>
          <div className="opacity-30 space-y-2">
            <div className="h-12 bg-slate-700/50 rounded-lg"></div>
            <div className="h-24 bg-slate-700/50 rounded-lg"></div>
          </div>
        </div>
      )}

      {/* Manage Rewards */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Manage Rewards</h3>
        <form
          onSubmit={handleRewardSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-700/50 p-4 rounded-lg mb-4"
        >
          <div>
            <label
              htmlFor="new-action-name"
              className="block text-sm font-medium text-slate-400 mb-1"
            >
              Action Name
            </label>
            <input
              type="text"
              id="new-action-name"
              value={newActionName}
              onChange={(e) => setNewActionName(e.target.value)}
              placeholder="e.g. join_event"
              required
              className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 disabled:bg-slate-800 disabled:opacity-70"
              disabled={!!editRewardAction}
            />
          </div>
          <div>
            <label
              htmlFor="new-action-xp"
              className="block text-sm font-medium text-slate-400 mb-1"
            >
              XP Reward
            </label>
            <input
              type="number"
              id="new-action-xp"
              value={newActionXp}
              onChange={(e) => setNewActionXp(parseInt(e.target.value, 10))}
              min="1"
              required
              className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editRewardAction ? "Update Reward" : "Add Reward"}
            </button>
            {editRewardAction && (
              <button
                type="button"
                onClick={cancelEditReward}
                className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
          {Object.entries(rewardsConfig).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md"
            >
              <div>
                <span className="text-slate-300 font-mono">{key}</span>
                {/* FIX: Remove redundant 'as Reward' cast */}
                <span className="font-bold text-blue-400 ml-4">
                  {value.xpGained} XP
                </span>
              </div>
              <div className="flex gap-2">
                {/* FIX: Remove redundant 'as Reward' cast */}
                <button
                  onClick={() => handleEditRewardClick(key, value)}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRewardClick(key)}
                  className="text-xs font-semibold text-yellow-500 hover:text-yellow-400"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Badges */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Manage Badges</h3>
        <form
          onSubmit={handleAddOrEditBadge}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-slate-700/50 p-4 rounded-lg mb-6"
        >
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="new-badge-name"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                Badge Name
              </label>
              <input
                type="text"
                id="new-badge-name"
                value={newBadgeName}
                onChange={(e) => setNewBadgeName(e.target.value)}
                placeholder="e.g. Community Helper"
                required
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 disabled:bg-slate-800 disabled:opacity-70"
                disabled={!!editBadgeName}
              />
            </div>
            <div>
              <label
                htmlFor="new-badge-desc"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                Description
              </label>
              <input
                type="text"
                id="new-badge-desc"
                value={newBadgeDesc}
                onChange={(e) => setNewBadgeDesc(e.target.value)}
                placeholder="Rewarded for helping others"
                required
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="new-badge-icon"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                Icon
              </label>
              <select
                id="new-badge-icon"
                value={newBadgeIcon}
                onChange={(e) => setNewBadgeIcon(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 h-10"
              >
                {iconMapKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="new-badge-color"
                className="block text-sm font-medium text-slate-400 mb-1"
              >
                Color
              </label>
              <input
                id="new-badge-color"
                type="color"
                value={newBadgeColor}
                onChange={(e) => setNewBadgeColor(e.target.value)}
                className="w-full h-10 p-1 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editBadgeName ? "Update Badge" : "Add Badge"}
            </button>
            {editBadgeName && (
              <button
                type="button"
                onClick={cancelEditBadge}
                className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {allBadgesForShowcase.map((badge) => (
            <div key={badge.id} className="relative">
              <BadgeItem badge={badge} />
              <div className="mt-1 flex justify-center gap-2">
                <button
                  onClick={() =>
                    // FIX: Pass the 'name' property to create a valid BadgeConfig
                    handleEditBadgeClick(badge.name, {
                      name: badge.name,
                      description: badge.description,
                      icon: badge.icon,
                      color: badge.color,
                    })
                  }
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteBadgeClick(badge.name)}
                  className="text-xs font-semibold text-yellow-500 hover:text-yellow-400"
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testing Panel */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">
          Testing & Simulation
        </h3>
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <label
            htmlFor="tier-select"
            className="block text-sm font-medium text-slate-400 mb-1"
          >
            Simulate Subscription Tier
          </label>
<select
                id="tier-select"
                // Use 'tier' directly as it should match the capitalized type
                value={community?.tier?.toLowerCase() || "core"}
                onChange={handleTierChange}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
            >
                {/* FIX: Updated Values to Capitalized */}
                <option value="core">Core (Basic Features)</option>
                <option value="pro">Pro (Store, Analytics)</option>
                <option value="elite">Elite (All Features + Support)</option>
            </select>
          <p className="text-xs text-slate-500 mt-2">
            Changes the community tier to test feature-gating on all pages.
          </p>
        </div>
      </div>
    </div>
  );
}