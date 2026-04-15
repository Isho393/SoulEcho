import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Plus, X, ChevronLeft, Trash2 } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { useVoiceCall } from '../hooks/useVoiceCall'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import VoiceCallOverlay from '../components/chat/VoiceCallOverlay'
import api from '../lib/api'
import type { Conversation } from '../types/api'

const GDPR_KEY = 'soulecho_gdpr_consent'

function GdprBanner({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="bg-navy-light border-b border-white/5 px-4 py-3 flex items-start gap-3">
      <div className="flex-1 text-xs text-cream/50 leading-relaxed">
        Vos conversations sont traitées par une IA. Ne partagez pas d'informations sensibles.
        Données stockées conformément au RGPD.
      </div>
      <button onClick={onAccept} className="text-cream/30 hover:text-cream shrink-0 mt-0.5" aria-label="Fermer">
        <X size={14} />
      </button>
    </div>
  )
}

function ConversationSidebar({
  onSelect,
  onNew,
  activeId,
  onDelete,
  onClose,
}: {
  onSelect: (id: number) => void
  onNew: () => void
  activeId: number | null
  onDelete: (id: number) => void
  onClose?: () => void
}) {
  const queryClient = useQueryClient()
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/api/v1/entities/conversations')
      const data = res.data
      if (!data) return []
      if (Array.isArray(data)) return data as Conversation[]
      if (Array.isArray(data.items)) return data.items as Conversation[]
      return []
    },
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/entities/conversations/${id}`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      onDelete(id)
    },
  })

  return (
    <div className="w-64 shrink-0 border-r border-white/5 flex flex-col bg-navy h-full">
      <div className="p-3 border-b border-white/5 flex items-center gap-2">
        <button
          onClick={onNew}
          className="flex-1 flex items-center gap-2 bg-violet hover:bg-violet-light text-white px-3 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-violet/20"
        >
          <Plus size={15} />
          Nouvelle conversation
        </button>
        {onClose && (
          <button onClick={onClose} className="text-cream/30 hover:text-cream p-1.5 rounded-lg hover:bg-navy-light transition-colors md:hidden">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {conversations.length === 0 ? (
          <p className="text-cream/25 text-xs text-center py-8 px-4">Aucune conversation pour l'instant</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`flex items-center border-b border-white/3 group ${activeId === conv.id ? 'bg-navy-light' : ''}`}
            >
              <button
                onClick={() => { onSelect(conv.id); onClose?.() }}
                className="flex-1 text-left px-3 py-3 hover:bg-navy-light transition-colors min-w-0"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={13} className={`shrink-0 ${activeId === conv.id ? 'text-violet' : 'text-cream/30 group-hover:text-cream/50'}`} />
                  <p className="text-cream/70 text-xs truncate group-hover:text-cream/90 transition-colors">
                    {conv.title || `Conversation #${conv.id}`}
                  </p>
                </div>
                <p className="text-cream/25 text-xs mt-0.5 pl-5">
                  {new Date(conv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(conv.id) }}
                disabled={deleteMutation.isPending}
                className="opacity-0 group-hover:opacity-100 p-2 mr-1 text-cream/30 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-all shrink-0"
                aria-label="Supprimer la conversation"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [showGdpr, setShowGdpr] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { messages, conversationId, isStreaming, sendMessage, loadConversation, resetConversation } = useChat(
    (text) => { if (callOpenRef.current) speakLastResponse(text) }
  )

  const { isOpen: callOpen, isSupported: voiceSupported, callState, transcript, open: openCall, close: closeCall, speakLastResponse } = useVoiceCall({
    onSendMessage: sendMessage,
    isStreaming,
  })

  // Keep a ref so the useChat callback can read the latest callOpen without stale closure
  const callOpenRef = useRef(false)
  callOpenRef.current = callOpen

  const handleDeleteConversation = (id: number) => {
    if (conversationId === id) resetConversation()
  }

  useEffect(() => {
    if (!localStorage.getItem(GDPR_KEY)) setShowGdpr(true)
  }, [])

  // Handle suggestion clicks from empty state
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<string>).detail
      if (text) sendMessage(text)
    }
    window.addEventListener('soulecho:suggest', handler)
    return () => window.removeEventListener('soulecho:suggest', handler)
  }, [sendMessage])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-30 md:z-auto h-full transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <ConversationSidebar
          onSelect={loadConversation}
          onNew={resetConversation}
          activeId={conversationId}
          onDelete={handleDeleteConversation}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main chat */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 bg-navy/50 backdrop-blur-sm md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-cream/50 hover:text-cream p-1 rounded-lg hover:bg-navy-light transition-colors"
          >
            <MessageCircle size={18} />
          </button>
          <span className="text-cream/60 text-sm font-medium">
            {conversationId ? `Conversation #${conversationId}` : 'SoulEcho'}
          </span>
        </div>

        {showGdpr && (
          <GdprBanner onAccept={() => {
            localStorage.setItem(GDPR_KEY, 'true')
            setShowGdpr(false)
          }} />
        )}

        <MessageList messages={messages} isStreaming={isStreaming} />
        <ChatInput onSend={sendMessage} isStreaming={isStreaming} onVoiceCall={voiceSupported ? openCall : undefined} />
      </div>

      <VoiceCallOverlay
        isOpen={callOpen}
        callState={callState}
        transcript={transcript}
        onClose={closeCall}
      />
    </div>
  )
}
