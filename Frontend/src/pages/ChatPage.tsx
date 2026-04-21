import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Plus, X, ChevronLeft, Trash2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useChat } from '../hooks/useChat'
import { useVoiceCall } from '../hooks/useVoiceCall'
import { useTokens } from '../hooks/useTokens'
import { useProfile } from '../hooks/useProfile'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import VoiceCallOverlay from '../components/chat/VoiceCallOverlay'
import api from '../lib/api'
import type { Conversation } from '../types/api'

const GDPR_KEY = 'soulecho_gdpr_consent'

function GdprBanner({ onAccept }: { onAccept: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3 flex items-start gap-3"
      style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}
    >
      <span className="text-sm">🔒</span>
      <p className="flex-1 text-xs text-cream/45 leading-relaxed">
        Vos conversations sont traitées par une IA. Ne partagez pas d'informations sensibles.
        Données stockées conformément au RGPD.
      </p>
      <button onClick={onAccept} className="text-cream/30 hover:text-cream shrink-0 mt-0.5 transition-colors" aria-label="Fermer">
        <X size={14} />
      </button>
    </motion.div>
  )
}

function ConversationSidebar({
  onSelect, onNew, activeId, onDelete, onClose,
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
    <div className="w-64 shrink-0 flex flex-col h-full" style={{ background: 'rgba(8,17,26,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header */}
      <div className="p-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={onNew}
          className="flex-1 flex items-center gap-2 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-all btn-glow shadow-lg shadow-violet/20"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #9D5CF6)' }}
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

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-violet/10 flex items-center justify-center mb-3">
              <MessageCircle size={18} className="text-violet/50" />
            </div>
            <p className="text-cream/25 text-xs leading-relaxed">Aucune conversation pour l'instant</p>
          </div>
        ) : (
          conversations.map((conv, idx) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`flex items-center rounded-xl mb-1 group transition-all ${
                activeId === conv.id
                  ? 'bg-violet/15 border border-violet/20'
                  : 'hover:bg-white/4 border border-transparent'
              }`}
            >
              <button
                onClick={() => { onSelect(conv.id); onClose?.() }}
                className="flex-1 text-left px-3 py-2.5 min-w-0"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={12} className={`shrink-0 ${activeId === conv.id ? 'text-violet-light' : 'text-cream/25 group-hover:text-cream/45'}`} />
                  <p className={`text-xs truncate transition-colors ${activeId === conv.id ? 'text-cream/90' : 'text-cream/55 group-hover:text-cream/80'}`}>
                    {conv.title || `Conversation #${conv.id}`}
                  </p>
                </div>
                <p className="text-cream/20 text-[10px] mt-0.5 pl-[18px]">
                  {new Date(conv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(conv.id) }}
                disabled={deleteMutation.isPending}
                className="opacity-0 group-hover:opacity-100 p-2 mr-1 text-cream/25 hover:text-rose-400 rounded-lg hover:bg-rose-400/10 transition-all shrink-0"
                aria-label="Supprimer la conversation"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [showGdpr, setShowGdpr] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { balance } = useTokens()
  const { profile } = useProfile()
  const userLanguage = profile?.language || 'fr'

  const { messages, conversationId, isStreaming, sendMessage, loadConversation, resetConversation } = useChat(
    (text) => { if (callOpenRef.current) speakLastResponse(text) }
  )

  const { isOpen: callOpen, isSupported: voiceSupported, callState, transcript, open: openCall, close: closeCall, speakLastResponse } = useVoiceCall({
    onSendMessage: sendMessage,
    isStreaming,
    language: userLanguage,
  })

  const callOpenRef = useRef(false)
  callOpenRef.current = callOpen

  const handleDeleteConversation = (id: number) => {
    if (conversationId === id) resetConversation()
  }

  useEffect(() => {
    if (!localStorage.getItem(GDPR_KEY)) setShowGdpr(true)
  }, [])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Conversation sidebar */}
      <div className={`
        fixed md:relative z-30 md:z-auto h-full transition-transform duration-300 ease-out
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

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 md:hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,17,26,0.8)', backdropFilter: 'blur(12px)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-cream/45 hover:text-cream p-1.5 rounded-lg hover:bg-navy-light transition-colors"
          >
            <MessageCircle size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet to-violet-light flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
            <span className="text-cream/70 text-sm font-medium">
              {conversationId ? `Conversation #${conversationId}` : 'SoulEcho'}
            </span>
          </div>
        </div>

        {/* GDPR banner */}
        <AnimatePresence>
          {showGdpr && (
            <GdprBanner onAccept={() => {
              localStorage.setItem(GDPR_KEY, 'true')
              setShowGdpr(false)
            }} />
          )}
        </AnimatePresence>

        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          onSuggest={sendMessage}
        />
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          onVoiceCall={voiceSupported ? openCall : undefined}
          tokenBalance={balance?.balance}
          language={userLanguage}
        />
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
