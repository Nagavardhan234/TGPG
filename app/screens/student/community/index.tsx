import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ImageBackground, Dimensions, Image, ActivityIndicator } from 'react-native';
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
const TAB_WIDTH = SCREEN_WIDTH / 2;
const TABS = [
  { key: 'ALL', icon: 'grid', label: 'All' },
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
  const { student, isLoading: isStudentLoading } = useStudentAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['key']>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useSharedValue(0);
  const addButtonScale = useSharedValue(1);
  const tabPosition = useSharedValue(0);

  useEffect(() => {
    const index = TABS.findIndex(tab => tab.key === activeTab);
    tabPosition.value = withSpring(index * TAB_WIDTH);
  }, [activeTab]);

  useEffect(() => {
    if (!isStudentLoading) {
      if (student?.pgId) {
        setPosts([]);
        setPage(1);
        setHasMore(true);
        setError(null);
    loadData();
      } else {
        setError('Unable to load your PG information. Please try logging in again.');
      }
    }
  }, [activeTab, student?.pgId, isStudentLoading]);

  const loadData = async (loadMore = false) => {
    try {
      if (!hasMore && loadMore) return;
      if (!student?.pgId) {
        setError('Unable to load your PG information. Please try logging in again.');
        return;
      }
      
      setLoading(true);
      setError(null);
      const currentPage = loadMore ? page + 1 : 1;
      
      const response = await api.get(`/api/community/pg/${student.pgId}/posts`, {
        params: {
          page: currentPage,
          limit: 10,
          filter: activeTab === 'MY_POSTS' ? 'my_posts' : undefined
        }
      });

      if (response.data.success) {
        const newPosts = response.data.data;
        setPosts(prev => loadMore ? [...prev, ...newPosts] : newPosts);
        setHasMore(newPosts.length === 10);
        setPage(currentPage);
      } else {
        setError(response.data.message || 'Failed to load posts');
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.response?.data?.message || 'Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await api.post(`/api/community/posts/${postId}/like`);
      if (response.data.success) {
    setPosts(posts.map(post => 
          post.PostID === postId 
        ? { 
            ...post, 
                HasLiked: !post.HasLiked,
                LikesCount: post.LikesCount + (post.HasLiked ? -1 : 1)
          }
        : post
    ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      const response = await api.post(`/api/community/polls/options/${optionId}/vote`);
      if (response.data.success) {
        setPosts(posts.map(post => {
          if (post.Type === 'POLL' && post.AdditionalData?.PollID === pollId) {
            const updatedOptions = response.data.data;
            return {
            ...post,
              AdditionalData: {
                ...post.AdditionalData,
                Options: updatedOptions
              }
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const handleEventStatus = async (eventId: number, status: 'interested' | 'going') => {
    try {
      const response = await api.post(`/api/community/events/${eventId}/respond`, {
        response: status.toUpperCase()
      });
      
      if (response.data.success) {
        setPosts(posts.map(post => {
          if (post.Type === 'EVENT' && post.AdditionalData?.EventID === eventId) {
            return {
            ...post,
              AdditionalData: {
                ...post.AdditionalData,
                InterestedCount: response.data.data.interested || 0,
                GoingCount: response.data.data.going || 0,
                UserResponse: status.toUpperCase()
              }
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error updating event response:', error);
    }
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
            label={post.UserName?.substring(0, 2) || '?'}
            style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}
          />
          <View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{post.UserName}</Text>
            <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>
              {format(new Date(post.CreatedAt), 'PPp')}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.postContent, { color: theme.colors.text }]}>{post.Content}</Text>

      {post.MediaURL && (
        <View style={styles.postMediaContainer}>
          <Image
            source={{ uri: post.MediaURL }}
            style={styles.postMedia}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={[styles.interactionBar, { borderTopColor: theme.colors.outline }]}>
        <Pressable
          style={styles.interactionButton}
          onPress={() => handleLike(post.PostID)}
        >
          <MaterialCommunityIcons
            name={post.HasLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.HasLiked ? theme.colors.error : theme.colors.text}
          />
          <Text style={[styles.interactionText, { color: theme.colors.text }]}>{post.LikesCount}</Text>
        </Pressable>

        <Pressable style={styles.interactionButton}>
          <MaterialCommunityIcons
            name="comment-outline"
            size={24}
            color={theme.colors.text}
          />
          <Text style={[styles.interactionText, { color: theme.colors.text }]}>{post.CommentsCount}</Text>
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

  const handleSubmit = async (data: any) => {
    try {
      if (!student?.pgId) {
        setError('Unable to load your PG information. Please try logging in again.');
        return;
      }

      setLoading(true);
      const response = await api.post(`/api/community/pg/${student.pgId}/posts`, data);

      if (response.data.success) {
        setShowAddModal(false);
        // Refresh the posts list
        setPosts([]);
        setPage(1);
        setHasMore(true);
        loadData();
      } else {
        alert(response.data.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(error.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentDashboardLayout title="Community">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {isStudentLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading your information...
            </Text>
          </View>
        ) : !student?.pgId ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color={theme.colors.error}
            />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Unable to load your PG information. Please try logging in again.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.replace('/screens/student/login')}
              style={styles.retryButton}
            >
              Login Again
            </Button>
          </View>
        ) : (
          <>
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
              contentContainerStyle={[
                styles.contentContainer,
                (!posts.length) && styles.centerContent
              ]}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
            addButtonScale.value = withSpring(
              e.nativeEvent.contentOffset.y > 50 ? 0.8 : 1
            );
          }}
          scrollEventThrottle={16}
              onEndReached={() => hasMore && !loading && loadData(true)}
              onEndReachedThreshold={0.5}
            >
              {loading && !posts.length ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                    Loading posts...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={48}
                    color={theme.colors.error}
                  />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => loadData()}
                    style={styles.retryButton}
                  >
                    Retry
                  </Button>
                </View>
              ) : posts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="message-text-outline"
                    size={64}
                    color={theme.colors.primary}
                    style={{ opacity: 0.8 }}
                  />
                  <Text style={[styles.emptyTitle, { color: theme.colors.primary }]}>
                    No Posts Yet
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                    {activeTab === 'ALL' 
                      ? 'Be the first to start a conversation in your PG community!'
                      : 'You haven\'t shared any posts yet. Click the + button to get started!'}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => setShowAddModal(true)}
                    style={styles.startPostButton}
                    labelStyle={{ color: '#fff' }}
                  >
                    Create First Post
                  </Button>
                </View>
              ) : (
                posts.map(post => {
                  switch (post.Type) {
              case 'POST':
                return renderPostCard(post);
              case 'POLL':
                      return (
                        <Animated.View
                          key={post.PostID}
                          entering={FadeIn.duration(500)}
                          style={[styles.card, { backgroundColor: theme.colors.surface }]}
                        >
                          <View style={styles.cardHeader}>
                            <View style={styles.userInfo}>
                              <Avatar.Text
                                size={40}
                                label={post.UserName?.substring(0, 2) || '?'}
                                style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}
                              />
                              <View>
                                <Text style={[styles.userName, { color: theme.colors.text }]}>{post.UserName}</Text>
                                <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>
                                  {format(new Date(post.CreatedAt), 'PPp')}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <Text style={[styles.pollQuestion, { color: theme.colors.text }]}>
                            {post.AdditionalData?.Question}
                          </Text>

                          <View style={styles.pollOptions}>
                            {post.AdditionalData?.Options?.map((option: any) => {
                              const totalVotes = post.AdditionalData.Options.reduce(
                                (sum: number, opt: any) => sum + opt.Votes, 0
                              );
                              const percentage = totalVotes > 0 
                                ? Math.round((option.Votes / totalVotes) * 100) 
                                : 0;
                              
                              return (
                                <Pressable
                                  key={option.OptionID}
                                  style={[
                                    styles.pollOption,
                                    { backgroundColor: theme.colors.surfaceVariant }
                                  ]}
                                  onPress={() => !option.HasVoted && handleVote(post.PostID, option.OptionID)}
                                >
                                  <View 
                                    style={[
                                      styles.pollOptionProgress,
                                      { 
                                        backgroundColor: theme.colors.primary + '20',
                                        width: `${percentage}%`
                                      }
                                    ]} 
                                  />
                                  <View style={styles.pollOptionContent}>
                                    <Text style={[styles.pollOptionText, { color: theme.colors.text }]}>
                                      {option.Text}
                                    </Text>
                                    <Text style={[styles.pollOptionPercentage, { color: theme.colors.primary }]}>
                                      {percentage}%
                                    </Text>
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>

                          <Text style={[styles.pollTotalVotes, { color: theme.colors.textSecondary }]}>
                            {post.AdditionalData?.Options?.reduce(
                              (sum: number, opt: any) => sum + opt.Votes, 0
                            )} total votes
                          </Text>
                        </Animated.View>
                      );
              case 'EVENT':
                      return (
                        <Animated.View
                          key={post.PostID}
                          entering={FadeIn.duration(500)}
                          style={[styles.card, { backgroundColor: theme.colors.surface }]}
                        >
                          <View style={styles.cardHeader}>
                            <View style={styles.userInfo}>
                              <Avatar.Text
                                size={40}
                                label={post.UserName?.substring(0, 2) || '?'}
                                style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}
                              />
                              <View>
                                <Text style={[styles.userName, { color: theme.colors.text }]}>{post.UserName}</Text>
                                <Text style={[styles.eventTitle, { color: theme.colors.text }]}>
                                  {post.AdditionalData?.Title}
                                </Text>
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
                              <Text style={[styles.eventInfoText, { color: theme.colors.text }]}>
                                {format(new Date(post.AdditionalData?.EventDate), 'PPp')}
                              </Text>
                            </View>

                            <View style={styles.eventInfoRow}>
                              <MaterialCommunityIcons
                                name="map-marker-outline"
                                size={20}
                                color={theme.colors.primary}
                              />
                              <Text style={[styles.eventInfoText, { color: theme.colors.text }]}>
                                {post.AdditionalData?.Location}
                              </Text>
                            </View>
                          </View>

                          <Text style={[styles.eventDescription, { color: theme.colors.text }]}>
                            {post.AdditionalData?.Description}
                          </Text>

                          <View style={styles.eventActions}>
                            <Pressable
                              style={[
                                styles.eventActionButton,
                                { backgroundColor: theme.colors.surfaceVariant },
                                post.AdditionalData?.UserResponse === 'INTERESTED' && 
                                { backgroundColor: theme.colors.primary + '20' }
                              ]}
                              onPress={() => handleEventStatus(post.PostID, 'interested')}
                            >
                              <MaterialCommunityIcons
                                name="star"
                                size={20}
                                color={post.AdditionalData?.UserResponse === 'INTERESTED' 
                                  ? theme.colors.primary 
                                  : theme.colors.text}
                              />
                              <Text style={[
                                styles.eventActionText,
                                { color: theme.colors.text },
                                post.AdditionalData?.UserResponse === 'INTERESTED' && 
                                { color: theme.colors.primary }
                              ]}>
                                Interested ({post.AdditionalData?.InterestedCount || 0})
                              </Text>
                            </Pressable>

                            <Pressable
                              style={[
                                styles.eventActionButton,
                                { backgroundColor: theme.colors.surfaceVariant },
                                post.AdditionalData?.UserResponse === 'GOING' && 
                                { backgroundColor: theme.colors.primary + '20' }
                              ]}
                              onPress={() => handleEventStatus(post.PostID, 'going')}
                            >
                              <MaterialCommunityIcons
                                name="check"
                                size={20}
                                color={post.AdditionalData?.UserResponse === 'GOING' 
                                  ? theme.colors.primary 
                                  : theme.colors.text}
                              />
                              <Text style={[
                                styles.eventActionText,
                                { color: theme.colors.text },
                                post.AdditionalData?.UserResponse === 'GOING' && 
                                { color: theme.colors.primary }
                              ]}>
                                Going ({post.AdditionalData?.GoingCount || 0})
                              </Text>
                            </Pressable>
                          </View>
                        </Animated.View>
                      );
              default:
                return null;
            }
                })
              )}
              {loading && posts.length > 0 && (
                <ActivityIndicator style={styles.loadingMore} color={theme.colors.primary} />
              )}
        </ScrollView>

            <AddModal
              visible={showAddModal}
              onDismiss={() => setShowAddModal(false)}
              onSubmit={handleSubmit}
              pgId={student.pgId}
            />

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
          </>
        )}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: 8,
  },
  startPostButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  loadingMore: {
    padding: 16,
  },
}); 