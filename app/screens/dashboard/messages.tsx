import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Title, FAB, Searchbar, Divider } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { NetworkErrorView } from '@/app/components/NetworkErrorView';
import { PageLoader } from '@/app/components/PageLoader';
import api from '@/app/services/api';

interface Message {
  id: number;
  sender: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export default function Messages() {
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
    return <PageLoader message="Loading messages..." />;
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
      <Title style={[styles.title, { color: theme.colors.text }]}>Messages</Title>

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

      {filteredMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <List.Icon icon="message-outline" color={theme.colors.primary} />
          <Title style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {searchQuery ? 'No matching messages found' : 'No messages yet'}
          </Title>
        </View>
      ) : (
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
              />
              {index < filteredMessages.length - 1 && (
                <Divider style={{ backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0' }} />
              )}
            </React.Fragment>
          ))}
        </List.Section>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
        label="New Message"
      />
    </View>
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
}); 