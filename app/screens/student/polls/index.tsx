import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { 
  Surface, 
  Text, 
  FAB, 
  Card, 
  Button, 
  IconButton, 
  ProgressBar,
  Avatar,
  Chip,
  Portal,
  Modal
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { router } from 'expo-router';

interface PollOption {
  id: number;
  text: string;
  imageUrl?: string;
  votes: number;
}

interface Poll {
  id: number;
  title: string;
  caption: string;
  options: PollOption[];
  totalVotes: number;
  createdBy: string;
  createdAt: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  hasVoted?: boolean;
  yourVote?: number;
}

// Dummy data
const polls: Poll[] = [
  {
    id: 1,
    title: "Weekend Movie Night Pick",
    caption: "Let's choose this weekend's movie!",
    options: [
      { id: 1, text: "Inception", votes: 5 },
      { id: 2, text: "The Matrix", votes: 3 },
      { id: 3, text: "Interstellar", votes: 4 }
    ],
    totalVotes: 12,
    createdBy: "John D.",
    createdAt: "2h ago",
    likes: 8,
    comments: 3
  },
  {
    id: 2,
    title: "Dinner Menu Preference",
    caption: "Vote for tomorrow's special dinner",
    options: [
      { 
        id: 1, 
        text: "Pizza Night", 
        imageUrl: "https://example.com/pizza.jpg",
        votes: 7 
      },
      { 
        id: 2, 
        text: "Chinese Feast", 
        imageUrl: "https://example.com/chinese.jpg",
        votes: 4 
      }
    ],
    totalVotes: 11,
    createdBy: "Mike R.",
    createdAt: "5h ago",
    imageUrl: "https://example.com/food.jpg",
    likes: 15,
    comments: 6
  }
];

export default function PollsScreen() {
  const { theme } = useTheme();
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  const handleVote = (pollId: number, optionId: number) => {
    // Handle voting logic
  };

  const renderPollCard = (poll: Poll) => (
    <Card 
      key={poll.id} 
      style={[styles.pollCard, { backgroundColor: theme?.colors?.surface }]}
      mode="elevated"
    >
      <Card.Content>
        <View style={styles.pollHeader}>
          <View style={styles.pollCreator}>
            <Avatar.Text 
              size={36} 
              label={poll.createdBy.substring(0, 2)}
              style={{ backgroundColor: theme?.colors?.primary + '20' }}
              labelStyle={{ color: theme?.colors?.primary }}
            />
            <View style={styles.pollCreatorInfo}>
              <Text style={[styles.pollCreatorName, { color: theme?.colors?.onSurface }]}>
                {poll.createdBy}
              </Text>
              <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
                {poll.createdAt}
              </Text>
            </View>
          </View>
          <IconButton 
            icon="dots-vertical" 
            size={20}
            onPress={() => {}}
          />
        </View>

        <Text style={[styles.pollTitle, { color: theme?.colors?.onSurface }]}>
          {poll.title}
        </Text>
        <Text style={[styles.pollCaption, { color: theme?.colors?.onSurfaceVariant }]}>
          {poll.caption}
        </Text>

        {poll.imageUrl && (
          <Image 
            source={{ uri: poll.imageUrl }}
            style={styles.pollImage}
          />
        )}

        <View style={styles.pollOptions}>
          {poll.options.map(option => (
            <Surface 
              key={option.id}
              style={[
                styles.optionCard,
                { 
                  backgroundColor: poll.yourVote === option.id ? 
                    theme?.colors?.primaryContainer : 
                    theme?.colors?.surfaceVariant 
                }
              ]}
            >
              {option.imageUrl && (
                <Image 
                  source={{ uri: option.imageUrl }}
                  style={styles.optionImage}
                />
              )}
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  { color: theme?.colors?.onSurface }
                ]}>
                  {option.text}
                </Text>
                <ProgressBar
                  progress={option.votes / poll.totalVotes}
                  color={theme?.colors?.primary}
                  style={styles.optionProgress}
                />
                <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
                  {option.votes} votes
                </Text>
              </View>
              <Button
                mode={poll.yourVote === option.id ? "contained" : "outlined"}
                onPress={() => handleVote(poll.id, option.id)}
                style={styles.voteButton}
              >
                {poll.yourVote === option.id ? "Voted" : "Vote"}
              </Button>
            </Surface>
          ))}
        </View>

        <View style={styles.pollFooter}>
          <View style={styles.pollStats}>
            <IconButton 
              icon={poll.hasVoted ? "thumb-up" : "thumb-up-outline"}
              size={20}
              onPress={() => {}}
            />
            <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
              {poll.likes}
            </Text>
            <IconButton 
              icon="comment-outline"
              size={20}
              onPress={() => {}}
            />
            <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
              {poll.comments}
            </Text>
          </View>
          <Chip icon="account-group">
            {poll.totalVotes} votes
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <DashboardLayout
      title="Community Polls"
      subtitle="Vote and create polls"
    >
      <ScrollView style={styles.container}>
        {polls.map(renderPollCard)}
      </ScrollView>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme?.colors?.primary }]}
        onPress={() => router.push('/screens/student/polls/create')}
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pollCard: {
    margin: 16,
    borderRadius: 20,
    elevation: 4,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pollCreatorInfo: {
    gap: 2,
  },
  pollCreatorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pollCaption: {
    fontSize: 14,
    marginBottom: 12,
  },
  pollImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  pollOptions: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  optionImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionProgress: {
    height: 4,
    borderRadius: 2,
  },
  voteButton: {
    borderRadius: 20,
  },
  pollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pollStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 16,
  },
}); 