/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UniversalShareModal } from '../sharing/UniversalShareModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  onRewardEarned?: () => void;
}

export const SocialShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userId,
  productId = 'PI-GLOBAL-MARKET',
  productName = 'Pi Business Market - Global Pioneer Commerce',
  productImage,
  onRewardEarned
}) => {
  return (
    <UniversalShareModal
      isOpen={isOpen}
      onClose={onClose}
      userId={userId}
      entityType="product"
      entityId={productId}
      entityName={productName}
      entityImage={productImage}
      onRewardEarned={() => {
        if (onRewardEarned) onRewardEarned();
      }}
    />
  );
};
