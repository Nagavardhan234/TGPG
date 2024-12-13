import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Card, Checkbox, Button, Avatar, ProgressBar, Chip } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

// Dummy data
const tasks = [
  { id: 1, task: 'Room Cleaning', assignee: 'John', dueDate: 'Today', status: 'pending' },
  { id: 2, task: 'Laundry', assignee: 'Mike', dueDate: 'Tomorrow', status: 'completed' },
  { id: 3, task: 'Meal Prep', assignee: 'You', dueDate: 'Today', status: 'pending' },
];

const polls = [
  {
    id: 1,
    question: 'What to order for dinner?',
    options: [
      { id: 1, text: 'Pizza', votes: 2 },
      { id: 2, text: 'Chinese', votes: 1 },
      { id: 3, text: 'Indian', votes: 0 },
    ],
    totalVotes: 3,
  },
];

const roommates = [
  { id: 1, name: 'John Doe', avatar: 'JD', room: '101A' },
  { id: 2, name: 'Mike Smith', avatar: 'MS', room: '101B' },
  { id: 3, name: 'Alex Johnson', avatar: 'AJ', room: '101C' },
];

export default function RoommatesScreen() {
  const { theme } = useTheme();
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [votedOption, setVotedOption] = useState<number | null>(null);

  const handleVote = (pollId: number, optionId: number) => {
    setVotedOption(optionId);
    // Add API call here
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Roommates List */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Your Roommates</Text>
        <View style={styles.roommatesList}>
          {roommates.map(roommate => (
            <Card key={roommate.id} style={styles.roommateCard}>
              <Card.Content style={styles.roommateContent}>
                <Avatar.Text 
                  size={40} 
                  label={roommate.avatar}
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <View style={styles.roommateInfo}>
                  <Text style={{ color: theme.colors.text }}>{roommate.name}</Text>
                  <Text style={{ color: theme.colors.secondary }}>Room {roommate.room}</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </Surface>

      {/* Tasks Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Shared Tasks</Text>
        {tasks.map(task => (
          <Card key={task.id} style={styles.taskCard}>
            <Card.Content>
              <View style={styles.taskHeader}>
                <Checkbox
                  status={task.status === 'completed' ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedTask(task.id)}
                />
                <View style={styles.taskInfo}>
                  <Text style={{ color: theme.colors.text }}>{task.task}</Text>
                  <Text style={{ color: theme.colors.secondary }}>
                    Assigned to: {task.assignee} • Due: {task.dueDate}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </Surface>

      {/* Polls Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Active Polls</Text>
        {polls.map(poll => (
          <Card key={poll.id} style={styles.pollCard}>
            <Card.Content>
              <Text style={[styles.pollQuestion, { color: theme.colors.text }]}>
                {poll.question}
              </Text>
              <View style={styles.pollOptions}>
                {poll.options.map(option => (
                  <View key={option.id} style={styles.pollOption}>
                    <View style={styles.pollProgress}>
                      <ProgressBar
                        progress={option.votes / poll.totalVotes}
                        color={theme.colors.primary}
                        style={styles.progressBar}
                      />
                      <Text style={{ color: theme.colors.text }}>
                        {option.text} ({option.votes} votes)
                      </Text>
                    </View>
                    <Button
                      mode={votedOption === option.id ? 'contained' : 'outlined'}
                      onPress={() => handleVote(poll.id, option.id)}
                      disabled={votedOption !== null}
                    >
                      Vote
                    </Button>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        ))}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  roommatesList: {
    gap: 12,
  },
  roommateCard: {
    marginBottom: 8,
  },
  roommateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roommateInfo: {
    flex: 1,
  },
  taskCard: {
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskInfo: {
    flex: 1,
  },
  pollCard: {
    marginBottom: 8,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  pollOptions: {
    gap: 12,
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pollProgress: {
    flex: 1,
    gap: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
}); 