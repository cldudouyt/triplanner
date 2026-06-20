import api from './client'

export interface MessageThread {
  id: number
  lastMessage?: string
  lastAt?: string
  otherParticipant: {
    id: number
    firstName: string
    lastName: string
    role?: string
    isOnline?: boolean
  }
  unreadCount: number
}

export interface Message {
  id: number
  threadId: number
  senderId: number
  content: string
  createdAt: string
  isRead: boolean
}

export const messagesApi = {
  getThreads: () => api.get<MessageThread[]>('/messages'),
  getMessages: (threadId: number) => api.get<Message[]>(`/messages/${threadId}`),
  getUnreadCount: () => api.get<{ count: number }>('/messages/unread-count'),
  createThread: (data: { recipientId: number; content: string }) =>
    api.post<MessageThread>('/messages', data),
  sendMessage: (threadId: number, data: { content: string }) =>
    api.post<Message>(`/messages/${threadId}`, data),
  markAsRead: (threadId: number) =>
    api.patch(`/messages/${threadId}/read`),
}
