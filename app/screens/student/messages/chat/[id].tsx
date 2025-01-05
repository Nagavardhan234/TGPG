import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  IconButton, 
  TextInput,
  Menu,
  Divider,
  Portal,
  Modal,
  Button,
  Chip,
  ActivityIndicator
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  SlideOutLeft,
  withSpring 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { io } from 'socket.io-client';
import api from '@/app/services/api';
import { format } from 'date-fns';
import { authService } from '../../../../../app/services/auth.service';
import jwtDecode from 'jwt-decode';

interface Message {
  MessageID: number;
  Content: string;
  Type: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE';
  MediaURL?: string;
  Duration?: number;
  CreatedAt: string;
  SenderType: string;
  SenderID: number;
  SenderName: string;
  ReadCount: number;
  Reactions?: {
    Emoji: string;
    Count: number;
    UserReacted: boolean;
  }[];
}

interface ChatRoom {
  ChatRoomID: number;
  Name: string;
  Type: string;
  LastMessage?: string;
  UnreadCount: number;
  LastTypingUser?: string;
}

const TypingIndicator = () => {
  const { theme } = useTheme();
  const [typingName, setTypingName] = useState('Someone');
  
  return (
    <Animated.View 
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.typingIndicator, { 
        backgroundColor: theme?.dark ? `${theme?.colors?.surfaceVariant}50` : '#F8F9FA',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${theme?.colors?.primary}10`,
        marginLeft: 48,
        maxWidth: '80%',
      }]}
    >
      <Text style={{ 
        color: theme?.colors?.primary,
        fontSize: 13,
        marginRight: 8,
        fontWeight: '500'
      }}>
        {typingName} is typing
      </Text>
      <View style={styles.typingDots}>
        {[0, 1, 2].map((i) => (
          <Animated.View 
            key={i}
            style={[styles.dot, { 
              backgroundColor: theme?.colors?.primary,
              opacity: 0.6,
              width: 4,
              height: 4,
              borderRadius: 2,
              marginLeft: 2,
            }]}
            entering={FadeIn.delay(i * 200)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const { student } = useStudentAuth();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        await loadChatRoom();
        await loadMessages();
        initializeSocket();
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const initializeSocket = async () => {
    try {
      console.log('[Chat] Starting socket initialization');
      const token = await authService.getToken();
      
      if (!token) {
        console.error('[Chat] No token available for socket connection');
        router.replace('/screens/student/login');
        return;
      }

      // Log token payload
      try {
        const decoded = jwtDecode(token);
        console.log('[Chat] Token payload for socket:', {
          id: decoded.id,
          role: decoded.role,
          pgId: decoded.pgId,
          expiresAt: new Date(decoded.exp * 1000).toISOString()
        });
      } catch (decodeError) {
        console.error('[Chat] Error decoding token for socket:', decodeError);
      }
      
      console.log('[Chat] Creating socket connection to:', process.env.EXPO_PUBLIC_API_URL);
      socketRef.current = io(process.env.EXPO_PUBLIC_API_URL || '', {
        query: {
          roomId: id,
          token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5
      });

      socketRef.current.on('connect', () => {
        console.log('[Chat] Socket connected successfully. Socket ID:', socketRef.current?.id);
      });

      socketRef.current.on('connect_error', (error: any) => {
        console.error('[Chat] Socket connection error:', error.message);
        if (error.message.includes('Authentication error')) {
          router.replace('/screens/student/login');
        }
      });

      socketRef.current.on('disconnect', (reason: string) => {
        console.log('[Chat] Socket disconnected. Reason:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, attempt to reconnect
          socketRef.current?.connect();
        }
      });

      socketRef.current.on('error', (error: any) => {
        console.error('[Chat] Socket error:', error);
        if (error.message?.includes('Authentication error')) {
          router.replace('/screens/student/login');
        }
      });

      socketRef.current.on('new_message', (newMessage: Message) => {
        console.log('[Chat] Received new message:', newMessage.MessageID);
        setMessages(prev => [newMessage, ...prev]);
        if (scrollViewRef.current) {
          scrollToBottom();
        }
      });

      socketRef.current.on('typing_start', (data: { userId: number }) => {
        console.log('[Chat] User started typing:', data.userId);
        if (data.userId !== student?.TenantID) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      socketRef.current.on('typing_end', (data: { userId: number }) => {
        console.log('[Chat] User stopped typing:', data.userId);
        if (data.userId !== student?.TenantID) {
          setIsTyping(false);
        }
      });
    } catch (error) {
      console.error('[Chat] Error initializing socket:', error);
      if (error.message?.includes('Authentication error')) {
        router.replace('/screens/student/login');
      }
    }
  };

  const loadChatRoom = async () => {
    try {
      console.log('[Chat] Loading chat room:', id);
      const response = await api.get(`/api/messages/rooms/${id}`);
      if (response.data.success) {
        console.log('[Chat] Chat room loaded successfully');
        setChatRoom(response.data.data);
      }
    } catch (error) {
      console.error('[Chat] Error loading chat room:', error);
      if (error.response?.status === 401) {
        console.log('[Chat] Unauthorized, redirecting to login');
        router.replace('/login');
      }
    }
  };

  const loadMessages = async (refresh = false) => {
    try {
      console.log('[Chat] Loading messages. Refresh:', refresh);
      setLoading(true);
      const currentPage = refresh ? 1 : page;
      const response = await api.get(`/api/messages/rooms/${id}/messages`, {
        params: {
          page: currentPage,
          limit: 50
        }
      });
      
      if (response.data.success) {
        const newMessages = response.data.data;
        console.log('[Chat] Loaded', newMessages.length, 'messages');
        if (refresh) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...prev, ...newMessages]);
        }
        
        setHasMore(newMessages.length === 50);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('[Chat] Error loading messages:', error);
      if (error.response?.status === 401) {
        console.log('[Chat] Unauthorized, redirecting to login');
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const response = await api.post(`/api/messages/rooms/${id}/messages`, {
        content: message.trim(),
        type: 'TEXT'
      });

      if (response.data.success) {
        // Add message to local state immediately for instant feedback
        const newMessage = response.data.data;
        setMessages(prev => [newMessage, ...prev]);
        setMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized error - maybe redirect to login
        router.replace('/login');
      }
    }
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    try {
      await api.post(`/api/messages/messages/${messageId}/reactions`, { emoji });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a'
      });
      formData.append('type', 'VOICE');

      await api.post(`/api/messages/rooms/${id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'image.jpg'
        });
        formData.append('type', 'IMAGE');

        await api.post(`/api/messages/rooms/${id}/messages`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (error) {
        console.error('Error sending image:', error);
      }
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    const isOwnMessage = msg.SenderID === student?.TenantID;
    const showAvatar = !isOwnMessage && (!messages[index + 1] || messages[index + 1].SenderID !== msg.SenderID);
    const showName = !isOwnMessage && (!messages[index + 1] || messages[index + 1].SenderID !== msg.SenderID);
    const isFirstInGroup = index === 0 || messages[index - 1]?.SenderID !== msg.SenderID;
    const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.SenderID !== msg.SenderID;
    const showTime = index === 0 || 
      new Date(msg.CreatedAt).getTime() - new Date(messages[index - 1]?.CreatedAt).getTime() > 300000;

    return (
    <Animated.View
        key={msg.MessageID}
        entering={SlideInRight.delay(index * 50).springify()}
          style={[
          styles.messageWrapper,
          { alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' }
        ]}
      >
        {showTime && (
          <View style={styles.timeHeader}>
            <Text style={[styles.timeHeaderText, { 
              color: theme?.colors?.onSurfaceVariant,
              fontSize: 12,
            }]}>
              {format(new Date(msg.CreatedAt), 'MMM d, h:mm a')}
              </Text>
            </View>
          )}
        <View style={[
          styles.messageRow,
          { 
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          }
        ]}>
          {showAvatar && !isOwnMessage && (
            <Avatar.Text
              size={32}
              label={msg.SenderName.substring(0, 2)}
              style={[styles.avatar, { 
                backgroundColor: `${theme?.colors?.primary}10`,
                borderWidth: 1,
                borderColor: theme?.colors?.primary,
              }]}
              labelStyle={{ color: theme?.colors?.primary, fontSize: 14 }}
            />
          )}
          <View style={[
            styles.messageContent,
            { 
              maxWidth: '85%',
              marginLeft: !isOwnMessage && !showAvatar ? 40 : 0
            }
          ]}>
            {showName && !isOwnMessage && (
              <Text style={[styles.senderName, { 
                color: theme?.colors?.primary,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 4,
                marginLeft: 4,
              }]}>
                {msg.SenderName}
          </Text>
            )}
            <Pressable 
              onLongPress={() => {
                setSelectedMessage(msg);
                setShowReactions(true);
              }}
              style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessage : styles.otherMessage,
                { 
                  backgroundColor: isOwnMessage ? 
                    theme?.colors?.primary : 
                    theme?.dark ? `${theme?.colors?.surfaceVariant}90` : '#F8F9FA',
                  borderWidth: isOwnMessage ? 0 : 1,
                  borderColor: `${theme?.colors?.primary}10`,
                }
              ]}
            >
              {msg.Type === 'IMAGE' && msg.MediaURL && (
                <Image 
                  source={{ uri: msg.MediaURL }}
                  style={[styles.messageImage, {
                    borderRadius: 12,
                    marginBottom: 4,
                  }]}
                  resizeMode="cover"
                />
              )}
              <Text style={[
                styles.messageText,
                { 
                  color: isOwnMessage ? theme?.colors?.onPrimary : theme?.colors?.onSurface,
                  fontSize: 15,
                }
              ]}>
                {msg.Content}
            </Text>
            </Pressable>
            {msg.Reactions && msg.Reactions.length > 0 && (
              <View style={[
                styles.reactions,
                { alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' }
              ]}>
                {msg.Reactions.map((reaction, idx) => (
                  <Animated.View
                    key={idx}
                    entering={FadeIn.delay(idx * 100).springify()}
                  >
                    <Chip
                      style={[styles.reactionChip, { 
                        backgroundColor: reaction.UserReacted ? 
                          `${theme?.colors?.primary}15` : 
                          theme?.dark ? `${theme?.colors?.surfaceVariant}60` : '#F8F8F8',
                      }]}
                      onPress={() => handleReaction(msg.MessageID, reaction.Emoji)}
                    >
                      <Text style={{ fontSize: 12 }}>
                        {reaction.Emoji} {reaction.Count}
                      </Text>
                    </Chip>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </View>
    </Animated.View>
  );
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    setShowScrollButton(scrollPosition > 300);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMessages();
    }
  };

  return (
    <StudentDashboardLayout title={chatRoom?.Name || 'Chat'}>
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme?.dark ? theme?.colors?.background : '#FFFFFF' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient
          colors={[
            theme?.dark ? `${theme?.colors?.background}00` : '#FFFFFF00',
            theme?.dark ? theme?.colors?.background : '#FFFFFF'
          ]}
          style={StyleSheet.absoluteFill}
        />
        
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={[styles.scrollContent, {
            paddingHorizontal: 16,
          }]}
          style={{ flex: 1 }}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme?.colors?.primary} />
            </View>
          )}
          {messages.slice().reverse().map(renderMessage)}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {showScrollButton && (
          <Animated.View 
            entering={FadeIn.springify()}
            exiting={FadeOut.springify()}
            style={[styles.scrollButton, {
              backgroundColor: theme?.dark ? `${theme?.colors?.primary}15` : '#FFFFFF',
              borderWidth: 1,
              borderColor: `${theme?.colors?.primary}30`,
            }]}
          >
            <IconButton 
              icon="chevron-down"
              size={20}
              iconColor={theme?.colors?.primary}
              onPress={scrollToBottom}
            />
          </Animated.View>
        )}

        <BlurView intensity={20} tint={theme?.dark ? 'dark' : 'light'} style={styles.inputWrapper}>
          <Surface style={[styles.inputContainer, { 
            backgroundColor: theme?.dark ? `${theme?.colors?.surface}95` : '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: `${theme?.colors?.primary}10`,
          }]}>
            <IconButton 
              icon="emoticon-outline"
              size={22}
              iconColor={theme?.colors?.primary}
              style={styles.inputIcon}
            />
            <IconButton 
              icon="paperclip"
              size={22}
              iconColor={theme?.colors?.primary}
              style={styles.inputIcon}
              onPress={() => setShowAttachMenu(true)}
            />
            <TextInput
              placeholder="Type a message..."
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                socketRef.current?.emit('typing_start', { roomId: id });
              }}
              onEndEditing={() => socketRef.current?.emit('typing_end', { roomId: id })}
              style={[styles.input, {
                backgroundColor: theme?.dark ? `${theme?.colors?.surface}80` : '#F8F8F8',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: `${theme?.colors?.primary}20`,
                fontSize: 15,
              }]}
              placeholderTextColor={`${theme?.colors?.onSurface}40`}
              right={
                <TextInput.Icon 
                  icon={isRecording ? "stop" : "microphone"}
                  color={isRecording ? theme?.colors?.error : theme?.colors?.primary}
                  size={20}
                />
              }
            />
            <IconButton 
              icon={message.trim() ? "send" : "camera"}
              size={22}
              style={[
                styles.sendButton,
                message.trim() && {
                  backgroundColor: theme?.colors?.primary,
                  transform: [{ rotate: '-45deg' }]
                }
              ]}
              onPress={message.trim() ? handleSend : pickImage}
              iconColor={message.trim() ? theme?.colors?.onPrimary : theme?.colors?.primary}
            />
          </Surface>
        </BlurView>

        <Portal>
          <Modal
            visible={showAttachMenu}
            onDismiss={() => setShowAttachMenu(false)}
            contentContainerStyle={[
              styles.attachMenu,
              { 
                backgroundColor: theme?.dark ? theme?.colors?.surface : '#FFFFFF',
                borderRadius: 24,
              }
            ]}
          >
            <View style={styles.attachGrid}>
              {[
                { icon: 'image', label: 'Photo', onPress: pickImage },
                { icon: 'file-document', label: 'Document', onPress: () => {} },
                { icon: 'camera', label: 'Camera', onPress: () => {} },
                { icon: 'map-marker', label: 'Location', onPress: () => {} }
              ].map((item, index) => (
                <Pressable
                  key={index}
                  style={[styles.attachButton, {
                    backgroundColor: `${theme?.colors?.primary}10`,
                    borderRadius: 16,
                  }]}
                  onPress={() => {
                    setShowAttachMenu(false);
                    item.onPress();
                  }}
                >
                  <View style={styles.attachIconWrapper}>
                    <IconButton
                      icon={item.icon}
                      size={20}
                      iconColor={theme?.colors?.primary}
                    />
                  </View>
                  <Text style={[styles.attachButtonLabel, {
                    color: theme?.colors?.primary,
                    fontSize: 12,
                    marginTop: 4,
                  }]}>
                  {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Modal>

          <Modal
            visible={showReactions}
            onDismiss={() => setShowReactions(false)}
            contentContainerStyle={[
              styles.reactionsMenu,
              { 
                backgroundColor: theme?.dark ? theme?.colors?.surface : '#FFFFFF',
                borderRadius: 24,
              }
            ]}
          >
            <View style={styles.reactionsGrid}>
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji, index) => (
                <Pressable
                  key={index}
                  style={[styles.reactionButton, {
                    backgroundColor: `${theme?.colors?.primary}10`,
                    borderRadius: 12,
                    padding: 8,
                  }]}
                  onPress={() => {
                    if (selectedMessage) {
                      handleReaction(selectedMessage.MessageID, emoji);
                    }
                    setShowReactions(false);
                  }}
                >
                  <Text style={[styles.reactionEmoji, { fontSize: 24 }]}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </Modal>
        </Portal>
      </KeyboardAvoidingView>
    </StudentDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  messageContentWrapper: {
    flex: 1,
    maxWidth: '80%',
  },
  messageContainer: {
    padding: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    borderTopRightRadius: 4,
    marginLeft: 'auto',
  },
  otherMessage: {
    borderTopLeftRadius: 4,
    marginRight: 'auto',
  },
  ownFirstInGroup: {
    borderTopRightRadius: 20,
  },
  otherFirstInGroup: {
    borderTopLeftRadius: 20,
  },
  ownLastInGroup: {
    borderBottomRightRadius: 20,
  },
  otherLastInGroup: {
    borderBottomLeftRadius: 20,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 10,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    marginHorizontal: 4,
  },
  reactionChip: {
    height: 24,
    borderRadius: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
  inputWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    height: 44,
  },
  inputIcon: {
    margin: 0,
    width: 36,
    height: 36,
  },
  sendButton: {
    margin: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  attachMenu: {
    margin: 20,
    padding: 16,
    width: '90%',
    alignSelf: 'center',
  },
  attachGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  attachButton: {
    width: '48%',
    padding: 12,
    alignItems: 'center',
  },
  attachIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  attachButtonLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  reactionsMenu: {
    margin: 20,
    padding: 20,
    elevation: 4,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  reactionButton: {
    padding: 12,
  },
  reactionEmoji: {
    fontSize: 28,
  },
  scrollButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    borderRadius: 20,
    elevation: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  timeHeader: {
    alignItems: 'center',
    marginVertical: 16,
    opacity: 0.7,
  },
  timeHeaderText: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  messageContainer: {
    padding: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    backgroundColor: '#F8F9FA',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  avatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
}); 