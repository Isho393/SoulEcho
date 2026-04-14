// SoulEcho API Types — aligned with Python backend schemas

export interface UserResponse {
  id: string
  email: string
  name?: string
  role: string
  last_login?: string
}

export interface TokenExchangeResponse {
  token: string
}

// Chat
export interface ChatRequest {
  message: string
  conversation_id?: number
}

export interface ChatEvent {
  type: 'chunk' | 'done' | 'error'
  content?: string
  conversation_id?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  createdAt: Date
}

// Profile
export type PersonalityType =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'
  | 'D' | 'I' | 'S' | 'C'

export type CommunicationPreference = 'direct' | 'narrative' | 'socratic'

export interface UserProfileResponse {
  id: number
  user_id: string
  personality_type?: PersonalityType
  life_context?: string
  goals?: string[]
  communication_preference?: CommunicationPreference
  language?: string
  created_at?: string
  updated_at?: string
}

export interface UserProfileUpdate {
  personality_type?: PersonalityType
  life_context?: string
  goals?: string[]
  communication_preference?: CommunicationPreference
  language?: string
}

// Emotional Check-in
export interface EmotionalCheckinCreate {
  score: number
  note?: string
}

export interface EmotionalCheckinResponse {
  id: number
  user_id: string
  score: number
  note?: string
  created_at: string
}

export interface EmotionalStats {
  avg_7d?: number
  avg_30d?: number
  min_30d?: number
  max_30d?: number
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
}

// Tokens
export interface TokenBalance {
  id: number
  user_id: string
  balance: number
  total_purchased?: number
  total_used?: number
  updated_at?: string
}

export interface TokenPackage {
  id: number
  name: string
  tokens: number
  price: number
  currency?: string
  description?: string
}

// Conversations
export interface Conversation {
  id: number
  user_id: string
  title?: string
  created_at: string
  updated_at?: string
}

export interface ConversationMessage {
  id: number
  user_id: string
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  tokens_used?: number
  created_at: string
}
