import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ImageBackground, Dimensions, Image } from 'react-native';
import { Surface, Text, Button, IconButton, Portal, Modal, TextInput, Chip, Avatar, FAB } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router } from 'expo-router';
import { format } from 'date-fns';
import api from '@/app/services/api';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import Animated, { 
  FadeIn, 
  FadeOut, 
  interpolate,
  withSpring,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AddModal from './AddModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / 3;
const TABS = [
  { key: 'ALL', icon: 'grid', label: 'All' },
  { key: 'TRENDING', icon: 'fire', label: 'Trending' },
  { key: 'MY_POSTS', icon: 'file-document-outline', label: 'My Posts' },
] as const;

const NEON_COLORS = {
  blue: '#00FFFF',
  purple: '#FF00FF',
  teal: '#00FFA3',
  dark: '#0A0A1F',
  darkBlue: '#0A1A3F',
};

export default function CommunityScreen() {
  const { theme, isDarkMode } = useTheme();
  const { student } = useStudentAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['key']>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const scrollY = useSharedValue(0);
  const addButtonScale = useSharedValue(1);
  const tabPosition = useSharedValue(0);

  useEffect(() => {
    const index = TABS.findIndex(tab => tab.key === activeTab);
    tabPosition.value = withSpring(index * TAB_WIDTH);
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simulated data for now
      setPosts([
        {
          id: 1,
          type: 'POST',
          user: 'John Doe',
          time: '10 minutes ago',
          visibility: 'Public',
          content: 'Exploring the beauty of nature today! 🌲🌄',
          media: 'https://picsum.photos/400/300',
          likes: 145,
          comments: 12,
          hasLiked: false,
        },
        {
          id: 2,
          type: 'POLL',
          user: 'Emily',
          time: '1 hour ago',
          visibility: 'PG',
          question: 'Which programming language do you prefer for mobile app development?',
          options: [
            { id: 1, text: 'Flutter', votes: 120 },
            { id: 2, text: 'React Native', votes: 150 },
            { id: 3, text: 'Swift', votes: 50 },
          ],
          totalVotes: 320,
          timeRemaining: '23 hours left',
          hasVoted: false,
        },
        {
          id: 3,
          type: 'EVENT',
          user: 'Tech Meetup Group',
          title: 'AI & Blockchain Conference 2025',
          time: 'January 15, 2025 – 10:00 AM',
          location: 'Berlin Tech Hub',
          description: 'Join us for a deep dive into AI innovations and blockchain technology with industry leaders.',
          interested: 89,
          going: 45,
          status: 'interested', // null, 'interested', or 'going'
        },
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            hasLiked: !post.hasLiked,
            likes: post.likes + (post.hasLiked ? -1 : 1)
          }
        : post
    ));
  };

  const handleVote = async (pollId: number, optionId: number) => {
    setPosts(posts.map(post => 
      post.id === pollId 
        ? {
            ...post,
            hasVoted: true,
            options: post.options.map((opt: any) => ({
              ...opt,
              votes: opt.id === optionId ? opt.votes + 1 : opt.votes
            })),
            totalVotes: post.totalVotes + 1
          }
        : post
    ));
  };

  const handleEventStatus = async (eventId: number, status: 'interested' | 'going') => {
    setPosts(posts.map(post =>
      post.id === eventId
        ? {
            ...post,
            status: post.status === status ? null : status,
            [status]: post[status] + (post.status === status ? -1 : 1)
          }
        : post
    ));
  };

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.8]
    );

    return {
      opacity,
      transform: [{ 
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -20]
        )
      }]
    };
  });

  const renderPostCard = (post: any) => (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Avatar.Text
            size={40}
            label={post.user.substring(0, 2)}
            style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}
          />
          <View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{post.user}</Text>
            <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>{post.time}</Text>
          </View>
        </View>
        <Chip 
          mode="outlined" 
          style={[styles.visibilityChip, { borderColor: theme.colors.primary }]}
          textStyle={{ color: theme.colors.primary }}
        >
          {post.visibility}
        </Chip>
      </View>

      <Text style={[styles.postContent, { color: theme.colors.text }]}>{post.content}</Text>

      {post.media && (
        <View style={styles.postMediaContainer}>
          <Image
            source={{ uri: post.media }}
            style={styles.postMedia}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={[styles.interactionBar, { borderTopColor: theme.colors.outline }]}>
        <Pressable
          style={styles.interactionButton}
          onPress={() => handleLike(post.id)}
        >
          <MaterialCommunityIcons
            name={post.hasLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.hasLiked ? theme.colors.error : theme.colors.text}
          />
          <Text style={[styles.interactionText, { color: theme.colors.text }]}>{post.likes}</Text>
        </Pressable>

        <Pressable style={styles.interactionButton}>
          <MaterialCommunityIcons
            name="comment-outline"
            size={24}
            color={theme.colors.text}
          />
          <Text style={[styles.interactionText, { color: theme.colors.text }]}>{post.comments}</Text>
        </Pressable>

        <Pressable style={styles.interactionButton}>
          <MaterialCommunityIcons
            name="share-outline"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderPollCard = (poll: any) => (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Avatar.Text
            size={40}
            label={poll.user.substring(0, 2)}
            style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}
          />
          <View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{poll.user}</Text>
            <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>{poll.time}</Text>
          </View>
        </View>
        <Text style={[styles.pollTimeRemaining, { color: theme.colors.primary }]}>{poll.timeRemaining}</Text>
      </View>

      <Text style={[styles.pollQuestion, { color: theme.colors.text }]}>{poll.question}</Text>

      <View style={styles.pollOptions}>
        {poll.options.map((option: any) => {
          const percentage = Math.round((option.votes / poll.totalVotes) * 100);
          return (
            <Pressable
              key={option.id}
              style={[
                styles.pollOption,
                { backgroundColor: theme.colors.surfaceVariant }
              ]}
              onPress={() => !poll.hasVoted && handleVote(poll.id, option.id)}
            >
              <View 
                style={[
                  styles.pollOptionProgress,
                  { 
                    backgroundColor: theme.colors.primary + '20',
                    width: poll.hasVoted ? `${percentage}%` : '0%'
                  }
                ]} 
              />
              <View style={styles.pollOptionContent}>
                <Text style={[styles.pollOptionText, { color: theme.colors.text }]}>{option.text}</Text>
                {poll.hasVoted && (
                  <Text style={[styles.pollOptionPercentage, { color: theme.colors.primary }]}>{percentage}%</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.pollTotalVotes, { color: theme.colors.textSecondary }]}>
        {poll.totalVotes} total votes
      </Text>
    </Animated.View>
  );

  const renderEventCard = (event: any) => (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Avatar.Text
            size={40}
            label={event.user.substring(0, 2)}
            style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}
          />
          <View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{event.user}</Text>
            <Text style={[styles.eventTitle, { color: theme.colors.text }]}>{event.title}</Text>
          </View>
        </View>
      </View>

      <View style={styles.eventInfo}>
        <View style={styles.eventInfoRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.eventInfoText, { color: theme.colors.text }]}>{event.time}</Text>
        </View>

        <View style={styles.eventInfoRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.eventInfoText, { color: theme.colors.text }]}>{event.location}</Text>
        </View>
      </View>

      <Text style={[styles.eventDescription, { color: theme.colors.text }]}>{event.description}</Text>

      <View style={styles.eventActions}>
        <Pressable
          style={[
            styles.eventActionButton,
            { backgroundColor: theme.colors.surfaceVariant },
            event.status === 'interested' && { backgroundColor: theme.colors.primary + '20' }
          ]}
          onPress={() => handleEventStatus(event.id, 'interested')}
        >
          <MaterialCommunityIcons
            name="star"
            size={20}
            color={event.status === 'interested' ? theme.colors.primary : theme.colors.text}
          />
          <Text style={[
            styles.eventActionText,
            { color: theme.colors.text },
            event.status === 'interested' && { color: theme.colors.primary }
          ]}>
            Interested ({event.interested})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.eventActionButton,
            { backgroundColor: theme.colors.surfaceVariant },
            event.status === 'going' && { backgroundColor: theme.colors.primary + '20' }
          ]}
          onPress={() => handleEventStatus(event.id, 'going')}
        >
          <MaterialCommunityIcons
            name="check"
            size={20}
            color={event.status === 'going' ? theme.colors.primary : theme.colors.text}
          />
          <Text style={[
            styles.eventActionText,
            { color: theme.colors.text },
            event.status === 'going' && { color: theme.colors.primary }
          ]}>
            Going ({event.going})
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPosition.value }],
  }));

  return (
    <StudentDashboardLayout title="Community">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={styles.tabBar}>
            <Animated.View 
              style={[
                styles.tabIndicator, 
                { backgroundColor: theme.colors.primary + '15' },
                tabBarAnimatedStyle
              ]} 
            />
            {TABS.map((tab, index) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  { backgroundColor: 'transparent' }
                ]}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={24}
                  color={activeTab === tab.key ? theme.colors.primary : theme.colors.text}
                  style={[
                    styles.tabIcon,
                    { opacity: activeTab === tab.key ? 1 : 0.7 }
                  ]}
                />
                <Text 
                  style={[
                    styles.tabText,
                    { 
                      color: activeTab === tab.key ? theme.colors.primary : theme.colors.text,
                      opacity: activeTab === tab.key ? 1 : 0.7
                    }
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Surface>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
            addButtonScale.value = withSpring(
              e.nativeEvent.contentOffset.y > 50 ? 0.8 : 1
            );
          }}
          scrollEventThrottle={16}
        >
          {posts.map(post => {
            switch (post.type) {
              case 'POST':
                return renderPostCard(post);
              case 'POLL':
                return renderPollCard(post);
              case 'EVENT':
                return renderEventCard(post);
              default:
                return null;
            }
          })}
        </ScrollView>

        <Portal>
          <Modal
            visible={showAddModal}
            onDismiss={() => setShowAddModal(false)}
            contentContainerStyle={[
              styles.addModal,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <AddModal
              visible={showAddModal}
              onDismiss={() => setShowAddModal(false)}
              onSubmit={async (data) => {
                console.log('New post:', data);
                setShowAddModal(false);
              }}
            />
          </Modal>
        </Portal>

        <Animated.View style={[styles.fabContainer, { transform: [{ scale: addButtonScale }] }]}>
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              addButtonScale.value = withSequence(
                withSpring(1.2),
                withSpring(1)
              );
              setShowAddModal(true);
            }}
            color="#fff"
          />
        </Animated.View>
      </View>
    </StudentDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    marginBottom: 1,
  },
  tabBar: {
    flexDirection: 'row',
    position: 'relative',
    height: 56,
    width: '100%',
    backgroundColor: 'transparent',
  },
  tabIndicator: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: '100%',
    borderRadius: 0,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  tab: {
    width: TAB_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  fab: {
    borderRadius: 28,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    borderWidth: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  visibilityChip: {
    backgroundColor: 'transparent',
  },
  postContent: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 24,
  },
  postMediaContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 4/3,
    marginHorizontal: -16,
  },
  postMedia: {
    width: '100%',
    height: '100%',
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  interactionText: {
    fontSize: 14,
  },
  addModal: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  pollQuestion: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  pollTimeRemaining: {
    fontSize: 12,
  },
  pollOptions: {
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  pollOption: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  pollOptionProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    transition: 'width 0.3s ease-out',
  },
  pollOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  pollOptionText: {
    fontSize: 16,
  },
  pollOptionPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  pollTotalVotes: {
    fontSize: 12,
    textAlign: 'right',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  eventInfo: {
    marginVertical: 12,
    gap: 8,
    paddingHorizontal: 16,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventInfoText: {
    fontSize: 14,
  },
  eventDescription: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  eventActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 24,
  },
  eventActionText: {
    fontSize: 14,
  },
}); 