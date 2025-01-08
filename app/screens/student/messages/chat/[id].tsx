import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { io, Socket } from 'socket.io-client';
import api from '@/app/services/api';
import { format } from 'date-fns';
import { authService } from '@/app/services/auth.service';
import jwtDecode from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Message,
  ChatRoom,
  ServerToClientEvents,
  ClientToServerEvents,
  NewMessageEvent,
  MessageSentEvent,
  ChatSocket
} from '@/app/types/chat';

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  messageWrapper: {
    marginHorizontal: 8,
    marginVertical: 2,
  },
  messageContainer: {
    borderRadius: 20,
    padding: 12,
    paddingBottom: 8,
    minWidth: 80,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

const styles = StyleSheet.create({
  inputWrapper: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputIcon: {
    margin: 0,
    width: 36,
    height: 36,
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
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    height: 20,
  },
  dot: {
    marginHorizontal: 2,
    transform: [{ scale: 1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  typingLetter: {
    transform: [{ scale: 1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
  },
  loadingContent: {
    padding: 24,
    alignItems: 'center',
  },
  loadingIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    height: 40,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  }
});

const TypingIndicator = () => {
  const { theme } = useTheme();
  const [dots, setDots] = useState('');
  const typingText = chatRoom?.LastTypingUser || 'Someone';
  const letters = typingText.split('');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Create a pulsing animation for the dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View 
      entering={FadeIn.springify()}
      exiting={FadeOut.springify()}
      style={[styles.typingIndicator, { 
        backgroundColor: theme?.dark ? `${theme?.colors?.surfaceVariant}50` : '#F8F9FA',
        borderWidth: 1,
        borderColor: `${theme?.colors?.primary}10`,
        marginLeft: 48,
        maxWidth: '80%',
      }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {letters.map((letter, index) => (
          <Animated.Text
            key={index}
            entering={FadeIn
              .delay(index * 150)
              .springify({
                mass: 0.8,
                damping: 12,
                stiffness: 100,
              })}
            style={[
              styles.typingLetter,
              { 
                color: theme?.colors?.primary,
                fontSize: 13,
                fontWeight: '500',
                opacity: 0.9,
              }
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
        <Text style={{ 
          color: theme?.colors?.primary,
          fontSize: 13,
          marginLeft: 4,
          fontWeight: '500',
          opacity: 0.8
        }}>
          is typing{dots}
        </Text>
      </View>
      <View style={styles.typingDots}>
        {[0, 1, 2].map((i) => (
          <Animated.View 
            key={i}
            entering={FadeIn
              .delay(i * 200)
              .springify({
                mass: 0.5,
                damping: 8,
                stiffness: 80,
              })}
            style={[
              styles.dot,
              { 
                backgroundColor: theme?.colors?.primary,
                width: 4,
                height: 4,
                borderRadius: 2,
                opacity: 0.6,
                transform: [{
                  scale: Animated.multiply(
                    scaleAnim,
                    new Animated.Value(1 - i * 0.1)
                  )
                }]
              }
            ]}
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
  const socketRef = useRef<ChatSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatMessageTime = (dateString: string) => {
    try {
     
      
      // Create date from the string (it's already in IST)
      const date = new Date(dateString.replace('Z', ''));
      
      // Get hours and minutes (local time)
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      
      // Format to 12-hour time
      const period = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      
      const formattedTime = `${displayHours}:${displayMinutes}${period}`;
      
      return formattedTime;
    } catch (error) {
      console.error('[Chat] Error formatting time:', error);
      return '--:-- --';
    }
  };

  // Main initialization useEffect
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('[Chat] Starting chat initialization');
        setLoading(true);
        setError(null);
        
        // First check token and student data
        const token = await AsyncStorage.getItem('student_token');
        if (!token) {
          console.log('[Chat] No token found, redirecting to login');
          router.replace('/screens/student/login');
          return;
        }

        // Load chat room and messages
        const roomResponse = await loadChatRoom();
        if (!roomResponse) {
          setLoading(false);
          return;
        }

        setChatRoom(roomResponse.data);
        
        // Initialize socket
        const socketUrl = 'http://localhost:3000';
        
        // Clean up existing socket if any
        if (socketRef.current) {
          console.log('[Chat] Cleaning up existing socket connection');
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        console.log('[Chat] Creating new socket connection');
        socketRef.current = io(socketUrl, {
          path: '/socket.io',
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 5000,
          forceNew: true,
          query: { 
            roomId: `room:${id}`,
            userType: 'STUDENT',
            userId: student?.TenantID
          }
        }) as ChatSocket;

        // Set up connection event handlers
        socketRef.current.on('connect', () => {
          console.log('[Chat] Socket connected with ID:', socketRef.current?.id);
          setIsConnecting(false);
          
          // Join room after connection with proper format
          const roomId = parseInt(id as string);
          console.log('[Chat] Joining room:', roomId);
          socketRef.current?.emit('join_room', {
            roomId: `room:${roomId}`,
            userType: 'STUDENT',
            userId: student?.TenantID,
            userName: student?.FullName
          });
        });

        socketRef.current.on('room_joined', (data) => {
          console.log('[Chat] Successfully joined room:', data);
          setIsConnecting(false);
          // Fetch latest messages after joining room
          loadMessages(true).then(response => {
            if (response?.success) {
              setMessages(response.data);
              setHasMore(response.data.length === 50);
              setPage(2);
            }
          });
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('[Chat] Socket connection error:', error);
          setError('Connection error occurred');
          // Try to reconnect with polling if websocket fails
          if (socketRef.current?.io?.opts?.transports?.[0] === 'websocket') {
            console.log('[Chat] Falling back to polling transport');
            socketRef.current.io.opts.transports = ['polling', 'websocket'];
          }
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('[Chat] Socket disconnected. Reason:', reason);
          setIsConnecting(true);
        });

        // Load initial messages
        const messagesResponse = await loadMessages();
        if (messagesResponse?.success) {
          setMessages(messagesResponse.data);
          setHasMore(messagesResponse.data.length === 50);
          setPage(2);
        }

        setLoading(false);
        setIsConnecting(false);

      } catch (error: any) {
        console.error('[Chat] Error initializing chat:', error);
        setError(error.message || 'Failed to initialize chat');
        setLoading(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('[Chat] Cleaning up socket connection');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [id]); // Only re-run if chat room ID changes

  // Message handling useEffect
  useEffect(() => {
    if (socketRef.current) {
      console.log('[Chat] Setting up message handlers for room:', id);

      // Handle new messages
      const handleNewMessage = (newMessage: NewMessageEvent) => {
        try {
          console.log('[Chat] Received new_message event:', {
            room: id,
            messageId: newMessage.MessageID,
            senderId: newMessage.SenderID,
            currentUser: student?.TenantID
          });
          
          // Skip if this is our own message (we'll handle it in message_sent)
          if (newMessage.SenderID === student?.TenantID) {
            console.log('[Chat] Skipping own message in new_message handler');
            return;
          }

          const messageWithIST = {
            ...newMessage,
            CreatedAt: newMessage.CreatedAt.replace('Z', '')
          };
          
          setMessages(prev => {
            const exists = prev.some(m => 
              m.MessageID === messageWithIST.MessageID || 
              (m.isPending && m.MessageID === messageWithIST.tempMessageId)
            );

            if (!exists) {
              const newMessages = [...prev, messageWithIST];
              setTimeout(scrollToBottom, 100);
              return newMessages;
            }
            return prev;
          });
        } catch (error) {
          console.error('[Chat] Error handling new_message:', error);
        }
      };

      // Handle message sent confirmation
      const handleMessageSent = (data: MessageSentEvent) => {
        try {
          console.log('[Chat] Received message_sent event:', data);
          
          if (!data?.message) {
            console.error('[Chat] Invalid message_sent data:', data);
            return;
          }

          setMessages(prev => {
            // Remove temp message and add confirmed message
            const updated = prev.filter(msg => 
              !(msg.isPending && msg.MessageID === data.tempMessageId)
            );

            const confirmedMessage = {
              ...data.message,
              CreatedAt: data.message.CreatedAt.replace('Z', '')
            };

            return [...updated, confirmedMessage];
          });
        } catch (error) {
          console.error('[Chat] Error handling message_sent:', error);
        }
      };

      socketRef.current.on('new_message', handleNewMessage);
      socketRef.current.on('message_sent', handleMessageSent);

      return () => {
        console.log('[Chat] Cleaning up message handlers for room:', id);
        socketRef.current?.off('new_message', handleNewMessage);
        socketRef.current?.off('message_sent', handleMessageSent);
        const roomId = parseInt(id as string);
        socketRef.current?.emit('leave_room', {
          roomId: roomId,
          userType: 'STUDENT',
          userId: student?.TenantID
        });
      };
    }
  }, [socketRef.current, id, student?.TenantID]);

  const loadChatRoom = async () => {
    try {
      console.log('[Chat] Loading chat room:', id);
      const student = await AsyncStorage.getItem('student');
      if (!student) {
        throw new Error('Student information not found');
      }
      
      const studentData = JSON.parse(student);
      // Handle both pgId and PGID
      const pgId = studentData.pgId || studentData.PGID;
      if (!pgId) {
        throw new Error('PG information not found');
      }

      // First get all chat rooms to validate access
      const roomsResponse = await api.get(`/api/messages/pg/${pgId}/rooms`, {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('student_token')}`
        }
      });
      
      if (!roomsResponse.data?.success) {
        throw new Error('Failed to validate chat room access');
      }

      // Verify user has access to this room
      const hasAccess = roomsResponse.data.data.some(
        (room: any) => room.ChatRoomID.toString() === id
      );

      if (!hasAccess) {
        throw new Error('You do not have access to this chat room');
      }

      // Now get specific room details
      const roomResponse = await api.get(`/api/messages/rooms/${id}`, {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('student_token')}`
        }
      });
      
      if (!roomResponse.data?.success) {
        throw new Error(roomResponse.data?.message || 'Failed to load chat room');
      }

      return {
        success: true,
        data: roomResponse.data.data
      };
    } catch (error: any) {
      console.error('[Chat] Error loading chat room:', error);
      if (error.response?.status === 404) {
        setError('Chat room not found');
        return null;
      }
      if (error.response?.status === 401) {
        await checkTokenAndRedirect();
        return null;
      }
      setError(error.message || 'Failed to load chat room');
      return null;
    }
  };

  const loadMessages = async (refresh = false) => {
    try {
      const currentPage = refresh ? 1 : page;
      const response = await api.get(`/api/messages/rooms/${id}/messages`, {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('student_token')}`
        },
        params: {
          page: currentPage,
          limit: 50
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load messages');
      }

      const messages = response.data.data.map((msg: Message) => {
        return {
          ...msg,
          CreatedAt: msg.CreatedAt
        };
      });

      // Sort messages in ascending order (oldest to newest)
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
      );

      // If this is the initial load or refresh, scroll to bottom after a delay
      if (refresh || currentPage === 1) {
        setTimeout(scrollToBottom, 100);
      }

      return {
        ...response.data,
        data: sortedMessages
      };
    } catch (error: any) {
      console.error('[Chat] Error loading messages:', error);
      if (error.response?.status === 404) {
        setError('Messages not found');
        return null;
      }
      if (error.response?.status === 401) {
        await checkTokenAndRedirect();
        return null;
      }
      setError(error.message || 'Failed to load messages');
      return null;
    }
  };

  const handleLoadMore = async () => {
    if (hasMore && !loading) {
      try {
        setLoading(true);
        const response = await loadMessages();
        if (response?.success) {
          const newMessages = response.data;
          setMessages(prev => [...prev, ...newMessages]);
          setHasMore(newMessages.length === 50);
          setPage(prev => prev + 1);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const checkTokenAndRedirect = async () => {
    try {
      const token = await AsyncStorage.getItem('student_token');
      if (!token) {
        router.replace('/screens/student/login');
        return;
      }

      try {
        // Try to get a new token from the server
        const response = await api.post('/api/student/auth/refresh', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data?.success && response.data?.token) {
          await AsyncStorage.setItem('student_token', response.data.token);
          return true;
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        console.error('[Chat] Error refreshing token:', error);
        await AsyncStorage.multiRemove(['student_token', 'student']);
        router.replace('/screens/student/login');
        return false;
      }
    } catch (error) {
      console.error('[Chat] Error checking token:', error);
      router.replace('/screens/student/login');
      return false;
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

    // Show scroll button if user has scrolled up more than 100 pixels from bottom
    const isScrolledUp = contentHeight - offsetY - scrollViewHeight > 100;
    setShowScrollButton(isScrolledUp);
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        setError('Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Close attach menu if open
        setShowAttachMenu(false);

        // Upload the image
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);

        try {
          const response = await api.post(`/api/messages/rooms/${id}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${await AsyncStorage.getItem('student_token')}`
            }
          });

          if (response.data?.success && response.data?.url) {
            // Send message with image
            socketRef.current?.emit('new_message', {
              roomId: id,
              content: '',
              type: 'IMAGE',
              mediaUrl: response.data.url
            }, (response: any) => {
              if (response?.error) {
                setError('Failed to send image');
              }
            });
          } else {
            throw new Error('Failed to upload image');
          }
        } catch (error) {
          console.error('[Chat] Error uploading image:', error);
          setError('Failed to upload image');
        }
      }
    } catch (error) {
      console.error('[Chat] Error picking image:', error);
      setError('Failed to pick image');
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !recording) return;

    try {
      if (recording) {
        // Handle voice message
      } else {
        const messageContent = message.trim();
        setMessage('');
        
        console.log('[Chat] Sending new message');
        
        const tempId = `temp_${Date.now()}`;
        const roomId = parseInt(id as string);
        
        // Create temp message first
        const now = new Date();
        const timeString = `${now.getFullYear()}-` +
          `${String(now.getMonth() + 1).padStart(2, '0')}-` +
          `${String(now.getDate()).padStart(2, '0')}T` +
          `${String(now.getHours()).padStart(2, '0')}:` +
          `${String(now.getMinutes()).padStart(2, '0')}:` +
          `${String(now.getSeconds()).padStart(2, '0')}.` +
          `${String(now.getMilliseconds()).padStart(3, '0')}`;
        
        console.log('[Chat] Creating temp message with IST time:', timeString);

        const tempMessage = {
          MessageID: tempId,
          ChatRoomID: roomId,
          Content: messageContent,
          Type: 'TEXT' as const,
          CreatedAt: timeString,
          SenderType: 'TENANT' as const,
          SenderID: student?.TenantID || 0,
          SenderName: student?.FullName || '',
          ReadCount: 0,
          Reactions: [],
          isPending: true
        };

        // Add temp message to state first
        setMessages(prev => [...prev, tempMessage]);

        // Then emit the socket event
        socketRef.current?.emit('send_message', {
          chatRoomId: roomId,
          content: messageContent,
          type: 'TEXT',
          tempMessageId: tempId
        });

        // Always scroll to bottom after sending
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('[Chat] Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    if (text.length > 0) {
      socketRef.current?.emit('typing_start', { 
        roomId: id,
        userId: student?.TenantID,
        userName: student?.FullName
      });
    } else {
      socketRef.current?.emit('typing_end', { 
        roomId: id,
        userId: student?.TenantID
      });
    }
  };

  // Define theme-dependent styles inside the component
  const getThemedStyles = () => ({
    ownMessage: {
      backgroundColor: theme?.colors?.primary,
      borderRadius: 20,
      borderBottomRightRadius: 4,
      marginLeft: 'auto',
      borderWidth: 0,
      shadowColor: theme?.colors?.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    otherMessage: {
      backgroundColor: theme?.dark ? 'rgba(255,255,255,0.08)' : '#F0F2F5',
      borderRadius: 20,
      borderBottomLeftRadius: 4,
      marginRight: 'auto',
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    senderName: {
      fontSize: 13,
      color: theme?.colors?.primary,
      marginBottom: 2,
      fontWeight: '600',
      opacity: 0.9,
    },
    ownMessageText: {
      color: '#FFFFFF',
      fontWeight: '400',
    },
    otherMessageText: {
      color: theme?.dark ? '#FFFFFF' : '#000000',
      fontWeight: '400',
    },
    ownTimestamp: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
    },
    otherTimestamp: {
      color: theme?.dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      fontSize: 11,
    },
    themedInput: {
      backgroundColor: theme?.dark ? 'rgba(255,255,255,0.08)' : '#F0F2F5',
      borderRadius: 24,
      borderWidth: 0,
      color: theme?.colors?.text,
      elevation: 2,
    },
    themedInputContainer: {
      backgroundColor: theme?.dark ? theme?.colors?.surface : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: theme?.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      paddingVertical: 8,
    }
  });

  const renderMessage = (message: Message, index: number) => {
    const themedStyles = getThemedStyles();
    const isOwnMessage = message.SenderType === 'TENANT' && message.SenderID === student?.TenantID;
    const showSenderInfo = index === 0 || 
      messages[index - 1]?.SenderID !== message.SenderID ||
      messages[index - 1]?.SenderType !== message.SenderType;
    
    const messageTime = formatMessageTime(
      typeof message.CreatedAt === 'string' 
        ? message.CreatedAt 
        : message.CreatedAt.toISOString()
    );

    // Use unique key for the message
    const messageKey = message.uniqueKey || `msg_${message.MessageID}_${index}`;

    return (
      <Animated.View
        key={messageKey}
        entering={isOwnMessage ? SlideInRight.springify() : FadeIn.springify()}
        style={[
          baseStyles.messageWrapper,
          isOwnMessage ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
          { maxWidth: '80%', marginVertical: 4 }
        ]}
      >
        {!isOwnMessage && showSenderInfo && (
          <Text style={[themedStyles.senderName, { marginLeft: 12 }]}>
            {message.SenderName}
          </Text>
        )}

        <View style={[
          baseStyles.messageContainer,
          isOwnMessage ? themedStyles.ownMessage : themedStyles.otherMessage,
          { marginTop: showSenderInfo && !isOwnMessage ? 4 : 0 }
        ]}>
          {message.Type === 'IMAGE' && message.MediaURL && (
            <Image
              source={{ uri: message.MediaURL }}
              style={[baseStyles.messageImage, { borderRadius: 12 }]}
              resizeMode="cover"
            />
          )}
          
          <Text style={[
            baseStyles.messageText,
            isOwnMessage ? themedStyles.ownMessageText : themedStyles.otherMessageText,
            { fontSize: 15, lineHeight: 20 }
          ]}>
            {message.Content}
          </Text>

          <Text style={[
            baseStyles.timestamp,
            isOwnMessage ? themedStyles.ownTimestamp : themedStyles.otherTimestamp,
            { fontSize: 11, marginTop: 4 }
          ]}>
            {messageTime}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Add logging to messages state updates
  useEffect(() => {
    console.log('[Chat] Messages state updated:', {
      count: messages.length,
      lastMessage: messages[messages.length - 1],
      firstMessage: messages[0]
    });
  }, [messages]);

  // Add logging to message state updates
  useEffect(() => {
    if (messages.length > 0) {
      console.log('[Chat] Messages state updated. Sample timestamps:');
      messages.slice(0, 3).forEach(msg => {
        console.log(`Message ID ${msg.MessageID}: ${msg.CreatedAt} -> ${formatMessageTime(msg.CreatedAt)}`);
      });
    }
  }, [messages]);

  // Add initializeSocket function
  const initializeSocket = async () => {
    try {
      setError(null);
      setIsConnecting(true);

      // Check token
      const token = await AsyncStorage.getItem('student_token');
      if (!token) {
        console.log('[Chat] No token found, redirecting to login');
        router.replace('/screens/student/login');
        return;
      }

      // Clean up existing socket if any
      if (socketRef.current) {
        console.log('[Chat] Cleaning up existing socket connection');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Initialize socket
      const socketUrl = 'http://localhost:3000';
      console.log('[Chat] Creating new socket connection');
      socketRef.current = io(socketUrl, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000,
        forceNew: true,
        query: { 
          roomId: `room:${id}`,
          userType: 'STUDENT',
          userId: student?.TenantID
        }
      }) as ChatSocket;

      // Set up connection event handlers
      socketRef.current.on('connect', () => {
        console.log('[Chat] Socket connected with ID:', socketRef.current?.id);
        setIsConnecting(false);
        
        // Join room after connection
        const roomId = parseInt(id as string);
        console.log('[Chat] Joining room:', roomId);
        socketRef.current?.emit('join_room', {
          roomId: `room:${roomId}`,
          userType: 'STUDENT',
          userId: student?.TenantID,
          userName: student?.FullName
        });
      });

      socketRef.current.on('room_joined', (data) => {
        console.log('[Chat] Successfully joined room:', data);
        setIsConnecting(false);
        // Fetch latest messages after joining room
        loadMessages(true).then(response => {
          if (response?.success) {
            setMessages(response.data);
            setHasMore(response.data.length === 50);
            setPage(2);
          }
        });
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('[Chat] Socket connection error:', error);
        setError('Connection error occurred');
        // Try to reconnect with polling if websocket fails
        if (socketRef.current?.io?.opts?.transports?.[0] === 'websocket') {
          console.log('[Chat] Falling back to polling transport');
          socketRef.current.io.opts.transports = ['polling', 'websocket'];
        }
      });

    } catch (error: any) {
      console.error('[Chat] Error initializing socket:', error);
      setError(error.message || 'Failed to initialize socket connection');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnecting || loading) {
    return (
      <StudentDashboardLayout title="Chat">
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: theme?.dark ? theme?.colors?.background : '#FFFFFF'
        }}>
          <Animated.View
            entering={FadeIn.duration(1000)}
            style={baseStyles.loadingContainer}
          >
            <Surface style={[baseStyles.loadingCard, {
              backgroundColor: theme?.dark ? theme?.colors?.surface : '#FFFFFF',
              borderColor: `${theme?.colors?.primary}20`,
            }]}>
              <View style={baseStyles.loadingContent}>
                <Animated.View
                  entering={FadeIn}
                  style={baseStyles.loadingIconContainer}
                >
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={i}
                      entering={FadeIn.delay(i * 200)}
                      style={[baseStyles.loadingDot, {
                        backgroundColor: theme?.colors?.primary,
                        transform: [{
                          scale: withSpring(1, {
                            mass: 1,
                            damping: 10,
                            stiffness: 100,
                            restDisplacementThreshold: 0.001,
                          })
                        }]
                      }]}
                    />
                  ))}
                </Animated.View>
                <Text style={[baseStyles.loadingText, { color: theme?.colors?.primary }]}>
                  {isConnecting ? 'Connecting to chat...' : 'Loading messages...'}
                </Text>
              </View>
            </Surface>
          </Animated.View>
        </View>
      </StudentDashboardLayout>
    );
  }

  if (error) {
    return (
      <StudentDashboardLayout title="Chat">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Surface style={{ 
            padding: 20, 
            borderRadius: 12,
            backgroundColor: theme?.dark ? theme?.colors?.surface : '#FFFFFF',
            elevation: 4
          }}>
            <Text style={{ 
              color: theme?.colors?.error, 
              marginBottom: 16,
              textAlign: 'center',
              fontSize: 16
            }}>
              {error}
            </Text>
            <Button 
              mode="contained" 
              onPress={initializeSocket}
              style={{ marginTop: 8 }}
            >
              Retry Connection
            </Button>
          </Surface>
        </View>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout title={chatRoom?.Name || 'Chat'}>
      <KeyboardAvoidingView 
        style={[baseStyles.container, { backgroundColor: theme?.dark ? theme?.colors?.background : '#FFFFFF' }]}
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
          contentContainerStyle={[{
            paddingHorizontal: 16,
            paddingBottom: 16,
            flexGrow: 1,
            justifyContent: 'flex-end'
          }]}
          style={{ flex: 1 }}
          inverted={false}
        >
          {loading && (
            <View style={baseStyles.loadingContainer}>
              <ActivityIndicator size="small" color={theme?.colors?.primary} />
            </View>
          )}
          {messages.map((msg, index) => renderMessage(msg, index))}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        <BlurView intensity={20} tint={theme?.dark ? 'dark' : 'light'} style={styles.inputWrapper}>
          <Surface style={[baseStyles.inputContainer, getThemedStyles().themedInputContainer]}>
            <IconButton 
              icon="emoticon-outline"
              size={24}
              iconColor={theme?.colors?.primary}
              style={[styles.inputIcon, { opacity: 0.8 }]}
              onPress={() => setShowReactions(true)}
            />
            <IconButton 
              icon="paperclip"
              size={24}
              iconColor={theme?.colors?.primary}
              style={[styles.inputIcon, { opacity: 0.8 }]}
              onPress={() => setShowAttachMenu(true)}
            />
            <TextInput
              placeholder="Type a message..."
              value={message}
              onChangeText={handleTyping}
              style={[
                baseStyles.input,
                getThemedStyles().themedInput,
                { fontSize: 16 }
              ]}
              placeholderTextColor={theme?.colors?.placeholder}
              right={
                <TextInput.Icon 
                  icon={isRecording ? "stop" : "microphone"}
                  color={isRecording ? theme?.colors?.error : theme?.colors?.primary}
                  size={22}
                  onPress={() => setIsRecording(!isRecording)}
                />
              }
            />
            <IconButton 
              icon={message.trim() ? "send" : "camera"}
              size={24}
              style={[
                baseStyles.sendButton,
                message.trim() && {
                  backgroundColor: theme?.colors?.primary,
                  transform: [{ rotate: '-45deg' }]
                }
              ]}
              onPress={message.trim() ? handleSend : pickImage}
              iconColor={message.trim() ? '#FFFFFF' : theme?.colors?.primary}
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
        </Portal>
      </KeyboardAvoidingView>
    </StudentDashboardLayout>
  );
} 