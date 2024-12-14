import React, { useState } from 'react';
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
  Divider
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router } from 'expo-router';

interface ChatRoom {
  id: number;
  name: string;
  type: 'roommate' | 'pg' | 'manager' | 'everyone';
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
  participants?: string[];
  isPinned?: boolean;
}

// Dummy data
const chatRooms: ChatRoom[] = [
  {
    id: 1,
    name: "Room 301 Group",
    type: "roommate",
    lastMessage: "Don't forget to clean the common area!",
    timestamp: "2m ago",
    unreadCount: 3,
    participants: ["John", "Mike", "Sarah"],
    isPinned: true
  },
  {
    id: 2,
    name: "PG Manager",
    type: "manager",
    lastMessage: "Monthly inspection tomorrow at 10 AM",
    timestamp: "1h ago",
    unreadCount: 1,
    isOnline: true
  },
  {
    id: 3,
    name: "PG Community",
    type: "pg",
    lastMessage: "Movie night this weekend!",
    timestamp: "3h ago",
    unreadCount: 0
  }
];

export default function MessagesScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ChatRoom['type'] | 'all'>('all');

  const filterTypes: { value: ChatRoom['type'] | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'message-text' },
    { value: 'roommate', label: 'Roommates', icon: 'account-group' },
    { value: 'pg', label: 'PG', icon: 'home-group' },
    { value: 'manager', label: 'Manager', icon: 'shield-account' },
    { value: 'everyone', label: 'Everyone', icon: 'earth' },
  ];

  const filteredChats = chatRooms
    .filter(chat => selectedType === 'all' || chat.type === selectedType)
    .filter(chat => 
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const renderChatRoom = (chat: ChatRoom) => (
    <TouchableRipple
      key={chat.id}
      onPress={() => router.push(`/screens/student/messages/chat/${chat.id}`)}
      style={styles.chatRoomButton}
    >
      <Surface style={[styles.chatRoom, { backgroundColor: theme?.colors?.surface }]}>
        <View style={styles.chatRoomLeft}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={50}
              label={chat.name.substring(0, 2)}
              style={{ backgroundColor: theme?.colors?.primary + '20' }}
            />
            {chat.isOnline && (
              <View style={[styles.onlineIndicator, { backgroundColor: theme?.colors?.primary }]} />
            )}
          </View>
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={[styles.chatName, { color: theme?.colors?.onSurface }]}>
                {chat.name}
              </Text>
              {chat.isPinned && (
                <IconButton icon="pin" size={16} iconColor={theme?.colors?.primary} />
              )}
            </View>
            <Text 
              numberOfLines={1} 
              style={[
                styles.lastMessage, 
                { color: chat.unreadCount > 0 ? theme?.colors?.onSurface : theme?.colors?.onSurfaceVariant }
              ]}
            >
              {chat.lastMessage}
            </Text>
            {chat.participants && (
              <View style={styles.participants}>
                {chat.participants.map((participant, index) => (
                  <Avatar.Text
                    key={index}
                    size={20}
                    label={participant.substring(0, 1)}
                    style={[
                      styles.participantAvatar,
                      { backgroundColor: theme?.colors?.primaryContainer }
                    ]}
                    labelStyle={{ fontSize: 10, color: theme?.colors?.primary }}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={styles.chatRoomRight}>
          <Text style={{ color: theme?.colors?.onSurfaceVariant, fontSize: 12 }}>
            {chat.timestamp}
          </Text>
          {chat.unreadCount > 0 && (
            <Badge
              size={20}
              style={[styles.unreadBadge, { backgroundColor: theme?.colors?.primary }]}
            >
              {chat.unreadCount}
            </Badge>
          )}
        </View>
      </Surface>
    </TouchableRipple>
  );

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
            <React.Fragment key={chat.id}>
              {renderChatRoom(chat)}
              {index < filteredChats.length - 1 && <Divider />}
            </React.Fragment>
          ))}
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
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 4,
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
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
}); 