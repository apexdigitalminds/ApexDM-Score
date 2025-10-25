import React, { useState } from 'react';
import { useApp } from '../App';
import { recordAction } from '../services/xpService';
import Leaderboard from './Leaderboard';
// FIX: Imported Reward type to allow for safe casting.
import type { ActionType, User, Reward } from '../types';
import { iconMapKeys } from './icons';

const AdminPage: React.FC = () => {
  const { db, allUsers, selectedUser, setSelectedUserId, rewardsConfig, badgesConfig, addReward, addBadge, isWhopConnected, community, connectWhop, syncWhopMembers } = useApp();
  const [actionType, setActionType] = useState<ActionType>('watch_content');
  const [badgeToAward, setBadgeToAward] = useState<string>(Object.keys(badgesConfig)[0]);
  const [notification, setNotification] = useState('');

  // State for new action form
  const [newActionName, setNewActionName] = useState('');
  const [newActionXp, setNewActionXp] = useState(10);
  
  // State for new badge form
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDesc, setNewBadgeDesc] = useState('');
  const [newBadgeIcon, setNewBadgeIcon] = useState(iconMapKeys[0]);
  const [newBadgeColor, setNewBadgeColor] = useState('#ffffff');


  const handleAwardXp = () => {
    if (selectedUser) {
      const result = recordAction(db, selectedUser.id, actionType, rewardsConfig, badgesConfig, 'manual');
      setNotification(`Awarded ${result?.xpGained} XP for ${actionType.replace('_', ' ')} to ${selectedUser.username}.`);
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  const handleAwardBadge = () => {
    if (selectedUser && badgeToAward) {
      const badgeInfo = badgesConfig[badgeToAward];
      db.users.addBadge(selectedUser.id, { name: badgeToAward, ...badgeInfo });
      setNotification(`Awarded '${badgeToAward}' badge to ${selectedUser.username}.`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleAddNewAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActionName && newActionXp > 0) {
      addReward(newActionName, newActionXp);
      setNewActionName('');
      setNewActionXp(10);
      setNotification(`Added new action: '${newActionName}'.`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleAddNewBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBadgeName && newBadgeDesc) {
      addBadge(newBadgeName, {
        description: newBadgeDesc,
        icon: newBadgeIcon,
        color: newBadgeColor,
      });
      setNewBadgeName('');
      setNewBadgeDesc('');
      setNotification(`Added new badge: '${newBadgeName}'.`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleSync = async () => {
    const summary = await syncWhopMembers();
    setNotification(summary);
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed top-20 right-8 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse z-20">
          {notification}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button 
          onClick={connectWhop}
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
                      <p className="text-xs text-slate-400 font-mono">ID: {community.whop_store_id}</p>
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
            <h3 className="text-lg font-bold text-white mb-4">Manual Awards</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="user-select" className="block text-sm font-medium text-slate-400 mb-1">Select User</label>
                <select
                  id="user-select"
                  value={selectedUser?.id || ''}
                  onChange={(e) => setSelectedUserId(e.target.value)}
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
                <button onClick={handleAwardXp} disabled={!selectedUser} className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600">
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
                <button onClick={handleAwardBadge} disabled={!selectedUser} className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600">
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
          <Leaderboard users={allUsers} currentUserId={selectedUser?.id || ''} />
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Reward Configuration</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(rewardsConfig).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                    <span className="text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                    {/* FIX: Cast value to Reward to fix unknown type error */}
                    <span className="font-bold text-blue-400">{(value as Reward).xp} XP</span>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default AdminPage;