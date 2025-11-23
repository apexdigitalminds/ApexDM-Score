// FIX: Use the '@/' path alias to point to the root types.ts file
import type { RewardsConfig, BadgeConfig } from '@/types';

// FIX: Matched this object to the updated 'RewardsConfig' type
// Added 'isActive' and 'isArchived' to every entry to satisfy strict typing
export const initialRewardsConfig: RewardsConfig = {
  "watch_content": { 
      xpGained: 10,
      isActive: true,
      isArchived: false 
  },
  "complete_module": { 
      xpGained: 25,
      isActive: true,
      isArchived: false 
  },
  "log_trade": { 
      xpGained: 15,
      isActive: true,
      isArchived: false 
  },
  "renew_subscription": { 
      xpGained: 50,
      isActive: true,
      isArchived: false 
  },
  "ask_good_question": { 
      xpGained: 20,
      isActive: true,
      isArchived: false 
  },
  "share_alpha": { 
      xpGained: 30,
      isActive: true,
      isArchived: false 
  },
  // Added default actions to prevent "key not found" errors
  "daily_login": { xpGained: 5, isActive: true, isArchived: false },
  "post_comment": { xpGained: 5, isActive: true, isArchived: false },
  "attend_call": { xpGained: 20, isActive: true, isArchived: false },
  "referral": { xpGained: 50, isActive: true, isArchived: false },
  "feedback": { xpGained: 15, isActive: true, isArchived: false },
  "login": { xpGained: 5, isActive: true, isArchived: false },
  "purchase": { xpGained: 0, isActive: true, isArchived: false },
  "quest_complete": { xpGained: 0, isActive: true, isArchived: false },
  "daily_checkin": { xpGained: 5, isActive: true, isArchived: false },
  "invite_friend": { xpGained: 50, isActive: true, isArchived: false },
  "post_message": { xpGained: 2, isActive: true, isArchived: false },
  "react_to_post": { xpGained: 1, isActive: true, isArchived: false },
  "other": { xpGained: 0, isActive: true, isArchived: false }
};

// FIX: Matched this object to the 'BadgeConfig' type
export const initialBadgesConfig: { [key: string]: BadgeConfig } = {
  "Analyst Bronze": { 
      name: "Analyst Bronze", 
      description: "Completed your first module.", 
      icon: "ShieldCheck", 
      color: '#cd7f32',
      isActive: true,
      isArchived: false
  },
  "Loyal Member": { 
      name: "Loyal Member", 
      description: "Renewed your subscription.", 
      icon: "Crown", 
      color: '#ffd700',
      isActive: true,
      isArchived: false
  },
  "Streak Starter": { 
      name: "Streak Starter", 
      description: "Maintained a 3-day streak.", 
      icon: "MagnifyingGlass", 
      color: '#c0c0c0',
      isActive: true,
      isArchived: false
  },
  "XP Novice": { 
      name: "XP Novice", 
      description: "Reached 100 XP.", 
      icon: "Star", 
      color: '#c0c0c0',
      isActive: true,
      isArchived: false
  },
  "XP Adept": { 
      name: "XP Adept", 
      description: "Reached 500 XP.", 
      icon: "Gemstone", 
      color: '#ffd700',
      isActive: true,
      isArchived: false
  },
  "XP Veteran": { 
      name: "XP Veteran", 
      description: "Reached 1000 XP.", 
      icon: "Rocket", 
      color: '#9333ea',
      isActive: true,
      isArchived: false
  },
  "XP Master": { 
      name: "XP Master", 
      description: "Reached 1500 XP.", 
      icon: "Trophy", 
      color: '#10b981',
      isActive: true,
      isArchived: false
  },
};