import React from 'react';

interface DangerZoneCardProps {
  title: string;
  description: string;
  onDeleteRequested: () => void;
}

export const DangerZoneCard: React.FC<DangerZoneCardProps> = ({ title, description, onDeleteRequested }) => {
  return (
    <div className="p-6 border border-red-500/20 rounded-2xl bg-red-500/5 backdrop-blur">
      <h3 className="text-lg font-bold text-red-400">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 font-medium">{description}</p>
      <div className="mt-4">
        <button 
          onClick={onDeleteRequested}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-bold rounded-xl text-sm transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
