import React from 'react';
import MdiIcon from './MdiIcon';

interface IconProps {
  className?: string;
  fill?: string;
  // FIX: Add style prop to allow passing CSS styles to icons.
  style?: React.CSSProperties;
}

// --- How to add a new Material Design Icon ---
// 1. Go to a library site like https://pictogrammers.com/library/mdi/
// 2. Find the icon you want to use.
// 3. Click on the icon to open its details.
// 4. In the "Path (for developers)" section, click to copy the SVG path data (e.g., "M12,2L2,8.5...").
// 5. Create a new constant for the path and a new component like the examples below.
//    const mdiNewIconPath = "PASTE_THE_PATH_HERE";
//    export const NewIcon: React.FC<IconProps> = ({ className, style }) => (
//        <MdiIcon path={mdiNewIconPath} className={className} style={style} />
//    );
// 6. (Optional) If the icon will be used in the `iconMap` for dynamic rendering, add it there.
// -------------------------------------------

export const WhopIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.28 14.72L6.34 12.34a.5.5 0 0 1 .71-.71l4.17 4.17 6.17-6.17a.5.5 0 0 1 .71.71l-6.53 6.53a.5.5 0 0 1-.71 0z" />
  </svg>
);

const mdiStarShootingPath = "M18.09 11.77L19.56 18.1L14 14.74L8.44 18.1L9.9 11.77L5 7.5L11.47 6.96L14 1L16.53 6.96L23 7.5L18.09 11.77M2 12.43C2.19 12.43 2.38 12.37 2.55 12.26L5.75 10.15L4.18 8.79L1.45 10.59C.989 10.89 .861 11.5 1.16 12C1.36 12.27 1.68 12.43 2 12.43M1.16 21.55C1.36 21.84 1.68 22 2 22C2.19 22 2.38 21.95 2.55 21.84L6.66 19.13L7 17.76L7.31 16.31L1.45 20.16C.989 20.47 .861 21.09 1.16 21.55M1.45 15.38C.989 15.68 .861 16.3 1.16 16.76C1.36 17.06 1.68 17.21 2 17.21C2.19 17.21 2.38 17.16 2.55 17.05L7.97 13.5L8.24 12.31L7.32 11.5L1.45 15.38Z";

export const CometIcon: React.FC<IconProps> = ({ className, fill = 'currentColor', style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    style={style}
    fill={fill}
  >
    <defs>
      <linearGradient id="legendary-streak-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#facc15" />
      </linearGradient>
      <linearGradient id="epic-streak-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="rising-streak-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <path d={mdiStarShootingPath} />
  </svg>
);
export const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
// This is the OLD CometIcon, now for badges.
export const ShootingStarIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg
    version="1.0"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 300 219"
    preserveAspectRatio="xMidYMid meet"
    className={className}
    style={style}
  >
    <g
      transform="translate(0, 219) scale(0.1, -0.1)"
      fill="currentColor"
      stroke="none"
    >
      <path d="M1345 1968 c-21 -19 -30 -44 -50 -143 -14 -66 -27 -130 -30 -141 -3 -16 -33 -33 -116 -70 -120 -53 -149 -78 -149 -131 0 -46 22 -66 159 -142 l114 -64 -7 -128 c-9 -164 6 -198 87 -199 38 0 49 8 234 173 21 18 23 18 149 -7 159 -33 175 -32 208 0 43 44 36 77 -44 199 l-71 106 71 123 c86 152 92 199 28 232 -26 14 -46 14 -156 4 l-126 -12 -36 39 c-174 191 -164 183 -203 183 -23 0 -45 -8 -62 -22z" />
      <path d="M695 1501 c-201 -97 -401 -248 -511 -385 -102 -128 -114 -168 -65 -217 22 -21 39 -29 66 -29 41 0 56 13 129 114 86 120 256 249 461 352 61 30 116 63 123 72 22 29 15 90 -14 117 -39 36 -75 31 -189 -24z" />
      <path d="M972 1243 c-179 -106 -442 -341 -579 -515 -147 -186 -298 -462 -298 -545 0 -51 25 -81 77 -89 48 -8 86 29 123 121 118 297 409 633 736 850 53 36 99 72 103 81 21 55 -13 119 -69 129 -23 5 -45 -3 -93 -32z" />
      <path d="M1095 942 c-50 -31 -262 -277 -367 -427 -136 -193 -157 -256 -100 -306 62 -55 103 -35 172 82 71 120 186 270 319 417 101 112 111 127 111 162 0 30 -6 43 -31 64 -36 31 -63 33 -104 8z" />
    </g>
  </svg>
);

export const MagnifyingGlassIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
  </svg>
);


export const ShieldCheckIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10,17L6,13L7.41,11.58L10,14.17L16.59,7.58L18,9M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z" />
  </svg>
);

export const CrownIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5,16L3,5L8.5,12L12,5L15.5,12L21,5L19,16H5M19,19a2,2 0 0 1-2,2H7a2,2 0 0 1-2-2V18H19V19Z" />
  </svg>
);


export const StarIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
  </svg>
);

const mdiChartBarPath = "M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z";
export const ChartBarIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiChartBarPath} className={className} style={style} />
);

const mdiAccountGroupPath = "M16 17V19H2V17S2 13 9 13 16 17 16 17M12.5 7.5A3.5 3.5 0 1 0 9 11A3.5 3.5 0 0 0 12.5 7.5M15.94 13A5.32 5.32 0 0 1 18 17V19H22V17S22 13.37 18.5 13.07C17.5 13 16.56 13 15.94 13M15 4A3.39 3.39 0 0 0 13.07 4.59A5 5 0 0 1 13.07 10.41A3.39 3.39 0 0 0 15 11A3.5 3.5 0 0 0 15 4Z";
export const UserGroupIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiAccountGroupPath} className={className} style={style} />
);

const mdiAccountPath = "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z";
export const AccountIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiAccountPath} className={className} style={style} />
);

export const ArrowTrendingUpIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

const mdiTrendingDownPath = "M16,18L18.29,15.71L13.41,10.83L9.41,14.83L2,7.41L3.41,6L9.41,12L13.41,8L20.71,15.29L23,13V18H16Z";
export const TrendingDownIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiTrendingDownPath} className={className} style={style} />
);

const mdiAccountPlusPath = "M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,13V10H3V13H0V15H3V18H5V15H8V13H5Z";
export const UserPlusIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiAccountPlusPath} className={className} style={style} />
);

export const LogoIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
    style={style}
  >
    <defs>
      <linearGradient
        id="logo-gradient"
        x1="12"
        y1="3"
        x2="12"
        y2="21"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#A78BFA" />
      </linearGradient>
    </defs>
    <path
      d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
      stroke="url(#logo-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 16V8M12 8L9 11M12 8L15 11"
      stroke="url(#logo-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.87 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.13 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const GemstoneIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,2L2,8.5L12,22L22,8.5L12,2M12,4.4L18.9,8.5L12,12.6L5.1,8.5L12,4.4M4,10.1L12,15.1L20,10.1L12,19.6L4,10.1Z" />
  </svg>
);

export const RocketIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3" />
    <path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3" />
    <circle cx="15" cy="9" r="1" />
  </svg>
);

const mdiSparklesPath = "M19,1L17.74,3.75L15,5L17.74,6.26L19,9L20.25,6.26L23,5L20.25,3.75M9,4L6.5,9.5L1,12L6.5,14.5L9,20L11.5,14.5L17,12L11.5,9.5M19,15L17.74,17.74L15,19L17.74,20.25L19,23L20.25,20.25L23,19L20.25,17.74";
export const SparklesIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiSparklesPath} className={className} style={style} />
);

const mdiMedalPath = "M20,2H4V4L9.81,8.36C6.14,9.57 4.14,13.53 5.35,17.2C6.56,20.87 10.5,22.87 14.19,21.66C17.86,20.45 19.86,16.5 18.65,12.82C17.95,10.71 16.3,9.05 14.19,8.36L20,4V2M14.94,19.5L12,17.78L9.06,19.5L9.84,16.17L7.25,13.93L10.66,13.64L12,10.5L13.34,13.64L16.75,13.93L14.16,16.17L14.94,19.5Z";
export const MedalIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiMedalPath} className={className} style={style} />
);

const mdiStarTrophyPath = "M15.2 10.7L16.6 16L12 12.2L7.4 16L8.8 10.8L4.6 7.3L10 7L12 2L14 7L19.4 7.3L15.2 10.7M14 19H13V16L12 15L11 16V19H10C8.9 19 8 19.9 8 21V22H16V21C16 19.9 15.11 19 14 19Z";
export const StarTrophyIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiStarTrophyPath} className={className} style={style} />
);

export const FireIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z" />
  </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13,12H20C20,15.14 17.7,17.93 14.7,18.71L13.29,17.29C15.17,16.24 16.5,14.25 16.92,12H13V10H18C17.45,7.82 15.77,6.1 13.58,5.43L15,4C18.62,5.53 21.14,8.84 21.8,13C20.8,13 20,13.2 20,12A2,2 0 0,1 22,10A2,2 0 0,1 20,8V7C21.1,7 22,6.1 22,5V3C22,1.9 21.1,1 20,1H4A2,2 0 0,0 2,3V19A2,2 0 0,0 4,21H12.26C12.07,20.35 12,19.68 12,19C12,15.69 14.69,13 18,13C18.68,13 19.35,13.07 20,13.26V3H11V10H4V12H11V14H4V19H11.26C10.15,17.47 9.53,15.57 9.5,13.5C9.5,13.33 9.5,13.17 9.5,13H4V10H9V5H4V3H9V10H11V3Z" />
  </svg>
);

const mdiLockPath = "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z";
export const LockClosedIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiLockPath} className={className} style={style} />
);

export const DiscordIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.3,3.5C18.8,3 17.2,3 15.8,3.2C15.2,3.3 14.7,3.9 14.8,4.4C15.4,6.9 15.8,9.4 15.8,11.9C15.8,12.1 15.8,12.3 15.8,12.5C15.3,12.4 14.8,12.2 14.3,12C12.8,11.5 11.4,10.9 10.2,10.2C9.8,9.9 9.3,10 9.1,10.4C8.2,12.3 7.8,14.3 7.8,16.4C7.8,18 8.4,19.5 9.4,20.7C9.7,21 10.2,21 10.5,20.7C12.2,19.5 13.6,18.1 14.9,16.4C15.2,16.1 15.1,15.6 14.7,15.4C14.3,15.2 13.8,15 13.4,14.8C13.5,14.8 13.6,14.7 13.7,14.7C14.8,15.2 15.8,15.8 16.7,16.5C17,16.8 17.5,16.7 17.8,16.3C19.2,14.4 20.2,12.2 20.3,9.8C20.3,9.7 20.3,9.6 20.3,9.5C20.6,8.1 20.7,6.8 20.7,5.4C20.7,4.6 20.5,3.9 20.3,3.5M10,13.2C10.7,13.2 11.3,12.6 11.3,11.9C11.3,11.2 10.7,10.6 10,10.6C9.3,10.6 8.7,11.2 8.7,11.9C8.7,12.6 9.3,13.2 10,13.2M14,13.2C14.7,13.2 15.3,12.6 15.3,11.9C15.3,11.2 14.7,10.6 14,10.6C13.3,10.6 12.7,11.2 12.7,11.9C12.7,12.6 13.3,13.2 14,13.2Z" />
  </svg>
);

const mdiCartPath = "M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22A2,2 0 0,1 5,20A2,2 0 0,1 7,18M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22A2,2 0 0,1 15,20A2,2 0 0,1 17,18M1,2V4H3L6.6,11.6L5.2,14C5.1,14.3 5,14.6 5,15A2,2 0 0,0 7,17H19V15H7.4C7.3,14.7 7.3,14.4 7.5,14L8.1,13H15.5C16.3,13 16.9,12.6 17.2,12L21.1,5.6C21.3,5.2 21.3,4.9 21.1,4.6C21,4.2 20.6,4 20.2,4H5.2L4.3,2H1Z";
export const ShoppingCartIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiCartPath} className={className} style={style} />
);

const mdiShoppingBagPath = "M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z";
export const ShoppingBagIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiShoppingBagPath} className={className} style={style} />
);

export const SnowflakeIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m-7.5-7.5h15m-12.879 5.379 10.758-10.758m-10.758 0L17.379 17.38" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.25 3.25-1.5-1.5a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.75-3.75Z" clipRule="evenodd" />
  </svg>
);

export const CameraIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z" />
  </svg>
);

const mdiChartPiePath = "M11,2V22C5.9,21.5 2,17.1 2,12C2,6.9 5.9,2.5 11,2M13,2V11H22C21.5,6.9 17.1,3 13,2M13,13V22C17.1,21.5 21.5,17.1 22,12H13Z";
export const ChartPieIcon: React.FC<IconProps> = ({ className, style }) => (
  <MdiIcon path={mdiChartPiePath} className={className} style={style} />
);

export const iconMap: { [key: string]: React.FC<IconProps> } = {
  "Account": AccountIcon,
  "Crown": CrownIcon,
  "Gemstone": GemstoneIcon,
  "MagnifyingGlass": MagnifyingGlassIcon,
  "Medal": MedalIcon,
  "Rocket": RocketIcon,
  "ShieldCheck": ShieldCheckIcon,
  "ShootingStar": ShootingStarIcon,
  "Sparkles": SparklesIcon,
  "Star": StarIcon,
  "StarTrophy": StarTrophyIcon,
  "Trophy": TrophyIcon,
  "Comet": CometIcon,
  "Fire": FireIcon,
  "Target": TargetIcon,
  "BookOpen": BookOpenIcon,
  "Snowflake": SnowflakeIcon,
};
export const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const XCircleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const iconMapKeys = Object.keys(iconMap);