export interface Level {
  level: number;
  minXp: number;
  nextLevelXp: number;
  name: string;
}

export const levelConfig: Level[] = [
  { level: 1, minXp: 0, nextLevelXp: 100, name: 'Beginner' },
  { level: 2, minXp: 100, nextLevelXp: 500, name: 'Novice' },
  { level: 3, minXp: 500, nextLevelXp: 1000, name: 'Adept' },
  { level: 4, minXp: 1000, nextLevelXp: 1500, name: 'Veteran' },
  { level: 5, minXp: 1500, nextLevelXp: Infinity, name: 'Master' },
];

export const getLevelDetails = (xp: number): Level => {
    // Find the current level by looking from the highest level down
    const currentLevelInfo = [...levelConfig].reverse().find(l => xp >= l.minXp);
    
    // Fallback to level 1 if something goes wrong (e.g., negative XP, though unlikely)
    return currentLevelInfo || levelConfig[0];
}