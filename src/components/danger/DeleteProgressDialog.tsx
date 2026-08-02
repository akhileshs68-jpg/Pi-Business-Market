import React from 'react';

interface DeleteProgressDialogProps {
  isOpen: boolean;
  status: string;
}

export const DeleteProgressDialog: React.FC<DeleteProgressDialogProps> = ({ isOpen, status }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl text-white">
        <h2 className="text-lg font-bold mb-2">Deleting...</h2>
        <p className="text-sm text-slate-300">{status}</p>
      </div>
    </div>
  );
};
