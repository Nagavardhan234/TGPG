import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  IconButton, 
  SegmentedButtons,
  ProgressBar,
  Card,
  Button,
  Portal,
  Modal
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import DailyRankingModal from './DailyRankingModal';

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  type: 'gold' | 'silver' | 'bronze';
}

interface RankingUser {
  id: number;
  name: string;
  points: number;
  rank: number;
  achievements: number;
  isYou?: boolean;
  trend: 'up' | 'down' | 'stable';
}

// Dummy data
const achievements: Achievement[] = [
  {
    id: 1,
    title: "Cleanliness Champion",
    description: "Maintained perfect room score for 30 days",
    icon: "broom",
    progress: 25,
    total: 30,
    type: 'gold'
  },
  {
    id: 2,
    title: "Event Enthusiast",
    description: "Participated in 10 PG events",
    icon: "star",
    progress: 7,
    total: 10,
    type: 'silver'
  }
];

const rankings: RankingUser[] = [
  { id: 1, name: "John D.", points: 850, rank: 1, achievements: 5, trend: 'up' },
  { id: 2, name: "You", points: 720, rank: 2, achievements: 3, isYou: true, trend: 'stable' },
  { id: 3, name: "Mike R.", points: 680, rank: 3, achievements: 4, trend: 'down' },
];

export default function RankingsScreen() {
  const { theme } = useTheme();
  const { student } = useStudentAuth();
  const [view, setView] = useState<'rankings' | 'achievements'>('rankings');
  const [showDailyModal, setShowDailyModal] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  const getBadgeColor = (type: Achievement['type']) => {
    switch (type) {
      case 'gold': return ['#FFD700', '#FFA500'];
      case 'silver': return ['#C0C0C0', '#808080'];
      case 'bronze': return ['#CD7F32', '#8B4513'];
    }
  };

  const renderAchievementCard = (achievement: Achievement) => (
    <Surface 
      key={achievement.id}
      style={[styles.achievementCard, { backgroundColor: theme?.colors?.surface }]}
    >
      <LinearGradient
        colors={getBadgeColor(achievement.type)}
        style={styles.achievementBadge}
      >
        <IconButton icon={achievement.icon} size={24} iconColor="#FFF" />
      </LinearGradient>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, { color: theme?.colors?.onSurface }]}>
          {achievement.title}
        </Text>
        <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
          {achievement.description}
        </Text>
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={achievement.progress / achievement.total}
            color={theme?.colors?.primary}
            style={styles.progressBar}
          />
          <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
            {achievement.progress}/{achievement.total}
          </Text>
        </View>
      </View>
    </Surface>
  );

  const renderRankingCard = (user: RankingUser) => (
    <Surface 
      key={user.id}
      style={[
        styles.rankingCard,
        { 
          backgroundColor: user.isYou ? theme?.colors?.primaryContainer : theme?.colors?.surface,
          borderLeftColor: user.rank <= 3 ? theme?.colors?.primary : 'transparent'
        }
      ]}
    >
      <View style={styles.rankingLeft}>
        <Text style={[styles.rankNumber, { color: theme?.colors?.primary }]}>
          #{user.rank}
        </Text>
        <Avatar.Text
          size={40}
          label={user.name.substring(0, 2)}
          style={{ backgroundColor: theme?.colors?.primary + '20' }}
        />
        <View>
          <Text style={[styles.userName, { color: theme?.colors?.onSurface }]}>
            {user.name}
          </Text>
          <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
            {user.achievements} achievements
          </Text>
        </View>
      </View>
      <View style={styles.rankingRight}>
        <IconButton 
          icon={
            user.trend === 'up' ? 'trending-up' :
            user.trend === 'down' ? 'trending-down' : 'trending-neutral'
          }
          iconColor={
            user.trend === 'up' ? theme?.colors?.primary :
            user.trend === 'down' ? theme?.colors?.error :
            theme?.colors?.secondary
          }
          size={20}
        />
        <Text style={[styles.points, { color: theme?.colors?.primary }]}>
          {user.points} pts
        </Text>
      </View>
    </Surface>
  );

  const handleDailyRanking = (selectedRoommates: number[]) => {
    console.log('Selected roommates:', selectedRoommates);
  };

  return (
    <DashboardLayout
      title="Rankings & Achievements"
      subtitle="Track your progress"
    >
      <View style={styles.container}>
        <Surface style={[styles.header, { backgroundColor: theme?.colors?.surface }]}>
          <SegmentedButtons
            value={view}
            onValueChange={value => setView(value as 'rankings' | 'achievements')}
            buttons={[
              { value: 'rankings', label: 'Rankings', icon: 'trophy' },
              { value: 'achievements', label: 'Achievements', icon: 'medal' }
            ]}
          />
        </Surface>

        <ScrollView>
          {view === 'rankings' ? (
            <View style={styles.rankingsContainer}>
              {rankings.map(renderRankingCard)}
            </View>
          ) : (
            <View style={styles.achievementsContainer}>
              {achievements.map(renderAchievementCard)}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Daily Ranking Modal */}
      <DailyRankingModal
        visible={showDailyModal}
        onDismiss={() => setShowDailyModal(false)}
        onSubmit={handleDailyRanking}
      />
    </DashboardLayout>
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
  rankingsContainer: {
    padding: 16,
    gap: 12,
  },
  rankingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 40,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementsContainer: {
    padding: 16,
    gap: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    gap: 16,
  },
  achievementBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
    gap: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
}); 