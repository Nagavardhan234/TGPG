import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Title, FAB, Searchbar, Divider } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { NetworkErrorView } from '@/app/components/NetworkErrorView';
import { PageLoader } from '@/app/components/PageLoader';
import { SkeletonLayouts } from '@/app/components/Skeleton';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import { AccessibilityWrapper } from '@/app/components/AccessibilityWrapper';
import api from '@/app/services/api';

interface Message {
  id: number;
  sender: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
}

const MessagesContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, isDarkMode } = useTheme();
  const { pg } = useAuth();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!pg?.PGID) {
        throw new Error('PG information not found');
      }

      const response = await api.get(`/api/messages/pg/${pg.PGID}/all`);
      
      if (response.data.success) {
        setMessages(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load messages');
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setError(error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Title style={[styles.title, { color: theme.colors.text }]}>Messages</Title>
        <Searchbar
          placeholder="Search messages..."
          value=""
          onChangeText={() => {}}
          style={styles.searchBar}
          disabled
        />
        {[...Array(5)].map((_, index) => (
          <View key={index} style={styles.skeletonContainer}>
            <SkeletonLayouts.ListItem />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <NetworkErrorView
        message={error}
        onRetry={loadMessages}
        showAnimation={false}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
      <AccessibilityWrapper
        accessibilityRole="header"
        accessibilityLabel="Messages"
      >
        <Title style={[styles.title, { color: theme.colors.text }]}>Messages</Title>
      </AccessibilityWrapper>

      <AccessibilityWrapper
        accessibilityRole="search"
        accessibilityLabel="Search messages"
        accessibilityHint="Enter text to filter messages"
      >
        <Searchbar
          placeholder="Search messages..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
          }]}
          iconColor={theme.colors.text}
          placeholderTextColor={theme.colors.text}
          inputStyle={{ color: theme.colors.text }}
        />
      </AccessibilityWrapper>

      {filteredMessages.length === 0 ? (
        <AccessibilityWrapper
          accessibilityRole="text"
          accessibilityLabel={searchQuery ? 'No matching messages found' : 'No messages yet'}
        >
          <View style={styles.emptyContainer}>
            <List.Icon icon="message-outline" color={theme.colors.primary} />
            <Title style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'No matching messages found' : 'No messages yet'}
            </Title>
          </View>
        </AccessibilityWrapper>
      ) : (
        <AccessibilityWrapper
          accessibilityRole="list"
          accessibilityLabel="Messages list"
        >
          <List.Section>
            {filteredMessages.map((message, index) => (
              <React.Fragment key={message.id}>
                <List.Item
                  title={message.sender}
                  description={message.subject}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon={message.read ? "message-text" : "message-text-outline"} 
                      color={theme.colors.text} 
                    />
                  )}
                  right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.text} />}
                  titleStyle={{ color: theme.colors.text }}
                  descriptionStyle={{ color: theme.colors.textSecondary }}
                  onPress={() => {/* Handle message press */}}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Message from ${message.sender}: ${message.subject}`}
                  accessibilityHint={message.read ? "Message has been read" : "New message"}
                  accessibilityState={{ selected: message.read }}
                />
                {index < filteredMessages.length - 1 && (
                  <Divider style={{ backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0' }} />
                )}
              </React.Fragment>
            ))}
          </List.Section>
        </AccessibilityWrapper>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
        label="New Message"
        accessible={true}
        accessibilityLabel="Create new message"
        accessibilityRole="button"
      />
    </View>
  );
}

export default function Messages() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Messages error:', error, errorInfo);
      }}
      fallback={
        <NetworkErrorView
          message="Something went wrong while loading messages"
          onRetry={() => window.location.reload()}
          showAnimation={false}
        />
      }
    >
      <MessagesContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  skeletonContainer: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
}); 