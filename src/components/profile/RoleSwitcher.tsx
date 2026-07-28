/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Check, 
  ChevronDown, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoleSwitcherProps {
  roles: string[];
  activeRole: string | null;
  availableRoles: {
    id: string;
    icon: React.ComponentType<any>;
    label: string;
    desc: string;
    gradient: string;
  }[];
  onSwitchActiveRole: (roleId: string) => Promise<void>;
  onRemoveRole: (roleId: string) => Promise<void>;
  onAddNewRole: (roleId: string) => Promise<void>;
  saving: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  roles,
  activeRole,
  availableRoles,
  onSwitchActiveRole,
  onRemoveRole,
  onAddNewRole,
  saving
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<string | null>(null);

  // Filter roles that the user does not currently own
  const unownedRoles = availableRoles.filter(role => !roles.includes(role.id));

  const handleActiveSelect = async (roleId: string) => {
    setIsDropdownOpen(false);
    if (roleId === activeRole) return;
    await onSwitchActiveRole(roleId);
  };

  const handleAddSubmit = async () => {
    if (!selectedNewRole) return;
    await onAddNewRole(selectedNewRole);
    setSelectedNewRole(null);
    setShowAddPanel(false);
  };

  const activeRoleDetails = availableRoles.find(r => r.id === activeRole) || availableRoles[0];
  const ActiveIcon = activeRoleDetails?.icon || Layers;

  return (
    <div className="space-y-6">
      {/* Active Role Switcher Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 bg-gradient-to-tr ${activeRoleDetails?.gradient || 'from-violet-600 to-indigo-600'} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <ActiveIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Active Role</p>
              <h4 className="text-xl font-black text-white capitalize">{activeRoleDetails ? activeRoleDetails.label : (activeRole || 'Not Selected')}</h4>
            </div>
          </div>

          {roles.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={saving}
                className="w-full sm:w-56 flex items-center justify-between gap-3 px-4 py-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl font-bold text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer disabled:opacity-50"
              >
                <span className="truncate">Switch Active Role</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDropdownOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-full sm:w-56 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-20"
                    >
                      <div className="py-1">
                        {roles.map(roleId => {
                          const roleMeta = availableRoles.find(r => r.id === roleId);
                          const isCurrent = roleId === activeRole;
                          return (
                            <button
                              key={roleId}
                              onClick={() => handleActiveSelect(roleId)}
                              className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-bold transition-all hover:bg-slate-900 ${isCurrent ? 'text-violet-400 bg-violet-600/5' : 'text-slate-300'}`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {roleMeta && <roleMeta.icon className="w-4 h-4 shrink-0 text-slate-500" />}
                                <span className="truncate">{roleMeta ? roleMeta.label : roleId}</span>
                              </div>
                              {isCurrent && <Check className="w-4 h-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Owned Roles list */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">My Roles</h3>
            <p className="text-slate-500 text-xs mt-0.5">Manage and list all your registered identities.</p>
          </div>
          
          {unownedRoles.length > 0 && !showAddPanel && (
            <button
              onClick={() => setShowAddPanel(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Role
            </button>
          )}
        </div>

        {/* Inline Panel for adding another role */}
        <AnimatePresence>
          {showAddPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Select a Role to Add
                  </h4>
                  <button
                    onClick={() => {
                      setShowAddPanel(false);
                      setSelectedNewRole(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {unownedRoles.map(role => {
                    const isSel = selectedNewRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedNewRole(role.id)}
                        className={`text-left p-4 rounded-xl border text-xs font-bold transition-all relative overflow-hidden group ${
                          isSel 
                            ? 'bg-violet-600/10 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.1)] text-white' 
                            : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isSel ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <role.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{role.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal line-clamp-1">
                          {role.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleAddSubmit}
                    disabled={!selectedNewRole || saving}
                    className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      selectedNewRole && !saving
                        ? 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer shadow-violet-600/10'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Add Role
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List of Registered Roles with delete validation */}
        <div className="space-y-3">
          {roles.map(roleId => {
            const roleMeta = availableRoles.find(r => r.id === roleId);
            const isAct = roleId === activeRole;
            const canRemove = roles.length > 1;

            if (!roleMeta) return null;
            const RoleIcon = roleMeta.icon;

            return (
              <div 
                key={roleId}
                className={`flex items-center justify-between p-4 bg-slate-950/40 border rounded-2xl transition-all ${isAct ? 'border-violet-500/40 bg-violet-600/[0.02]' : 'border-slate-800/80 hover:border-slate-800'}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isAct ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-md shadow-violet-600/5' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                    <RoleIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{roleMeta.label}</span>
                      {isAct && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-violet-600/15 border border-violet-500/20 text-violet-400 rounded-full font-bold uppercase tracking-wide shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{roleMeta.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isAct && (
                    <button
                      onClick={() => onSwitchActiveRole(roleId)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/20 rounded-xl font-bold text-[10px] transition-all cursor-pointer"
                    >
                      Make Active
                    </button>
                  )}

                  {isAct ? (
                    <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline-block px-2 py-1 bg-slate-900 border border-slate-800/60 rounded-lg">
                      Active Role (Cannot Remove)
                    </span>
                  ) : !canRemove ? (
                    <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline-block px-2 py-1 bg-slate-900 border border-slate-800/60 rounded-lg">
                      Last Remaining Role
                    </span>
                  ) : null}

                  <button
                    onClick={() => onRemoveRole(roleId)}
                    disabled={isAct || !canRemove || saving}
                    title={
                      isAct 
                        ? 'Cannot remove the active role. Switch active role first.' 
                        : !canRemove 
                        ? 'Cannot remove the last remaining role.' 
                        : `Remove ${roleMeta.label} role`
                    }
                    className={`p-2.5 rounded-xl border transition-all ${
                      isAct || !canRemove
                        ? 'bg-slate-900/50 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-40'
                        : 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border-rose-500/10 hover:border-rose-500/30 cursor-pointer'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
