import re

with open('src/components/messaging/ChatWindow.tsx', 'r') as f:
    content = f.read()

handlers = """
  const handleArchive = async () => {
    try {
      await messagingService.archiveConversation(conversation.conversationId, currentUserUid);
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await messagingService.deleteConversationForUser(conversation.conversationId, currentUserUid);
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };
"""

content = content.replace("  const handleSend = async (e?: React.FormEvent", handlers + "\n  const handleSend = async (e?: React.FormEvent")

with open('src/components/messaging/ChatWindow.tsx', 'w') as f:
    f.write(content)
