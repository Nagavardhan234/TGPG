import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Surface, Text, Card, Avatar, Button, ProgressBar, Chip, IconButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

// Types
interface Game {
  id: number;
  title: string;
  description: string;
  icon: string;
  participants: number;
  yourScore?: number;
  maxScore: number;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  isYou?: boolean;
}

// Dummy data
const games: Game[] = [
  {
    id: 1,
    title: 'Room Cleanup Race',
    description: 'Complete daily cleanup tasks to earn points!',
    icon: 'broom',
    participants: 12,
    yourScore: 85,
    maxScore: 100,
  },
  {
    id: 2,
    title: 'Energy Saver',
    description: 'Save electricity and win rewards',
    icon: 'lightbulb',
    participants: 8,
    yourScore: 60,
    maxScore: 100,
  },
  {
    id: 3,
    title: 'Water Guardian',
    description: 'Help conserve water in the PG',
    icon: 'water',
    participants: 15,
    yourScore: 90,
    maxScore: 100,
  },
];

const leaderboard: LeaderboardEntry[] = [
  { id: 1, name: 'Alex Smith', avatar: 'AS', score: 950, rank: 1 },
  { id: 2, name: 'You', avatar: 'YO', score: 850, rank: 2, isYou: true },
  { id: 3, name: 'John Doe', avatar: 'JD', score: 800, rank: 3 },
  { id: 4, name: 'Mike Johnson', avatar: 'MJ', score: 750, rank: 4 },
];

const achievements = [
  { id: 1, title: 'Early Bird', icon: 'star', description: 'First to complete morning tasks', unlocked: true },
  { id: 2, title: 'Power Saver', icon: 'flash', description: 'Saved 20% electricity this month', unlocked: true },
  { id: 3, title: 'Team Player', icon: 'account-group', description: 'Helped 5 roommates', unlocked: false },
];

export default function GamesScreen() {
  const { theme } = useTheme();
  const { width } = Dimensions.get('window');
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Games Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Active Games</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.gamesRow}>
            {games.map(game => (
              <Card key={game.id} style={[styles.gameCard, { width: width * 0.7 }]}>
                <Card.Content>
                  <View style={styles.gameHeader}>
                    <IconButton icon={game.icon} size={32} iconColor={theme.colors.primary} />
                    <Chip>{game.participants} playing</Chip>
                  </View>
                  <Text style={[styles.gameTitle, { color: theme.colors.text }]}>{game.title}</Text>
                  <Text style={{ color: theme.colors.secondary }}>{game.description}</Text>
                  {game.yourScore && (
                    <View style={styles.scoreContainer}>
                      <Text style={{ color: theme.colors.text }}>Your Score</Text>
                      <ProgressBar 
                        progress={game.yourScore / game.maxScore}
                        color={theme.colors.primary}
                        style={styles.progressBar}
                      />
                      <Text style={{ color: theme.colors.primary }}>{game.yourScore}/{game.maxScore}</Text>
                    </View>
                  )}
                </Card.Content>
                <Card.Actions>
                  <Button mode="contained">Play Now</Button>
                </Card.Actions>
              </Card>
            ))}
          </View>
        </ScrollView>
      </Surface>

      {/* Leaderboard Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.leaderboardHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Leaderboard</Text>
          <View style={styles.timeFilter}>
            <Button 
              mode={timeFilter === 'weekly' ? 'contained' : 'outlined'}
              onPress={() => setTimeFilter('weekly')}
              compact
            >
              Weekly
            </Button>
            <Button 
              mode={timeFilter === 'monthly' ? 'contained' : 'outlined'}
              onPress={() => setTimeFilter('monthly')}
              compact
            >
              Monthly
            </Button>
            <Button 
              mode={timeFilter === 'allTime' ? 'contained' : 'outlined'}
              onPress={() => setTimeFilter('allTime')}
              compact
            >
              All Time
            </Button>
          </View>
        </View>

        {leaderboard.map(entry => (
          <Card 
            key={entry.id} 
            style={[
              styles.leaderboardCard,
              entry.isYou && { backgroundColor: theme.colors.primaryContainer }
            ]}
          >
            <Card.Content style={styles.leaderboardEntry}>
              <View style={styles.rankContainer}>
                <Text style={[styles.rank, { color: theme.colors.primary }]}>#{entry.rank}</Text>
              </View>
              <Avatar.Text size={40} label={entry.avatar} />
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: theme.colors.text }]}>
                  {entry.name} {entry.isYou && '(You)'}
                </Text>
                <Text style={{ color: theme.colors.secondary }}>{entry.score} points</Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </Surface>

      {/* Achievements Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map(achievement => (
            <Card 
              key={achievement.id} 
              style={[
                styles.achievementCard,
                !achievement.unlocked && styles.lockedAchievement
              ]}
            >
              <Card.Content style={styles.achievementContent}>
                <IconButton 
                  icon={achievement.icon} 
                  size={32}
                  iconColor={achievement.unlocked ? theme.colors.primary : theme.colors.secondary}
                />
                <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
                  {achievement.title}
                </Text>
                <Text style={{ color: theme.colors.secondary }}>
                  {achievement.description}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
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
  gamesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  gameCard: {
    marginRight: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreContainer: {
    marginTop: 12,
    gap: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  leaderboardCard: {
    marginBottom: 8,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    minWidth: '45%',
  },
  achievementContent: {
    alignItems: 'center',
    gap: 8,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  lockedAchievement: {
    opacity: 0.6,
  },
}); 