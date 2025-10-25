import React from 'react';

interface MdiIconProps {
  path: string;
  className?: string;
  style?: React.CSSProperties;
}

const MdiIcon: React.FC<MdiIconProps> = ({ path, className, style }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
};

export default MdiIcon;
