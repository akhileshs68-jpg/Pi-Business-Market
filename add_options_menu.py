import re

with open('src/components/messaging/ChatWindow.tsx', 'r') as f:
    content = f.read()

# Add states
if "const [showMenu, setShowMenu] = useState(false);" not in content:
    content = content.replace("const [showAttachments, setShowAttachments] = useState(false);", "const [showAttachments, setShowAttachments] = useState(false);\n  const [showMenu, setShowMenu] = useState(false);")

# Add handlers
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

content = content.replace("const handleSend = async (e?: React.FormEvent, type: MessageType = 'text', contentString?: string, meta?: Record<string, any>) => {", handlers + "\n  const handleSend = async (e?: React.FormEvent, type: MessageType = 'text', contentString?: string, meta?: Record<string, any>) => {")

# Add button to Header
menu_button = """
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              title="Options" 
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50">
                <button onClick={handleArchive} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white uppercase tracking-wider">
                  Archive Chat
                </button>
                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 uppercase tracking-wider">
                  Delete for Me
                </button>
              </div>
            )}
          </div>
"""

content = content.replace("""          <button 
            onClick={() => alert("Screen sharing is future-ready and active on Mainnet launch.")}
            title="Screen Share" 
            className="hidden sm:block p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-900/60 rounded-xl transition-all"
          >
            <ScreenShare className="w-4 h-4" />
          </button>
        </div>""", """          <button 
            onClick={() => alert("Screen sharing is future-ready and active on Mainnet launch.")}
            title="Screen Share" 
            className="hidden sm:block p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-900/60 rounded-xl transition-all"
          >
            <ScreenShare className="w-4 h-4" />
          </button>
""" + menu_button + "        </div>")

with open('src/components/messaging/ChatWindow.tsx', 'w') as f:
    f.write(content)
