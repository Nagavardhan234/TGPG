export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE';
export type SenderType = 'TENANT' | 'MANAGER';

export interface Reaction {
  Emoji: string;
  Count: number;
  UserReacted: boolean;
}

export interface Message {
  MessageID: number | string;
  ChatRoomID: number;
  Content: string;
  Type: MessageType;
  MediaURL?: string | null;
  Duration?: number | null;
  CreatedAt: string;
  SenderType: SenderType;
  SenderID: number;
  SenderName: string;
  ReadCount: number;
  Reactions: Reaction[];
  isPending?: boolean;
  tempMessageId?: string;
}

export interface ChatRoom {
  ChatRoomID: number;
  Name: string;
  Type: string;
  LastMessage?: string;
  UnreadCount: number;
  LastTypingUser?: string;
}

// Socket event payloads
export interface NewMessageEvent extends Message {}

export interface MessageSentEvent {
  tempMessageId: string;
  message: Message;
}

export interface MessageErrorEvent {
  tempMessageId: string;
  error: string;
}

export interface MessagesReadEvent {
  roomId: number;
  messageIds: number[];
  reader: {
    id: number;
    type: SenderType;
  };
}

export interface ReactionUpdateEvent {
  messageId: number;
  reactions: Reaction[];
}

// Socket event map types
export interface ServerToClientEvents {
  new_message: (message: NewMessageEvent) => void;
  message_sent: (data: MessageSentEvent) => void;
  message_error: (data: MessageErrorEvent) => void;
  messages_read: (data: MessagesReadEvent) => void;
  reaction_update: (data: ReactionUpdateEvent) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  join_room: (roomId: number) => void;
  leave_room: (roomId: number) => void;
  send_message: (data: {
    chatRoomId: number;
    content: string;
    type?: MessageType;
    mediaUrl?: string;
    duration?: number;
    tempMessageId: string;
  }) => void;
}

// Combined events for Socket.IO instance
export interface SocketEvents extends ServerToClientEvents, ClientToServerEvents {}

// Socket type with bidirectional events
export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents> & {
  on: <E extends keyof ServerToClientEvents>(
    event: E,
    listener: ServerToClientEvents[E]
  ) => ChatSocket;
  emit: <E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => boolean;
}; 