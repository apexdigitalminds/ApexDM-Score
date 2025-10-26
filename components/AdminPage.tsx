import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import Leaderboard from './Leaderboard';
import type { ActionType, Reward } from '../types';
import { iconMapKeys, LockClosedIcon, DiscordIcon } from './icons';

const AdminPage: React.FC = () => {
  const { 
    allUsers, 
    rewardsConfig, 
    badgesConfig, 
    isWhopConnected, 
    community, 
    syncWhopMembers,
    handleRecordAction,
    handleAwardBadge,
    handleAddReward,
    handleAddBadge,
    handleTriggerWebhook,
    isFeatureEnabled,
    resetAppData,
  } = useApp();
  const navigate = useNavigate();
  
  // Local state for the admin panel's user selection
  const [targetUserId, setTargetUserId] = useState<string | null>(allUsers.length > 0 ? allUsers[0].id : null);
  const targetUser = allUsers.find(u => u.id === targetUserId);

  useEffect(() => {
    // Ensure a user is always selected if the list is not empty
    if (!targetUserId && allUsers.length > 0) {
      setTargetUserId(allUsers[0].id);
    }
  }, [allUsers, targetUserId]);


  const [actionType, setActionType] = useState<ActionType>('watch_content');
  const [badgeToAward, setBadgeToAward] = useState<string>(Object.keys(badgesConfig)[0] || '');
  const [notification, setNotification] = useState('');

  // State for new action form
  const [newActionName, setNewActionName] = useState('');
  const [newActionXp, setNewActionXp] = useState(10);
  
  // State for new badge form
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDesc, setNewBadgeDesc] = useState('');
  const [newBadgeIcon, setNewBadgeIcon] = useState(iconMapKeys[0]);
  const [newBadgeColor, setNewBadgeColor] = useState('#ffffff');

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

  const handleAddNewAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newActionName && newActionXp > 0) {
      await handleAddReward(newActionName, newActionXp);
      showNotification(`Added new action: '${newActionName}'.`);
      setNewActionName('');
      setNewActionXp(10);
    }
  };

  const handleAddNewBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBadgeName && newBadgeDesc) {
      await handleAddBadge(newBadgeName, {
        description: newBadgeDesc,
        icon: newBadgeIcon,
        color: newBadgeColor,
      });
      showNotification(`Added new badge: '${newBadgeName}'.`);
      setNewBadgeName('');
      setNewBadgeDesc('');
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
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
             <h3 className="text-lg font-bold text-white mb-4">Add New Rewards Action</h3>
             <form onSubmit={handleAddNewAction} className="space-y-4">
                <div>
                  <label htmlFor="new-action-name" className="block text-sm font-medium text-slate-400 mb-1">Action Name</label>
                  <input type="text" id="new-action-name" value={newActionName} onChange={e => setNewActionName(e.target.value)} placeholder="e.g. Join Event" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"/>
                </div>
                 <div>
                  <label htmlFor="new-action-xp" className="block text-sm font-medium text-slate-400 mb-1">XP Reward</label>
                  <input type="number" id="new-action-xp" value={newActionXp} onChange={e => setNewActionXp(parseInt(e.target.value, 10))} min="1" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"/>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Add Action</button>
             </form>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
             <h3 className="text-lg font-bold text-white mb-4">Add New Badge</h3>
             <form onSubmit={handleAddNewBadge} className="space-y-4">
                 <div>
                  <label htmlFor="new-badge-name" className="block text-sm font-medium text-slate-400 mb-1">Badge Name</label>
                  <input type="text" id="new-badge-name" value={newBadgeName} onChange={e => setNewBadgeName(e.target.value)} placeholder="e.g. Community Helper" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"/>
                </div>
                 <div>
                  <label htmlFor="new-badge-desc" className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <input type="text" id="new-badge-desc" value={newBadgeDesc} onChange={e => setNewBadgeDesc(e.target.value)} placeholder="Rewarded for helping others" required className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2"/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label htmlFor="new-badge-icon" className="block text-sm font-medium text-slate-400 mb-1">Icon</label>
                    <select id="new-badge-icon" value={newBadgeIcon} onChange={e => setNewBadgeIcon(e.target.value)} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-2">
                        {iconMapKeys.map(key => <option key={key} value={key}>{key}</option>)}
                    </select>
                   </div>
                   <div>
                    <label htmlFor="new-badge-color" className="block text-sm font-medium text-slate-400 mb-1">Color</label>
                    <input
                        id="new-badge-color"
                        type="color"
                        value={newBadgeColor}
                        onChange={(e) => setNewBadgeColor(e.target.value)}
                        className="w-full h-10 p-1 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer"
                    />
                   </div>
                 </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Add Badge</button>
             </form>
          </div>
        </div>

        {/* Right Column: Data Display */}
        <div className="lg:col-span-2">
          <Leaderboard users={allUsers} currentUserId={targetUser?.id || ''} />
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Reward Configuration</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(rewardsConfig).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                    <span className="text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-blue-400">{(value as Reward).xp} XP</span>
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