import React from 'react';

interface IconProps {
  className?: string;
  fill?: string;
  // FIX: Add style prop to allow passing CSS styles to icons.
  style?: React.CSSProperties;
}

export const CometIcon: React.FC<IconProps> = ({ className, fill = 'currentColor', style }) => (
  <svg
    version="1.0"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 300 219"
    preserveAspectRatio="xMidYMid meet"
    className={className}
    style={style}
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
    <g
      transform="translate(0, 219) scale(0.1, -0.1)"
      fill={fill}
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

export const ChartBarIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);

export const UserGroupIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962c.57-1.023-.19-2.057-1.108-2.43M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM7.288 15.042A5.25 5.25 0 0 1 12 13.5h.008a5.25 5.25 0 0 1 4.712 1.542M8.25 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm4.5 0a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z" />
    </svg>
);

export const ArrowTrendingUpIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
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
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.87 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.13 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
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

export const FireIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5,0.67C13.5,0.67 13.43,0.91 13.32,1.14C12.44,2.83 12.1,4.22 12.38,5.83C12.67,7.44 13.5,8.14 13.5,9.5C13.5,10.86 12.28,12 11,12C9.72,12 8.5,10.86 8.5,9.5C8.5,8.27 8.94,7.74 9.38,6.81C9.82,5.88 10.1,5.14 10.04,4.22C9.97,3.3 9.5,2.67 9.5,2C9.5,0.8 6.5,2.47 6.5,6.5C6.5,10.53 9.53,13.5 13.5,13.5C17.47,13.5 20.5,10.53 20.5,6.5C20.5,2.47 17.5,0.8 17.5,2C17.5,2.67 17.03,3.3 16.96,4.22C16.9,5.14 17.18,5.88 17.62,6.81C18.06,7.74 18.5,8.27 18.5,9.5C18.5,10.86 17.28,12 16,12C14.72,12 13.5,10.86 13.5,9.5C13.5,8.14 14.33,7.44 14.62,5.83C14.9,4.22 14.56,2.83 13.68,1.14C13.57,0.91 13.5,0.67 13.5,0.67Z" />
    </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13,12H20C20,15.14 17.7,17.93 14.7,18.71L13.29,17.29C15.17,16.24 16.5,14.25 16.92,12H13V10H18C17.45,7.82 15.77,6.1 13.58,5.43L15,4C18.62,5.53 21.14,8.84 21.8,13C20.8,13 20,13.2 20,12A2,2 0 0,1 22,10A2,2 0 0,1 20,8V7C21.1,7 22,6.1 22,5V3C22,1.9 21.1,1 20,1H4A2,2 0 0,0 2,3V19A2,2 0 0,0 4,21H12.26C12.07,20.35 12,19.68 12,19C12,15.69 14.69,13 18,13C18.68,13 19.35,13.07 20,13.26V3H11V10H4V12H11V14H4V19H11.26C10.15,17.47 9.53,15.57 9.5,13.5C9.5,13.33 9.5,13.17 9.5,13H4V10H9V5H4V3H9V10H11V3Z" />
    </svg>
);


export const iconMap: { [key: string]: React.FC<IconProps> } = {
    MagnifyingGlass: MagnifyingGlassIcon,
    ShieldCheck: ShieldCheckIcon,
    Crown: CrownIcon,
    Star: StarIcon,
    Trophy: TrophyIcon,
    Gemstone: GemstoneIcon,
    Rocket: RocketIcon,
    Fire: FireIcon,
    BookOpen: BookOpenIcon,
};

export const iconMapKeys = Object.keys(iconMap);