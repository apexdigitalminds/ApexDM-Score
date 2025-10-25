import type { RewardsConfig, BadgeConfig } from '../types';

export const initialRewardsConfig: RewardsConfig = {
  "watch_content": { "xp": 10, "badge": null },
  "complete_module": { "xp": 25, "badge": "Analyst Bronze" },
  "log_trade": { "xp": 15, "badge": null },
  "renew_subscription": { "xp": 50, "badge": "Loyal Member" },
  "ask_good_question": { "xp": 20, "badge": null },
  "share_alpha": { "xp": 30, "badge": null },
};

export const initialBadgesConfig: { [key: string]: BadgeConfig } = {
  "Analyst Bronze": { description: "Completed your first module.", icon: "ShieldCheck", color: '#cd7f32' },
  "Loyal Member": { description: "Renewed your subscription.", icon: "Crown", color: '#ffd700' },
  "Streak Starter": { description: "Maintained a 3-day streak.", icon: "MagnifyingGlass", color: '#c0c0c0' },
  "XP Novice": { description: "Reached 100 XP.", icon: "Star", color: '#c0c0c0' },
  "XP Adept": { description: "Reached 500 XP.", icon: "Gemstone", color: '#ffd700' },
  "XP Veteran": { description: "Reached 1000 XP.", icon: "Rocket", color: '#9333ea' },
  "XP Master": { description: "Reached 1500 XP.", icon: "Trophy", color: '#10b981' },
};