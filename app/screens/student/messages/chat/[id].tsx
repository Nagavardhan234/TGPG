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
import { io } from 'socket.io-client';
import api from '@/app/services/api';
import { format } from 'date-fns';
import { authService } from '@/app/services/auth.service';
import jwtDecode from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const socketRef = useRef<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('[Chat] Starting chat initialization');
        setLoading(true);
        setError(null);
        
        // First check token and student data
        const [token, studentStr] = await Promise.all([
          AsyncStorage.getItem('student_token'),
          AsyncStorage.getItem('student')
        ]);

        if (!token || !studentStr) {
          console.log('[Chat] Missing token or student data');
          router.replace('/screens/student/login');
          return;
        }

        try {
          const studentData = JSON.parse(studentStr);
          console.log('[Chat] Student data:', studentData);
          
          // Check if we have PG information (handle both pgId and PGID)
          if (!studentData?.pgId && !studentData?.PGID) {
            console.log('[Chat] No PG ID found, fetching student details');
            // If PG ID is missing, try to fetch fresh student details
            const studentResponse = await api.get('/api/student/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (studentResponse.data?.success && 
               (studentResponse.data?.data?.pgId || studentResponse.data?.data?.PGID)) {
              // Update stored student data with fresh data
              await AsyncStorage.setItem('student', JSON.stringify(studentResponse.data.data));
            } else {
              throw new Error('Could not retrieve PG information');
            }
          }
        } catch (parseError) {
          console.error('[Chat] Error parsing/fetching student data:', parseError);
          throw new Error('Invalid student data');
        }

        // Load chat data and initialize socket in parallel
        const roomResponse = await loadChatRoom();
        if (!roomResponse) {
          setLoading(false);
          return;
        }

        setChatRoom(roomResponse.data);
        
        const [messagesResponse] = await Promise.all([
          loadMessages(),
          initializeSocket()
        ]);
        
        if (messagesResponse?.success) {
          setMessages(messagesResponse.data);
          setHasMore(messagesResponse.data.length === 50);
          setPage(2);
        }

      } catch (error: any) {
        console.error('[Chat] Error initializing chat:', error);
        setError(error.message || 'Failed to initialize chat');
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

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
      console.log('[Chat] Loading messages. Refresh:', refresh);
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

      return response.data;
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

  const initializeSocket = async () => {
    try {
      console.log('[Chat] Starting socket initialization');
      const token = await AsyncStorage.getItem('student_token');
      
      if (!token) {
        console.log('[Chat] No token found, redirecting to login');
        router.replace('/screens/student/login');
        return;
      }

      // Use localhost for development
      const socketUrl = 'http://localhost:3000';
      console.log('[Chat] Creating socket connection to:', socketUrl);
      
      if (socketRef.current?.connected) {
        console.log('[Chat] Disconnecting existing socket');
        socketRef.current.disconnect();
      }

      socketRef.current = io(socketUrl, {
        path: '/socket.io',
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
        query: { 
          roomId: id,
          userType: 'STUDENT'
        }
      });

      // Enhanced connection handling
      socketRef.current.on('connect', () => {
        console.log('[Chat] Socket connected successfully. Socket ID:', socketRef.current.id);
        setIsConnecting(false);
        setError(null);
        
        // Join room with proper data structure
        const joinData = {
          roomId: id,
          userType: 'STUDENT',
          userId: student?.TenantID,
          userName: student?.FullName
        };
        
        console.log('[Chat] Joining room with data:', joinData);
        socketRef.current.emit('join_room', joinData);
      });

      // Handle room join confirmation
      socketRef.current.on('room_joined', (data) => {
        console.log('[Chat] Successfully joined room:', data);
        setError(null);
      });

      // Handle room join error
      socketRef.current.on('room_join_error', (error) => {
        console.error('[Chat] Error joining room:', error);
        setError('Failed to join chat room: ' + error.message);
      });

      socketRef.current.on('connect_error', async (err) => {
        console.error('[Chat] Socket connection error:', err.message);
        
        if (err.message.includes('authentication') || err.message.includes('jwt')) {
          try {
            // Try to get a new token from the server
            const response = await api.post('/api/student/auth/refresh', {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data?.success && response.data?.token) {
              await AsyncStorage.setItem('student_token', response.data.token);
              // Retry connection with new token
              console.log('[Chat] Token refreshed, retrying connection');
              initializeSocket();
            } else {
              console.log('[Chat] Token refresh failed, redirecting to login');
              router.replace('/screens/student/login');
            }
          } catch (refreshError) {
            console.error('[Chat] Token refresh failed:', refreshError);
            router.replace('/screens/student/login');
          }
        } else {
          console.error('[Chat] Non-auth socket error:', err.message);
          setError(`Failed to connect to chat server: ${err.message}`);
          setIsConnecting(false);
        }
      });

      socketRef.current.on('disconnect', async (reason) => {
        console.log('[Chat] Socket disconnected. Reason:', reason);
        setIsConnecting(true);
        
        if (reason === 'io server disconnect' || reason === 'transport close') {
          try {
            // Try to get a new token from the server
            const response = await api.post('/api/student/auth/refresh', {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data?.success && response.data?.token) {
              await AsyncStorage.setItem('student_token', response.data.token);
              // Retry connection with new token
              console.log('[Chat] Token refreshed after disconnect, retrying connection');
              initializeSocket();
            } else {
              console.log('[Chat] Token refresh failed after disconnect, redirecting to login');
              router.replace('/screens/student/login');
            }
          } catch (refreshError) {
            console.error('[Chat] Token refresh failed after disconnect:', refreshError);
            router.replace('/screens/student/login');
          }
        }
      });

      socketRef.current.on('error', (err) => {
        console.error('[Chat] Socket error:', err);
        setError(`Chat server error: ${err.message || 'Unknown error'}`);
      });

      socketRef.current.on('new_message', (newMessage) => {
        console.log('[Chat] Received new message:', newMessage.MessageID);
        setMessages(prev => [newMessage, ...prev]);
        if (scrollViewRef.current) {
          scrollToBottom();
        }
      });

      socketRef.current.on('typing_start', (data) => {
        if (data.userId !== student?.TenantID) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      socketRef.current.on('typing_end', (data) => {
        if (data.userId !== student?.TenantID) {
          setIsTyping(false);
        }
      });
    } catch (err: any) {
      console.error('[Chat] Error initializing socket:', err);
      setError(`Failed to initialize chat: ${err.message}`);
      setIsConnecting(false);
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
        // ... voice message handling code ...
      } else {
        // Create message object
        const messageData = {
          roomId: id,
          content: message.trim(),
          type: 'TEXT',
          senderType: 'STUDENT',
          senderId: student?.TenantID,
          senderName: student?.FullName || 'Student'
        };

        // Add message to local state immediately for instant feedback
        const newMessage: Message = {
          MessageID: Date.now(),
          Content: message.trim(),
          Type: 'TEXT',
          CreatedAt: new Date().toISOString(),
          SenderType: 'STUDENT',
          SenderID: student?.TenantID || 0,
          SenderName: student?.FullName || 'Student',
          ReadCount: 0,
          Reactions: []
        };

        // Update UI immediately
        setMessages(prev => [...prev, newMessage]);
        setMessage('');

        console.log('[Chat] Sending message:', messageData);
        socketRef.current?.emit('new_message', messageData, (response: any) => {
          if (response?.error) {
            console.error('[Chat] Error sending message:', response.error);
            setError('Failed to send message');
            // Remove the message from local state if failed
            setMessages(prev => prev.filter(msg => msg.MessageID !== newMessage.MessageID));
          } else {
            console.log('[Chat] Message sent successfully:', response);
            // Update the temporary message with server data if needed
            if (response.messageId) {
              setMessages(prev => prev.map(msg => 
                msg.MessageID === newMessage.MessageID 
                  ? { ...msg, MessageID: response.messageId }
                  : msg
              ));
            }
          }
        });

        // Emit typing end
        socketRef.current?.emit('typing_end', { roomId: id });
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

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.SenderType === 'STUDENT' && message.SenderID === student?.TenantID;
    const showSenderInfo = index === 0 || 
      messages[index - 1]?.SenderID !== message.SenderID ||
      messages[index - 1]?.SenderType !== message.SenderType;
    
    const messageTime = format(new Date(message.CreatedAt), 'h:mm a');

    return (
      <Animated.View
        key={message.MessageID}
        entering={isOwnMessage ? SlideInRight : FadeIn}
        exiting={isOwnMessage ? SlideOutLeft : FadeOut}
        style={[
          styles.messageWrapper,
          isOwnMessage ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
          { marginVertical: 2, maxWidth: '80%', alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' }
        ]}
      >
        {!isOwnMessage && showSenderInfo && (
          <Avatar.Text 
            size={28} 
            label={message.SenderName.substring(0, 2).toUpperCase()}
            style={[styles.avatar, { marginBottom: 4 }]}
          />
        )}
        
        <View style={[styles.messageContentWrapper, { maxWidth: '100%' }]}>
          {!isOwnMessage && showSenderInfo && (
            <Text style={{ 
              color: theme?.colors?.primary,
              fontSize: 12,
              marginBottom: 2,
              marginLeft: 8
            }}>
              {message.SenderName}
            </Text>
          )}
          
          <Surface
            style={[
              styles.messageContainer,
              isOwnMessage ? styles.ownMessage : styles.otherMessage,
              { 
                backgroundColor: isOwnMessage ? 
                  theme?.colors?.primary : 
                  theme?.dark ? `${theme?.colors?.surface}80` : '#F8F9FA',
                paddingVertical: 6,
                paddingHorizontal: 12,
                marginHorizontal: isOwnMessage ? 4 : 8
              }
            ]}
          >
            {message.Type === 'IMAGE' && message.MediaURL && (
              <Image
                source={{ uri: message.MediaURL }}
                style={[styles.messageImage, { borderRadius: 8, marginBottom: 4 }]}
                resizeMode="cover"
              />
            )}
            
            <Text style={[
              styles.messageText,
              { 
                color: isOwnMessage ? '#FFFFFF' : theme?.colors?.text,
                fontSize: 14,
                lineHeight: 20
              }
            ]}>
              {message.Content}
            </Text>

            <Text style={[
              styles.timestamp,
              { 
                color: isOwnMessage ? 'rgba(255,255,255,0.7)' : `${theme?.colors?.onSurface}60`,
                fontSize: 10,
                alignSelf: 'flex-end',
                marginTop: 2
              }
            ]}>
              {messageTime}
            </Text>
          </Surface>

          {message.Reactions && message.Reactions.length > 0 && (
            <View style={[styles.reactions, { marginTop: 2, marginLeft: 8 }]}>
              {message.Reactions.map((reaction, index) => (
                <Chip
                  key={`${reaction.Emoji}-${index}`}
                  style={[styles.reactionChip, {
                    backgroundColor: reaction.UserReacted ? 
                      `${theme?.colors?.primary}20` : 
                      theme?.dark ? `${theme?.colors?.surface}50` : '#F0F0F0',
                    height: 20,
                    paddingHorizontal: 6
                  }]}
                  textStyle={{
                    color: theme?.colors?.onSurface,
                    fontSize: 10
                  }}
                >
                  {`${reaction.Emoji} ${reaction.Count}`}
                </Chip>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  // Update socket event handlers
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('new_message', (receivedMessage: Message) => {
        console.log('[Chat] Received new message:', receivedMessage);
        setMessages(prev => {
          const messageExists = prev.some(msg => 
            msg.MessageID === receivedMessage.MessageID || 
            (msg.Content === receivedMessage.Content && 
             msg.CreatedAt === receivedMessage.CreatedAt)
          );
          if (!messageExists) {
            return [...prev, receivedMessage];
          }
          return prev;
        });
      });

      socketRef.current.on('message_error', (error: any) => {
        console.error('[Chat] Message error:', error);
        setError('Error with message: ' + error.message);
      });

      return () => {
        socketRef.current?.off('new_message');
        socketRef.current?.off('message_error');
      };
    }
  }, [socketRef.current]);

  // Update the messages state when receiving initial messages
  useEffect(() => {
    if (messages.length > 0) {
      console.log('[Chat] Messages updated:', messages.length, 'messages');
    }
  }, [messages]);

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
            style={styles.loadingContainer}
          >
            <Surface style={[styles.loadingCard, {
              backgroundColor: theme?.dark ? theme?.colors?.surface : '#FFFFFF',
              borderColor: `${theme?.colors?.primary}20`,
            }]}>
              <View style={styles.loadingContent}>
                <Animated.View
                  entering={FadeIn}
                  style={styles.loadingIconContainer}
                >
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={i}
                      entering={FadeIn.delay(i * 200)}
                      style={[styles.loadingDot, {
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
                <Text style={[styles.loadingText, { color: theme?.colors?.primary }]}>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme?.colors?.error, marginBottom: 16 }}>{error}</Text>
          <Button mode="contained" onPress={() => initializeSocket()}>
            Retry Connection
          </Button>
        </View>
      </StudentDashboardLayout>
    );
  }

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
            flexDirection: 'column-reverse'
          }]}
          style={{ flex: 1 }}
          inverted={false}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme?.colors?.primary} />
            </View>
          )}
          {messages.slice().reverse().map((msg, index, array) => renderMessage(msg, array.length - 1 - index))}
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
              onPress={() => setShowReactions(true)}
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
              onChangeText={handleTyping}
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
                  onPress={() => setIsRecording(!isRecording)}
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
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  },
}); 