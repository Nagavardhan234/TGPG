import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Chip, Card, IconButton, SegmentedButtons } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

interface Message {
  id: number;
  title: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'notice' | 'announcement' | 'general';
  isRead: boolean;
  isUrgent?: boolean;
}

// Dummy data
const messages: Message[] = [
  {
    id: 1,
    title: 'Monthly Rent Reminder',
    content: 'Your rent payment is due in 3 days. Please ensure timely payment.',
    sender: 'Manager',
    timestamp: '2024-03-15 10:30 AM',
    type: 'notice',
    isRead: false,
    isUrgent: true,
  },
  {
    id: 2,
    title: 'Weekend PG Event',
    content: 'Join us for a movie night this Saturday at 8 PM in the common area.',
    sender: 'Admin',
    timestamp: '2024-03-14 02:15 PM',
    type: 'announcement',
    isRead: true,
  },
  {
    id: 3,
    title: 'Maintenance Update',
    content: 'Water heater maintenance scheduled for tomorrow morning.',
    sender: 'Maintenance',
    timestamp: '2024-03-13 11:45 AM',
    type: 'general',
    isRead: true,
  },
];

type MessageType = 'all' | 'notices' | 'announcements';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<MessageType>('all');
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);

  const filteredMessages = messages.filter(message => {
    if (selectedType === 'all') return true;
    if (selectedType === 'notices') return message.type === 'notice';
    if (selectedType === 'announcements') return message.type === 'announcement';
    return true;
  });

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'notice':
        return 'alert-circle';
      case 'announcement':
        return 'bullhorn';
      default:
        return 'email';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Message Filters */}
      <Surface style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
        <SegmentedButtons
          value={selectedType}
          onValueChange={value => setSelectedType(value as MessageType)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'notices', label: 'Notices' },
            { value: 'announcements', label: 'Announcements' },
          ]}
          style={styles.segmentedButtons}
        />
      </Surface>

      {/* Messages List */}
      <View style={styles.messagesList}>
        {filteredMessages.map(message => (
          <Surface 
            key={message.id} 
            style={[
              styles.messageCard,
              { backgroundColor: theme.colors.surface },
              !message.isRead && styles.unreadMessage
            ]}
          >
            <Card>
              <Card.Content>
                <View style={styles.messageHeader}>
                  <View style={styles.messageHeaderLeft}>
                    <IconButton
                      icon={getMessageIcon(message.type)}
                      size={24}
                      iconColor={message.isUrgent ? theme.colors.error : theme.colors.primary}
                    />
                    <View>
                      <Text style={[styles.messageTitle, { color: theme.colors.text }]}>
                        {message.title}
                      </Text>
                      <Text style={{ color: theme.colors.secondary }}>
                        {message.sender} • {message.timestamp}
                      </Text>
                    </View>
                  </View>
                  {message.isUrgent && (
                    <Chip 
                      mode="flat" 
                      textStyle={{ color: theme.colors.surface }}
                      style={{ backgroundColor: theme.colors.error }}
                    >
                      Urgent
                    </Chip>
                  )}
                </View>
                
                {(expandedMessage === message.id) && (
                  <Text style={[styles.messageContent, { color: theme.colors.text }]}>
                    {message.content}
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                <IconButton
                  icon={expandedMessage === message.id ? 'chevron-up' : 'chevron-down'}
                  onPress={() => setExpandedMessage(
                    expandedMessage === message.id ? null : message.id
                  )}
                />
              </Card.Actions>
            </Card>
          </Surface>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    padding: 16,
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageCard: {
    borderRadius: 12,
    elevation: 2,
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageContent: {
    marginTop: 12,
    lineHeight: 20,
  },
}); 