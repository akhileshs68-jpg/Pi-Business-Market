import { messagingService } from './messagingService';
import { Conversation, ConversationType } from '../types';

export const ConversationService = {
  createConversation: async (participants: string[], type: ConversationType, options?: any) => {
    return messagingService.getOrCreateConversation(participants, type, options);
  },
  
  findConversation: async (participants: string[], type: ConversationType, options?: any) => {
    return messagingService.getOrCreateConversation(participants, type, options);
  },
  
  getUserConversations: (userUid: string, callback: (conversations: Conversation[]) => void) => {
    return messagingService.subscribeToConversations(userUid, callback);
  },
  
  archiveConversation: async (conversationId: string, userUid: string) => {
    return messagingService.archiveConversation(conversationId, userUid);
  }
};
