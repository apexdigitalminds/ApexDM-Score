import { useState, useCallback, useEffect } from 'react';
import type { User, Action, Badge } from '../types';
import { initialBadgesConfig } from '../config/rewards';

const initialUsers: User[] = [
  { id: 'user_1', username: 'Alex', avatarUrl: 'https://picsum.photos/seed/alex/100', xp: 480, streak: 5, lastActionDate: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), badges: [{id: 'b1', name: 'Analyst Bronze', ...initialBadgesConfig['Analyst Bronze']}, {id: 'b3', name: 'Streak Starter', ...initialBadgesConfig['Streak Starter']}], whop_user_id: 'whop_alex_123' },
  { id: 'user_2', username: 'Ben', avatarUrl: 'https://picsum.photos/seed/ben/100', xp: 1250, streak: 12, lastActionDate: new Date().toISOString(), badges: [
      {id: 'b4', name: 'XP Novice', ...initialBadgesConfig['XP Novice']},
      {id: 'b5', name: 'XP Adept', ...initialBadgesConfig['XP Adept']},
      {id: 'b6', name: 'XP Veteran', ...initialBadgesConfig['XP Veteran']},
  ], whop_user_id: 'whop_ben_456' },
  { id: 'user_3', username: 'Carla', avatarUrl: 'https://picsum.photos/seed/carla/100', xp: 950, streak: 2, lastActionDate: new Date(Date.now() - 40 * 3600 * 1000).toISOString(), badges: [] },
  { id: 'user_4', username: 'Diana', avatarUrl: 'https://picsum.photos/seed/diana/100', xp: 720, streak: 0, lastActionDate: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), badges: [] },
  { id: 'user_5', username: 'Ethan', avatarUrl: 'https://picsum.photos/seed/ethan/100', xp: 680, streak: 1, lastActionDate: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), badges: [] },
  { id: 'user_6', username: 'Fiona', avatarUrl: 'https://picsum.photos/seed/fiona/100', xp: 450, streak: 4, lastActionDate: new Date().toISOString(), badges: [] },
  { id: 'user_7', username: 'George', avatarUrl: 'https://picsum.photos/seed/george/100', xp: 320, streak: 3, lastActionDate: new Date().toISOString(), badges: [] },
  { id: 'user_8', username: 'Hannah', avatarUrl: 'https://picsum.photos/seed/hannah/100', xp: 210, streak: 0, lastActionDate: null, badges: [] },
  { id: 'user_9', username: 'Ian', avatarUrl: 'https://picsum.photos/seed/ian/100', xp: 150, streak: 1, lastActionDate: new Date().toISOString(), badges: [] },
  { id: 'user_10', username: 'Jane', avatarUrl: 'https://picsum.photos/seed/jane/100', xp: 80, streak: 1, lastActionDate: new Date().toISOString(), badges: [] },
  { id: 'user_11', username: 'Kevin', avatarUrl: 'https://picsum.photos/seed/kevin/100', xp: 50, streak: 0, lastActionDate: null, badges: [] },
];

const initialActions: Action[] = [
    { id: 'action_1', userId: 'user_1', actionType: 'complete_module', xpGained: 25, timestamp: new Date().toISOString(), source: 'manual' },
    { id: 'action_2', userId: 'user_1', actionType: 'log_trade', xpGained: 15, timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), source: 'manual' },
];

let nextUserId = 12;
let nextActionId = 3;

// This object acts as a singleton in-memory database.
const mockDatabase = {
    users: initialUsers,
    actions: initialActions,
};

const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
    listeners.forEach(l => l());
};

const useMockData = () => {
    const [_, setTick] = useState(0);

    const forceUpdate = useCallback(() => {
        setTick(t => t + 1);
    }, []);

    useEffect(() => {
        listeners.add(forceUpdate);
        return () => {
            listeners.delete(forceUpdate);
        };
    }, [forceUpdate]);

    const mockDb = {
        users: {
            getAll: () => [...mockDatabase.users].sort((a, b) => b.xp - a.xp),
            getById: (id: string) => mockDatabase.users.find(u => u.id === id) || null,
            findByWhopId: (whopUserId: string) => mockDatabase.users.find(u => u.whop_user_id === whopUserId) || null,
            update: (id: string, updates: Partial<User>) => {
                mockDatabase.users = mockDatabase.users.map(u => 
                    u.id === id ? { ...u, ...updates } : u
                );
                notifyListeners();
            },
            addBadge: (id: string, badge: Omit<Badge, 'id'>) => {
                 const user = mockDatabase.users.find(u => u.id === id);
                 if (user && !user.badges.some(b => b.name === badge.name)) {
                    const newBadge = { ...badge, id: `badge_${Date.now()}` };
                     mockDatabase.users = mockDatabase.users.map(u => 
                        u.id === id ? { ...u, badges: [...u.badges, newBadge] } : u
                    );
                    notifyListeners();
                 }
            },
            create: (username: string, whop_user_id?: string) => {
                const newUser: User = {
                    id: `user_${nextUserId++}`,
                    username,
                    avatarUrl: `https://picsum.photos/seed/${username}/100`,
                    xp: 0,
                    streak: 0,
                    lastActionDate: null,
                    badges: [],
                    whop_user_id,
                };
                mockDatabase.users = [...mockDatabase.users, newUser];
                notifyListeners();
                return newUser;
            }
        },
        actions: {
            getAllForUser: (userId: string) => mockDatabase.actions.filter(a => a.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
            create: (actionData: Omit<Action, 'id' | 'timestamp'>) => {
                const newAction: Action = {
                    ...actionData,
                    id: `action_${nextActionId++}`,
                    timestamp: new Date().toISOString(),
                };
                mockDatabase.actions = [newAction, ...mockDatabase.actions];
                notifyListeners();
            }
        }
    };

    return mockDb;
};

export default useMockData;