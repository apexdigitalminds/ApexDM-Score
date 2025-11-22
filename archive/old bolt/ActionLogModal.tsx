import React from 'react';
import type { Action } from '@/types';

interface ActionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  actions: Action[];
}

const ActionLogModal: React.FC<ActionLogModalProps> = ({ isOpen, onClose, username, actions }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 w-full max-w-2xl text-white p-6 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Full Action Log for {username}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          {actions.length > 0 ? (
            <div className="space-y-3">
              {actions.map(action => (
                <div key={action.id} className="flex justify-between items-center text-sm p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-slate-300">
                      <span className="font-semibold text-white capitalize">{action.actionType ? action.actionType.replace(/_/g, ' ') : 'Unknown Action'}</span>
                    </p>
                    <p className="text-xs text-slate-500">Source: {action.source}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-400 block">+{action.xpGained} XP</span>
                    <span className="text-slate-400 text-xs">{new Date(action.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">This user has no recorded actions.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionLogModal;