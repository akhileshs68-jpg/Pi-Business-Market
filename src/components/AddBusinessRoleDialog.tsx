import React from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { RoleConfig } from '../auth/authService';

interface AddBusinessRoleDialogProps {
  unactivatedRoles: RoleConfig[];
  onClose: () => void;
  onSelectRole: (roleId: string) => void;
}

export const AddBusinessRoleDialog: React.FC<AddBusinessRoleDialogProps> = ({
  unactivatedRoles,
  onClose,
  onSelectRole
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-7 rounded-3xl max-w-md w-full relative z-10 shadow-2xl flex flex-col space-y-4 max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Add Business Role
            </h3>
            <p className="text-slate-400 text-xs font-medium">
              Select a business role to activate on your profile.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-2 py-2">
          {unactivatedRoles.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-500 text-xs font-medium border border-dashed border-slate-850 rounded-2xl">
              You have already activated all available business roles.
            </div>
          ) : (
            unactivatedRoles.map((role: RoleConfig) => (
              <button
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className="w-full text-left p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-800/40 border border-slate-850 hover:border-slate-700/60 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl shrink-0">{role.iconName}</span>
                  <div>
                    <span className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors capitalize">
                      {role.label}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Click to initiate onboarding for {role.label}.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
