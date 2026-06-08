export interface User {
  id: string
  email: string
  created_at: string
}

export interface InstagramAccount {
  id: string
  user_id: string
  instagram_id: string
  page_id: string
  username: string
  access_token: string
  token_expiry: string | null
  created_at: string
}

export interface AutoReply {
  id: string
  user_id: string
  trigger_type: 'keyword' | 'default'
  keyword: string | null
  reply_message: string
  is_active: boolean
  created_at: string
}

export interface IncomingMessage {
  id: string
  user_id: string
  sender_id: string
  sender_name: string | null
  message_text: string
  received_at: string
}

export interface SentMessage {
  id: string
  user_id: string
  recipient_id: string
  message_text: string
  sent_at: string
  status: 'sent' | 'failed' | 'pending'
}

export interface MetaWebhookEvent {
  object: string
  entry: MetaWebhookEntry[]
}

export interface MetaWebhookEntry {
  id: string
  time: number
  messaging?: MetaWebhookMessaging[]
  changes?: MetaWebhookChange[]
}

export interface MetaWebhookMessaging {
  sender: { id: string }
  recipient: { id: string }
  timestamp: number
  message?: {
    mid: string
    text: string
  }
}

export interface MetaWebhookChange {
  value: {
    messaging?: MetaWebhookMessaging[]
    [key: string]: unknown
  }
  field: string
}

export interface MetaOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface MetaPageInfo {
  id: string
  name: string
  access_token: string
  instagram_business_account?: {
    id: string
    username: string
  }
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
