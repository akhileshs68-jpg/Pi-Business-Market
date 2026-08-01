import re

with open('src/services/messagingService.ts', 'r') as f:
    content = f.read()

content = content.replace("""    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => this.mapDocToConversation(doc));
      callback(conversations);
    });""", """    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => this.mapDocToConversation(doc))
        .filter(conv => !(conv.deletedBy && conv.deletedBy.includes(userUid))); // Filter out deleted for this user
      callback(conversations);
    });""")

# Add archive and delete methods
new_methods = """
  async archiveConversation(conversationId: string, userUid: string): Promise<void> {
    const db = getFirebaseDb();
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      archivedBy: arrayUnion(userUid)
    });
  },

  async deleteConversationForUser(conversationId: string, userUid: string): Promise<void> {
    const db = getFirebaseDb();
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      deletedBy: arrayUnion(userUid)
    });
  },
"""

content = content.replace("  async markAsRead(conversationId: string, userUid: string): Promise<void> {", new_methods + "\n  async markAsRead(conversationId: string, userUid: string): Promise<void> {")

# we need arrayUnion import
if "arrayUnion" not in content:
    content = content.replace("import {\n  collection,", "import {\n  collection,\n  arrayUnion,")

with open('src/services/messagingService.ts', 'w') as f:
    f.write(content)
