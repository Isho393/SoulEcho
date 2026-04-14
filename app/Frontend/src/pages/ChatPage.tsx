import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Plus, X } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import api from '../lib/api'
import type { Conversation } from '../types/api'

const GDPR_KEY = 'soulecho_gdpr_consent'

function GdprBanner({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="bg-navy-light border-b border-navy px-4 py-3 flex items-start gap-3">
      <div className="flex-1 text-xs text-cream/60">
        <strong className="text-cream/80">Confidentialité :</strong> Vos conversations sont traitées par une IA.
        Ne partagez pas d'informations sensibles. Les données sont stockées conformément au RGPD.
      </div>
      <button
        onClick={onAccept}
        className="text-cream/40 hover:text-cream shrink-0"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  )
}

function ConversationSidebar({
  onSelect,
  onNew,
  activeId,
}: {
  onSelect: (id: number) => void
  onNew: () => void
  activeId: number | null
}) {
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get<Conversation[]>('/api/v1/entities/conversations')
      return res.data
    },
    staleTime: 30_000,
  })

  return (
    <div className="w-56 shrink-0 border-r border-navy-light flex flex-col bg-navy-light h-full">
      <div className="p-3 border-b border-navy">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 bg-violet hover:bg-violet-light text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nouvelle conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-cream/30 text-xs text-center py-6 px-3">Aucune conversation</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-3 py-3 border-b border-navy/50 hover:bg-navy transition-colors ${
                activeId === conv.id ? 'bg-navy' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={14} className="text-violet shrink-0" />
                <p className="text-cream/70 text-xs truncate">
                  {conv.title || `Conversation #${conv.id}`}
                </p>
              </div>
              <p className="text-cream/30 text-xs mt-0.5 pl-5">
                {new Date(conv.created_at).toLocaleDateString('fr-FR')}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { messages, conversationId, isStreaming, sendMessage, loadConversation, resetConversation } = useChat()
  const [showGdpr, setShowGdpr] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(true)

  useEffect(() => {
    const accepted = localStorage.getItem(GDPR_KEY)
    if (!accepted) setShowGdpr(true)
  }, [])

  const handleGdprAccept = () => {
    localStorage.setItem(GDPR_KEY, 'true')
    setShowGdpr(false)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation sidebar — hidden on mobile */}
      <div className={`hidden md:flex ${sidebarVisible ? '' : 'md:hidden'}`}>
        <ConversationSidebar
          onSelect={loadConversation}
          onNew={resetConversation}
          activeId={conversationId}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {showGdpr && <GdprBanner onAccept={handleGdprAccept} />}

        <MessageList messages={messages} isStreaming={isStreaming} />
        <ChatInput onSend={sendMessage} isStreaming={isStreaming} />
      </div>
    </div>
  )
}
