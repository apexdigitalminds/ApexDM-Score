// FIX: Use the '@/' path alias to point to the root types.ts file
import type { RewardsConfig, BadgeConfig } from '@/types';

// FIX: Matched this object to the 'RewardsConfig' type
export const initialRewardsConfig: RewardsConfig = {
  "watch_content": { "xpGained": 10 },
  "complete_module": { "xpGained": 25 },
  "log_trade": { "xpGained": 15 },
  "renew_subscription": { "xpGained": 50 },
  "ask_good_question": { "xpGained": 20 },
  "share_alpha": { "xpGained": 30 },
};

// FIX: Matched this object to the 'BadgeConfig' type
export const initialBadgesConfig: { [key: string]: BadgeConfig } = {
  "Analyst Bronze": { name: "Analyst Bronze", description: "Completed your first module.", icon: "ShieldCheck", color: '#cd7f32' },
  "Loyal Member": { name: "Loyal Member", description: "Renewed your subscription.", icon: "Crown", color: '#ffd700' },
  "Streak Starter": { name: "Streak Starter", description: "Maintained a 3-day streak.", icon: "MagnifyingGlass", color: '#c0c0c0' },
  "XP Novice": { name: "XP Novice", description: "Reached 100 XP.", icon: "Star", color: '#c0c0c0' },
  "XP Adept": { name: "XP Adept", description: "Reached 500 XP.", icon: "Gemstone", color: '#ffd700' },
  "XP Veteran": { name: "XP Veteran", description: "Reached 1000 XP.", icon: "Rocket", color: '#9333ea' },
  "XP Master": { name: "XP Master", description: "Reached 1500 XP.", icon: "Trophy", color: '#10b981' },
};