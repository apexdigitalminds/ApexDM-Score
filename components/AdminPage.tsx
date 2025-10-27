import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import Leaderboard from './Leaderboard';
import BadgeItem from './BadgeItem';
import type { ActionType, Reward, BadgeConfig, Badge, Quest, QuestTask, StoreItem } from '../types';
import { iconMapKeys, LockClosedIcon, DiscordIcon, TrophyIcon, ShoppingCartIcon } from './icons';

const AdminPage: React.FC = () => {
  const { 
    allUsers, 
    rewardsConfig, 
    badgesConfig, 
    isWhopConnected, 
    community, 
    questsAdmin,
    storeItems,
    syncWhopMembers,
    handleRecordAction,
    handleAwardBadge,
    handleAddReward,
    handleUpdateReward,
    handleDeleteReward,
    handleAddBadge,
    handleUpdateBadge,
    handleDeleteBadge,
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
  } = useApp();
  const navigate = useNavigate();
  
  // Local state for the admin panel's user selection
  const [targetUserId, setTargetUserId] = useState<string | null>(allUsers.length > 0 ? allUsers[0].id : null);
  const targetUser = allUsers.find(u => u.id === targetUserId);

  useEffect(() => {
    if (!targetUserId && allUsers.length > 0) {
      setTargetUserId(allUsers[0].id);
    }
  }, [allUsers, targetUserId]);


  const [actionType, setActionType] = useState<ActionType>('watch_content');
  const [badgeToAward, setBadgeToAward] = useState<string>(Object.keys(badgesConfig)[0] || '');
  const [notification, setNotification] = useState('');

  // State for new/edit action form
  const [editRewardAction, setEditRewardAction] = useState<string | null>(null);
  const [newActionName, setNewActionName] = useState('');
  const [newActionXp, setNewActionXp] = useState(10);
  
  // State for new/edit badge form
  const [editBadgeName, setEditBadgeName] = useState<string | null>(null);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDesc, setNewBadgeDesc] = useState('');
  const [newBadgeIcon, setNewBadgeIcon] = useState(iconMapKeys[0]);
  const [newBadgeColor, setNewBadgeColor] = useState('#ffffff');

  // State for new/edit quest form
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [questTitle, setQuestTitle] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [questXpReward, setQuestXpReward] = useState(100);
  const [questBadgeReward, setQuestBadgeReward] = useState<string | null>(null);
  const [questTasks, setQuestTasks] = useState<QuestTask[]>([]);
  
  // State for new/edit store item form
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCost, setItemCost] = useState(500);
  const [itemIcon, setItemIcon] = useState('Snowflake');

  // State for Discord bot simulation
  const discordActions = ['ask_good_question', 'share_alpha'];
  const [discordAction, setDiscordAction] = useState(discordActions[0]);
  const [discordChannel, setDiscordChannel] = useState('#general');


  const showNotification = (message: string, duration: number = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(''), duration);
  };

  const handleAwardXp = async () => {
    if (targetUser) {
      const result = await handleRecordAction(targetUser.id, actionType, 'manual');
      showNotification(`Awarded ${result?.xpGained} XP for ${actionType.replace(/_/g, ' ')} to ${targetUser.username}.`);
    }
  };
  
  const handleAwardBadgeClick = async () => {
    if (targetUser && badgeToAward) {
      await handleAwardBadge(targetUser.id, badgeToAward);
      showNotification(`Awarded '${badgeToAward}' badge to ${targetUser.username}.`);
    }
  };

  const cancelEditReward = () => {
    setEditRewardAction(null);
    setNewActionName('');
    setNewActionXp(10);
  };

  const handleRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editRewardAction) {
      await handleUpdateReward(editRewardAction, newActionXp);
      showNotification(`Updated reward '${editRewardAction}'.`);
    } else {
      await handleAddReward(newActionName, newActionXp);
      showNotification(`Added new action: '${newActionName}'.`);
    }
    cancelEditReward();
  };

  const handleEditRewardClick = (actionType: string, reward: Reward) => {
    setEditRewardAction(actionType);
    setNewActionName(actionType);
    setNewActionXp(reward.xp);
  };

  const handleDeleteRewardClick = async (actionType: string) => {
    if (window.confirm(`Are you sure you want to delete the reward "${actionType}"? This cannot be undone.`)) {
        await handleDeleteReward(actionType);
        showNotification(`Deleted reward '${actionType}'.`);
    }
  };

  const cancelEditBadge = () => {
    setEditBadgeName(null);
    setNewBadgeName('');
    setNewBadgeDesc('');
    setNewBadgeIcon(iconMapKeys[0]);
    setNewBadgeColor('#ffffff');
  };

  const handleBadgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      description: newBadgeDesc,
      icon: newBadgeIcon,
      color: newBadgeColor,
    };
    if (editBadgeName) {
      await handleUpdateBadge(editBadgeName, config);
      showNotification(`Updated badge '${editBadgeName}'.`);
    } else {
      await handleAddBadge(newBadgeName, config);
      showNotification(`Added new badge: '${newBadgeName}'.`);
    }
    cancelEditBadge();
  };
  
  const handleEditBadgeClick = (badgeName: string, config: BadgeConfig) => {
    setEditBadgeName(badgeName);
    setNewBadgeName(badgeName);
    setNewBadgeDesc(config.description);
    setNewBadgeIcon(config.icon);
    setNewBadgeColor(config.color);
  };

  const handleDeleteBadgeClick = async (badgeName: string) => {
    if (window.confirm(`Are you sure you want to delete the badge "${badgeName}"? This will also remove it from all users who have earned it. This cannot be undone.`)) {
        await handleDeleteBadge(badgeName);
        showNotification(`Deleted badge '${badgeName}'.`);
    }
  };

  // Quest Form Logic
    const resetQuestForm = () => {
        setEditingQuest(null);
        setQuestTitle('');
        setQuestDescription('');
        setQuestXpReward(100);
        setQuestBadgeReward(null);
        setQuestTasks([{ actionType: Object.keys(rewardsConfig)[0] || '', targetCount: 1, description: '' }]);
    };

    useEffect(() => {
        // Initialize the first task when the component mounts and rewardsConfig is available
        if (Object.keys(rewardsConfig).length > 0 && questTasks.length === 0) {
            resetQuestForm();
        }
    }, [rewardsConfig]);


    const handleEditQuestClick = (quest: Quest) => {
        setEditingQuest(quest);
        setQuestTitle(quest.title);
        setQuestDescription(quest.description);
        setQuestXpReward(quest.xpReward);
        setQuestBadgeReward(quest.badgeReward);
        setQuestTasks(quest.tasks.map(t => ({...t}))); // Create a copy to avoid direct mutation
    };
    
    const handleUpdateTask = (index: number, field: keyof QuestTask, value: string | number) => {
        const newTasks = [...questTasks];
        (newTasks[index] as any)[field] = value;
        setQuestTasks(newTasks);
    };

    const handleAddTask = () => {
        setQuestTasks([...questTasks, { actionType: Object.keys(rewardsConfig)[0], targetCount: 1, description: '' }]);
    };
    
    const handleRemoveTask = (index: number) => {
        if (questTasks.length > 1) {
            setQuestTasks(questTasks.filter((_, i) => i !== index));
        }
    };
    
    const handleQuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const questData = { title: questTitle, description: questDescription, xpReward: questXpReward, badgeReward: questBadgeReward, tasks: questTasks, isActive: editingQuest?.isActive || false };
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
            showNotification('An error occurred. Please try again.');
        }
    };
    
    const handleDeleteQuestClick = async (quest: Quest) => {
        if (window.confirm(`Are you sure you want to delete the quest "${quest.title}"? This cannot be undone.`)) {
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
    
    // Store Item Form Logic
    const resetItemForm = () => {
        setEditingItem(null);
        setItemName('');
        setItemDescription('');
        setItemCost(500);
        setItemIcon('Snowflake');
    };

    const handleEditItemClick = (item: StoreItem) => {
        setEditingItem(item);
        setItemName(item.name);
        setItemDescription(item.description);
        setItemCost(item.cost);
        setItemIcon(item.icon);
    };

    const handleItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const itemData = { 
            name: itemName, 
            description: itemDescription, 
            cost: itemCost, 
            icon: itemIcon, 
            isActive: editingItem?.isActive ?? true
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
            showNotification('An error occurred saving the item.');
        }
    };

    const handleDeleteItemClick = async (item: StoreItem) => {
        if (window.confirm(`Are you sure you want to delete the item "${item.name}"? This cannot be undone.`)) {
            const success = await handleDeleteStoreItem(item.id);
            if (success) {
                showNotification(`Deleted item: ${item.name}`);
                if (editingItem?.id === item.id) {
                    resetItemForm();
                }
            } else {
                showNotification(`Failed to delete item.`);
            }
        }
    };

  const handleSync = async () => {
    const summary = await syncWhopMembers();
    showNotification(summary, 4000);
  };
  
  const handleSimulateRenewal = async (userId: string) => {
      const message = await handleTriggerWebhook(userId, 'renew_subscription');
      if (message) {
        showNotification(message, 4000);
      }
  };

  const handleDiscordAward = async () => {
    if (targetUser) {
      const result = await handleRecordAction(targetUser.id, discordAction, 'discord');
      const actionText = discordAction.replace(/_/g, ' ');
      showNotification(`🤖 Bot awarded ${result?.xpGained} XP to ${targetUser.username} in ${discordChannel} for: "${actionText}".`, 4000);
    }
  };

  const isDiscordEnabled = isFeatureEnabled('discordIntegration');
  const whopConnectedUsers = allUsers.filter(u => u.whop_user_id);
  
  // FIX: Removed unnecessary type cast. With the corrected `BadgeConfig` type, type inference works correctly.
  const allBadgesForShowcase: Badge[] = Object.entries(badgesConfig).map(([name, config], index) => ({
    id: `showcase_${index}`,
    name,
    ...config,
  }));

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed top-20 right-8 bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg z-20 border border-slate-600">
          {notification}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button 
          onClick={() => navigate('/connect/whop')}
          disabled={isWhopConnected}
          className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-colors ${
            isWhopConnected 
              ? 'bg-green-600 text-white cursor-default' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
            {isWhopConnected ? 'Whop Connected' : 'Connect Whop Account'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Forms */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
             <h3 className="text-lg font-bold text-white mb-4">Whop Integration</h3>
             <div className="space-y-4">
                {isWhopConnected && community ? (
                  <div className="bg-slate-700/50 p-4 rounded-lg flex items-center gap-4">
                    <img src={community.logoUrl} alt={community.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-white">{community.name}</p>
                      <p className="text-xs text-slate-400">Tier: <span className="capitalize font-semibold">{community.subscriptionTier}</span></p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                      Connect your Whop account to enable integration features.
                  </p>
                )}
                <button 
                    onClick={handleSync} 
                    disabled={!isWhopConnected} 
                    className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  Sync Whop Members
                </button>
             </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Webhook Simulator</h3>
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Simulate events coming from Whop to test automated rewards for synced members.
              </p>
              {isWhopConnected && whopConnectedUsers.length > 0 ? (
                whopConnectedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                    <span className="font-medium text-white">{user.username}</span>
                    <button
                      onClick={() => handleSimulateRenewal(user.id)}
                      className="bg-green-600 text-white text-sm font-semibold py-1 px-3 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Simulate Renewal
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">
                  {isWhopConnected ? 'No synced members to show.' : 'Connect to Whop to see members.'}
                </p>
              )}
            </div>
          </div>
           <div className={`bg-slate-800 p-6 rounded-2xl shadow-lg relative ${!isDiscordEnabled && 'opacity-60'}`}>
              {!isDiscordEnabled && (
                <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center rounded-2xl z-10 text-center p-4">
                  <LockClosedIcon className="w-10 h-10 text-yellow-400 mb-2" />
                  <p className="font-bold text-white">Feature Locked</p>
                  <p className="text-xs text-slate-300">Upgrade to the 'Silver' plan to enable Discord actions.</p>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <DiscordIcon className="w-7 h-7 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Discord Bot Simulation</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-slate-400">
                  Simulate a moderator rewarding a user for a valuable action in Discord.
                </p>
                <div>
                  <label htmlFor="discord-action" className="block text-sm font-medium text-slate-400 mb-1">Action</label>
                  <select id="discord-action" value={discordAction} onChange={e => setDiscordAction(e.target.value)} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2">
                    {discordActions.map(action => <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                   <label htmlFor="discord-channel" className="block text-sm font-medium text-slate-400 mb-1">Channel</label>
                  <input type="text" id="discord-channel" value={discordChannel} onChange={e => setDiscordChannel(e.target.value)} placeholder="#general" className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"/>
                </div>
                <button 
                  onClick={handleDiscordAward}
                  disabled={!targetUser || !isDiscordEnabled} 
                  className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  Award via Bot
                </button>
              </div>
            </div>
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Manual Awards</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="user-select" className="block text-sm font-medium text-slate-400 mb-1">Select User</label>
                <select
                  id="user-select"
                  value={targetUserId || ''}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
              <div className="border-t border-slate-700 pt-4">
                 <label htmlFor="action-type" className="block text-sm font-medium text-slate-400 mb-1">Action Type</label>
                 <select
                  id="action-type"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                >
                  {Object.keys(rewardsConfig).map(key => <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>)}
                </select>
                <button onClick={handleAwardXp} disabled={!targetUser} className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600">
                  Award XP
                </button>
              </div>
               <div className="border-t border-slate-700 pt-4">
                 <label htmlFor="badge-type" className="block text-sm font-medium text-slate-400 mb-1">Badge</label>
                 <select
                  id="badge-type"
                  value={badgeToAward}
                  onChange={(e) => setBadgeToAward(e.target.value)}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500 mb-2"
                >
                  {Object.keys(badgesConfig).map(key => <option key={key} value={key}>{key}</option>)}
                </select>
                <button onClick={handleAwardBadgeClick} disabled={!targetUser} className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600">
                  Award Badge
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Data Display */}
        <div className="lg:col-span-2">
          <Leaderboard users={allUsers} currentUserId={targetUser?.id || ''} />
        </div>
      </div>
      
       {/* Manage Quests */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Manage Quests</h3>
        <form onSubmit={handleQuestSubmit} className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={questTitle} onChange={e => setQuestTitle(e.target.value)} placeholder="Quest Title" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2" />
            <textarea value={questDescription} onChange={e => setQuestDescription(e.target.value)} placeholder="Quest Description" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 md:col-span-2" rows={2}/>
            <input type="number" value={questXpReward} onChange={e => setQuestXpReward(parseInt(e.target.value))} placeholder="XP Reward" required min="0" className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2" />
            <select value={questBadgeReward || ''} onChange={e => setQuestBadgeReward(e.target.value || null)} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2">
              <option value="">No Badge Reward</option>
              {Object.keys(badgesConfig).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="border-t border-slate-600 pt-4 space-y-3">
             <h4 className="font-semibold text-slate-300">Tasks</h4>
             {questTasks.map((task, index) => (
                 <div key={index} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center bg-slate-800/50 p-3 rounded-md">
                     <select value={task.actionType} onChange={e => handleUpdateTask(index, 'actionType', e.target.value)} className="w-full bg-slate-700 border-slate-600 text-white rounded p-2 md:col-span-2">
                         {Object.keys(rewardsConfig).map(key => <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>)}
                     </select>
                     <input type="number" value={task.targetCount} onChange={e => handleUpdateTask(index, 'targetCount', parseInt(e.target.value))} min="1" className="w-full bg-slate-700 border-slate-600 text-white rounded p-2 md:col-span-1" />
                     <input type="text" value={task.description} onChange={e => handleUpdateTask(index, 'description', e.target.value)} placeholder="Task Description (e.g., 'Log 5 trades')" required className="w-full bg-slate-700 border-slate-600 text-white rounded p-2 md:col-span-4" />
                     <button type="button" onClick={() => handleRemoveTask(index)} disabled={questTasks.length <= 1} className="text-red-500 hover:text-red-400 disabled:opacity-50 md:col-span-1">Remove</button>
                 </div>
             ))}
             <button type="button" onClick={handleAddTask} className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md">Add Task</button>
          </div>
           <div className="flex gap-2 pt-4 border-t border-slate-600">
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">
                    {editingQuest ? 'Update Quest' : 'Create Quest'}
                </button>
                {editingQuest && <button type="button" onClick={resetQuestForm} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg">Cancel Edit</button>}
            </div>
        </form>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
           {questsAdmin.map(quest => (
               <div key={quest.id} className="bg-slate-700/50 p-4 rounded-lg">
                   <div className="flex justify-between items-start">
                       <div>
                           <h4 className="font-bold text-white">{quest.title}</h4>
                           <p className="text-sm text-slate-400">{quest.description}</p>
                           <div className="flex items-center gap-4 mt-2">
                               <span className="flex items-center gap-1 text-sm font-semibold text-yellow-400"><TrophyIcon className="w-4 h-4"/> {quest.xpReward} XP</span>
                               {quest.badgeReward && <span className="text-xs font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{quest.badgeReward}</span>}
                           </div>
                       </div>
                       <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                          <label className="flex items-center cursor-pointer">
                              <span className="mr-2 text-sm text-slate-400">{quest.isActive ? 'Active' : 'Inactive'}</span>
                              <div className="relative">
                                  <input type="checkbox" checked={quest.isActive} onChange={() => handleToggleQuest(quest.id, !quest.isActive)} className="sr-only"/>
                                  <div className={`block w-10 h-6 rounded-full ${quest.isActive ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${quest.isActive ? 'translate-x-4' : ''}`}></div>
                              </div>
                          </label>
                           <button onClick={() => handleEditQuestClick(quest)} className="text-sm font-semibold text-slate-400 hover:text-white">Edit</button>
                           <button onClick={() => handleDeleteQuestClick(quest)} className="text-sm font-semibold text-red-500 hover:text-red-400">Delete</button>
                       </div>
                   </div>
               </div>
           ))}
        </div>
      </div>
      
       {/* Manage Store Items */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Manage Store Items</h3>
        <form onSubmit={handleItemSubmit} className="bg-slate-700/50 p-4 rounded-lg mb-6 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Item Name" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2" />
              <input type="number" value={itemCost} onChange={e => setItemCost(parseInt(e.target.value))} placeholder="XP Cost" required min="0" className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2" />
              <textarea value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="Item Description" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 md:col-span-2" rows={2}/>
              <select value={itemIcon} onChange={e => setItemIcon(e.target.value)} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 md:col-span-2">
                {iconMapKeys.map(key => <option key={key} value={key}>{key}</option>)}
              </select>
           </div>
           <div className="flex gap-2 pt-4 border-t border-slate-600">
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">
                    {editingItem ? 'Update Item' : 'Create Item'}
                </button>
                {editingItem && <button type="button" onClick={resetItemForm} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg">Cancel Edit</button>}
            </div>
        </form>
         <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
           {storeItems.map(item => (
               <div key={item.id} className="bg-slate-700/50 p-4 rounded-lg">
                   <div className="flex justify-between items-start">
                       <div>
                           <h4 className="font-bold text-white">{item.name}</h4>
                           <p className="text-sm text-slate-400">{item.description}</p>
                           <div className="flex items-center gap-4 mt-2">
                               <span className="flex items-center gap-1 text-sm font-semibold text-blue-400"><TrophyIcon className="w-4 h-4"/> {item.cost} XP</span>
                           </div>
                       </div>
                       <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                          <label className="flex items-center cursor-pointer">
                              <span className="mr-2 text-sm text-slate-400">{item.isActive ? 'Active' : 'Inactive'}</span>
                              <div className="relative">
                                  <input type="checkbox" checked={item.isActive} onChange={() => handleToggleStoreItemActive(item.id, !item.isActive)} className="sr-only"/>
                                  <div className={`block w-10 h-6 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${item.isActive ? 'translate-x-4' : ''}`}></div>
                              </div>
                          </label>
                           <button onClick={() => handleEditItemClick(item)} className="text-sm font-semibold text-slate-400 hover:text-white">Edit</button>
                           <button onClick={() => handleDeleteItemClick(item)} className="text-sm font-semibold text-red-500 hover:text-red-400">Delete</button>
                       </div>
                   </div>
               </div>
           ))}
        </div>
      </div>


      {/* Manage Rewards */}
       <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
         <h3 className="text-lg font-bold text-white mb-4">Manage Rewards</h3>
         <form onSubmit={handleRewardSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-700/50 p-4 rounded-lg mb-4">
            <div>
              <label htmlFor="new-action-name" className="block text-sm font-medium text-slate-400 mb-1">Action Name</label>
              <input type="text" id="new-action-name" value={newActionName} onChange={e => setNewActionName(e.target.value)} placeholder="e.g. join_event" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 disabled:bg-slate-800 disabled:opacity-70" disabled={!!editRewardAction}/>
            </div>
             <div>
              <label htmlFor="new-action-xp" className="block text-sm font-medium text-slate-400 mb-1">XP Reward</label>
              <input type="number" id="new-action-xp" value={newActionXp} onChange={e => setNewActionXp(parseInt(e.target.value, 10))} min="1" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"/>
            </div>
            <div className="flex gap-2">
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    {editRewardAction ? 'Update Reward' : 'Add Reward'}
                </button>
                {editRewardAction && <button type="button" onClick={cancelEditReward} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500">Cancel</button>}
            </div>
         </form>
         <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
            {Object.entries(rewardsConfig).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                    <div>
                        <span className="text-slate-300 font-mono">{key}</span>
                        <span className="font-bold text-blue-400 ml-4">{(value as Reward).xp} XP</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleEditRewardClick(key, value as Reward)} className="text-xs font-semibold text-slate-400 hover:text-white">Edit</button>
                        <button onClick={() => handleDeleteRewardClick(key)} className="text-xs font-semibold text-red-500 hover:text-red-400">Delete</button>
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      {/* Manage Badges */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Manage Badges</h3>
        <form onSubmit={handleBadgeSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-slate-700/50 p-4 rounded-lg mb-6">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-badge-name" className="block text-sm font-medium text-slate-400 mb-1">Badge Name</label>
                  <input type="text" id="new-badge-name" value={newBadgeName} onChange={e => setNewBadgeName(e.target.value)} placeholder="e.g. Community Helper" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 disabled:bg-slate-800 disabled:opacity-70" disabled={!!editBadgeName}/>
                </div>
                 <div>
                  <label htmlFor="new-badge-desc" className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <input type="text" id="new-badge-desc" value={newBadgeDesc} onChange={e => setNewBadgeDesc(e.target.value)} placeholder="Rewarded for helping others" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"/>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label htmlFor="new-badge-icon" className="block text-sm font-medium text-slate-400 mb-1">Icon</label>
                <select id="new-badge-icon" value={newBadgeIcon} onChange={e => setNewBadgeIcon(e.target.value)} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 h-10">
                    {iconMapKeys.map(key => <option key={key} value={key}>{key}</option>)}
                </select>
                </div>
                <div>
                <label htmlFor="new-badge-color" className="block text-sm font-medium text-slate-400 mb-1">Color</label>
                <input id="new-badge-color" type="color" value={newBadgeColor} onChange={(e) => setNewBadgeColor(e.target.value)} className="w-full h-10 p-1 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer"/>
                </div>
            </div>
            <div className="flex gap-2">
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    {editBadgeName ? 'Update Badge' : 'Add Badge'}
                </button>
                 {editBadgeName && <button type="button" onClick={cancelEditBadge} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500">Cancel</button>}
            </div>
        </form>
         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {allBadgesForShowcase.map((badge) => (
                <div key={badge.id} className="relative">
                    <BadgeItem badge={badge} />
                    <div className="mt-1 flex justify-center gap-2">
                        <button onClick={() => handleEditBadgeClick(badge.name, badge as BadgeConfig)} className="text-xs font-semibold text-slate-400 hover:text-white">Edit</button>
                        <button onClick={() => handleDeleteBadgeClick(badge.name)} className="text-xs font-semibold text-red-500 hover:text-red-400">Delete</button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h3>
        <p className="text-sm text-slate-400 mb-4">
            Reset all application data to its initial state, including users, actions, and rewards. This action cannot be undone.
        </p>
        <button 
            disabled
            className="w-full bg-red-600/50 text-white/50 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
        >
            Reset All Data
        </button>
        <p className="text-xs text-slate-500 mt-2 text-center">
            Data reset is disabled for live database integration. Please manage data directly in your Supabase dashboard.
        </p>
      </div>
    </div>
  );
};

export default AdminPage;