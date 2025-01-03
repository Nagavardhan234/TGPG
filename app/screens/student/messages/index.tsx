import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  IconButton, 
  Searchbar,
  Chip,
  FAB,
  TouchableRipple,
  Badge,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router } from 'expo-router';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import api from '@/app/config/axios.config';
import { formatDistanceToNow } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatRoom {
  ChatRoomID: number;
  Name: string;
  Type: string;
  LastMessage: string;
  LastMessageAt: string;
  UnreadCount: number;
  IsActive: boolean;
  IsPinned: boolean;
  CreatedAt: string;
  LastActivityAt: string;
}

export default function MessagesScreen() {
  const { theme } = useTheme();
  const { isAuthenticated, student } = useStudentAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterTypes = [
    { value: 'all', label: 'All', icon: 'message-text' },
    { value: 'ROOM', label: 'Roommates', icon: 'account-group' },
    { value: 'COMMUNITY', label: 'PG', icon: 'home-group' },
    { value: 'MANAGER', label: 'Manager', icon: 'shield-account' }
  ];

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      
      // Log student auth state
      const studentToken = await AsyncStorage.getItem('student_token');
      console.log('Auth State:', {
        isAuthenticated,
        studentToken,
        student,
        pgId: student?.pgId
      });
      
      if (!student?.pgId) {
        console.log('Missing pgId:', { student });
        setError('Please log in to view messages');
        setLoading(false);
        return;
      }

      console.log('Fetching chat rooms for PG:', student.pgId);
      const response = await api.get(`/api/messages/pg/${student.pgId}/rooms`);
      console.log('API Response:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });
      
      if (response.data.success) {
        console.log('Chat rooms fetched:', response.data.data);
        setChatRooms(response.data.data);
      } else {
        console.error('Failed to fetch chat rooms:', response.data);
        setError('Failed to fetch chat rooms');
      }
    } catch (err: any) {
      console.error('Error fetching chat rooms:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        headers: err.config?.headers,
        stack: err.stack
      });
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(`Error fetching chat rooms: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chatRooms
    .filter(chat => selectedType === 'all' || chat.Type === selectedType)
    .filter(chat => 
      chat.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.LastMessage && chat.LastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const renderChatRoom = (chat: ChatRoom) => (
    <TouchableRipple
      key={chat.ChatRoomID}
      onPress={() => router.push({
        pathname: '/screens/student/messages/chat/[id]',
        params: { id: chat.ChatRoomID }
      })}
      style={styles.chatRoomButton}
    >
      <Surface style={[styles.chatRoom, { backgroundColor: theme?.colors?.surface }]}>
        <View style={styles.chatRoomLeft}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={50}
              label={chat.Name.substring(0, 2)}
              style={{ backgroundColor: theme?.colors?.primary + '20' }}
            />
            {chat.IsActive && (
              <View style={[styles.onlineIndicator, { backgroundColor: theme?.colors?.primary }]} />
            )}
          </View>
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={[styles.chatName, { color: theme?.colors?.onSurface }]}>
                {chat.Name}
              </Text>
              {chat.IsPinned && (
                <IconButton icon="pin" size={16} iconColor={theme?.colors?.primary} />
              )}
            </View>
            <Text 
              numberOfLines={1} 
              style={[
                styles.lastMessage, 
                { color: chat.UnreadCount > 0 ? theme?.colors?.onSurface : theme?.colors?.onSurfaceVariant }
              ]}
            >
              {chat.LastMessage || 'No messages yet'}
            </Text>
          </View>
        </View>
        <View style={styles.chatRoomRight}>
          <Text style={{ color: theme?.colors?.onSurfaceVariant, fontSize: 12 }}>
            {formatTimestamp(chat.LastMessageAt)}
          </Text>
          {chat.UnreadCount > 0 && (
            <Badge
              size={20}
              style={[styles.unreadBadge, { backgroundColor: theme?.colors?.primary }]}
            >
              {chat.UnreadCount}
            </Badge>
          )}
        </View>
      </Surface>
    </TouchableRipple>
  );

  if (loading) {
    return (
      <StudentDashboardLayout title="Messages">
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme?.colors?.primary} />
        </View>
      </StudentDashboardLayout>
    );
  }

  if (error) {
    return (
      <StudentDashboardLayout title="Messages">
        <View style={[styles.container, styles.centerContent]}>
          <Text style={{ color: theme?.colors?.error }}>{error}</Text>
        </View>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout title="Messages">
      <View style={styles.container}>
        <Surface style={[styles.header, { backgroundColor: theme?.colors?.surface }]}>
          <Searchbar
            placeholder="Search messages..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {filterTypes.map(type => (
              <Chip
                key={type.value}
                selected={selectedType === type.value}
                onPress={() => setSelectedType(type.value)}
                icon={type.icon}
                style={styles.filterChip}
                mode="outlined"
              >
                {type.label}
              </Chip>
            ))}
          </ScrollView>
        </Surface>

        <ScrollView>
          {filteredChats.map((chat, index) => (
            <React.Fragment key={chat.ChatRoomID}>
              {renderChatRoom(chat)}
              {index < filteredChats.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {filteredChats.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
                No chat rooms found
              </Text>
            </View>
          )}
        </ScrollView>

        <FAB
          icon="message-plus"
          label="New Chat"
          style={[styles.fab, { backgroundColor: theme?.colors?.primary }]}
          onPress={() => {/* Handle new chat */}}
        />
      </View>
    </StudentDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 4,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  chatRoomButton: {
    backgroundColor: 'transparent',
  },
  chatRoom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  chatRoomLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  chatInfo: {
    marginLeft: 12,
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  participants: {
    flexDirection: 'row',
    marginTop: 8,
  },
  participantAvatar: {
    marginRight: -6,
  },
  chatRoomRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  unreadBadge: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
}); 