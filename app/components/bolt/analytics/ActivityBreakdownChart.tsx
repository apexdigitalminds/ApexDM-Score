import React from 'react';

interface ChartData {
  actionType: string;
  count: number;
}

interface ActivityBreakdownChartProps {
  data: ChartData[];
}

// 🎨 Vibrant Palette for Dark Mode
const COLORS = [
  '#8b5cf6', // Purple (Primary)
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#84cc16', // Lime
];

const ActivityBreakdownChart: React.FC<ActivityBreakdownChartProps> = ({ data }) => {
  // 1. Calculate Totals
  const total = data.reduce((acc, item) => acc + item.count, 0);
  
  // 2. Prepare Data with Angles/Colors
  let currentAngle = 0;
  const processedData = data.map((item, index) => {
    const percentage = total > 0 ? item.count / total : 0;
    const angle = percentage * 360;
    
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      color: COLORS[index % COLORS.length], // Cycle through colors
      startAngle,
      angle
    };
  });

  // SVG Helpers for Donut Segments
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.32

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
      {/* LEFT: Donut Chart */}
      <div className="relative w-48 h-48 flex-shrink-0">
        {/* SVG Rotated -90deg so it starts at 12 o'clock */}
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {/* Background Circle (Track) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#334155" // slate-700
            strokeWidth="12"
          />
          
          {/* Data Segments */}
          {processedData.map((item, i) => {
            // Calculate stroke-dasharray: [length of segment, length of gap]
            const strokeLength = item.percentage * circumference;
            const spaceLength = circumference - strokeLength;
            
            // Calculate rotation based on cumulative start angle
            // We must rotate the specific circle element to align it
            return (
              <circle
                key={item.actionType}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="12"
                strokeDasharray={`${strokeLength} ${spaceLength}`}
                strokeDashoffset={0} // We handle position via rotation
                transform={`rotate(${item.startAngle} 50 50)`} // Rotate around center (50,50)
                className="transition-all duration-500 ease-out hover:opacity-80"
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-extrabold text-white">{total}</span>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Actions</span>
        </div>
      </div>

      {/* RIGHT: Legend */}
      <div className="flex-grow w-full space-y-2">
        {processedData.map((item) => (
          <div key={item.actionType} className="flex items-center justify-between text-sm group">
            <div className="flex items-center gap-3">
              {/* Color Indicator */}
              <div 
                className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/10" 
                style={{ backgroundColor: item.color }}
              ></div>
              
              {/* Label */}
              <span className="text-slate-300 capitalize group-hover:text-white transition-colors">
                {item.actionType.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Value & Percentage */}
            <div className="font-mono">
              <span className="font-bold text-white mr-2">{item.count}</span>
              <span className="text-slate-500 text-xs">
                ({(item.percentage * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}

        {processedData.length === 0 && (
            <div className="text-center text-slate-500 py-4 text-sm">
                No activity data recorded yet.
            </div>
        )}
      </div>
    </div>
  );
};

export default ActivityBreakdownChart;