import React, { useState } from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceName: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, resourceName }) => {
  const [confirmationText, setConfirmationText] = useState('');

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Confirm Deletion"
      message={`Are you sure you want to permanently delete ${resourceName}? This action cannot be undone. Please type DELETE to confirm.`}
      confirmText="Permanently Delete"
      onConfirm={onConfirm}
      onCancel={onClose}
      isDestructive={true}
    />
  );
};
