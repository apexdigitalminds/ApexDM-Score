
import React from 'react';
import type { ActionType } from '../types';

interface ActionButtonProps {
  actionType: ActionType;
  label: string;
  onAction: (actionType: ActionType) => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ actionType, label, onAction }) => {
  return (
    <button
      onClick={() => onAction(actionType)}
      className="w-full bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
    >
      {label}
    </button>
  );
};

export default ActionButton;