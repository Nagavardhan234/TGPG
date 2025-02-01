import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ImageBackground, Dimensions, Image, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
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
import { memo } from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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

// Memoize the event card component for better performance
const EventCard = memo(({ event, onPress, theme }) => {
  return (
    <Pressable onPress={onPress}>
      {/* ... existing event card code ... */}
    </Pressable>
  );
});

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
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

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
      // Check if user has already voted
      const hasVoted = posts.find(post => 
        post.Type === 'POLL' && 
        post.PostID === pollId && 
        post.AdditionalData?.Options?.some((opt: any) => opt.HasVoted)
      );

      if (hasVoted) {
        return; // Prevent voting if already voted
      }

      // Optimistically update the UI
      setPosts(posts.map(post => {
        if (post.Type === 'POLL' && post.PostID === pollId) {
          const updatedOptions = post.AdditionalData.Options.map((opt: any) => ({
            ...opt,
            Votes: opt.OptionID === optionId ? opt.Votes + 1 : opt.Votes,
            HasVoted: opt.OptionID === optionId
          }));
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

      const response = await api.post(`/api/community/polls/options/${optionId}/vote`);
      if (!response.data.success) {
        // Revert changes if request fails
        loadData();
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      loadData(); // Reload data if error occurs
    }
  };

  const handleEventStatus = async (eventId: number, status: 'interested' | 'going') => {
    try {
      // Optimistically update the UI
      setPosts(posts.map(post => {
        if (post.Type === 'EVENT' && post.PostID === eventId) {
          const currentResponse = post.AdditionalData.UserResponse;
          const updates = {
            InterestedCount: post.AdditionalData.InterestedCount || 0,
            GoingCount: post.AdditionalData.GoingCount || 0
          };

          // Remove count from previous response
          if (currentResponse === 'INTERESTED') updates.InterestedCount--;
          if (currentResponse === 'GOING') updates.GoingCount--;

          // Add count to new response
          if (status === 'interested') updates.InterestedCount++;
          if (status === 'going') updates.GoingCount++;

          return {
            ...post,
            AdditionalData: {
              ...post.AdditionalData,
              ...updates,
              UserResponse: status.toUpperCase()
            }
          };
        }
        return post;
      }));

      const response = await api.post(`/api/community/events/${eventId}/respond`, {
        response: status.toUpperCase()
      });
      
      if (!response.data.success) {
        // Revert changes if request fails
        loadData();
      }
    } catch (error) {
      console.error('Error updating event response:', error);
      loadData(); // Reload data if error occurs
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

        <Pressable 
          style={styles.interactionButton}
          onPress={() => {
            setSelectedPost(post);
            setShowComments(true);
            loadComments(post.PostID);
          }}
        >
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
            label={poll.UserName?.substring(0, 2) || '?'}
            style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}
          />
          <View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{poll.UserName}</Text>
            <Text style={[styles.postTime, { color: theme.colors.textSecondary }]}>
              {format(new Date(poll.CreatedAt), 'PPp')}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.pollQuestion, { color: theme.colors.text }]}>
        {poll.Content || poll.AdditionalData?.Question}
      </Text>

      <View style={styles.pollOptions}>
        {poll.AdditionalData?.Options?.map((option: any) => {
          const totalVotes = poll.AdditionalData.Options.reduce((acc: number, curr: any) => acc + (curr.Votes || 0), 0);
          const percentage = totalVotes > 0 ? Math.round((option.Votes / totalVotes) * 100) : 0;
          const hasVoted = poll.AdditionalData.Options.some((opt: any) => opt.HasVoted);
          
          return (
            <Pressable
              key={option.OptionID}
              style={[
                styles.pollOption,
                { backgroundColor: theme.colors.surfaceVariant }
              ]}
              onPress={() => !hasVoted && handleVote(poll.PostID, option.OptionID)}
            >
              <View 
                style={[
                  styles.pollOptionProgress,
                  { 
                    backgroundColor: theme.colors.primary + '20',
                    width: hasVoted ? `${percentage}%` : '0%'
                  }
                ]} 
              />
              <View style={styles.pollOptionContent}>
                <Text style={[styles.pollOptionText, { color: theme.colors.text }]}>
                  {option.Text || option.Content}
                </Text>
                {hasVoted && (
                  <Text style={[styles.pollOptionPercentage, { color: theme.colors.primary }]}>
                    {percentage}%
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.pollTotalVotes, { color: theme.colors.textSecondary }]}>
        {poll.AdditionalData?.Options?.reduce((acc: number, curr: any) => acc + (curr.Votes || 0), 0) || 0} total votes
      </Text>
    </Animated.View>
  );

  const renderEventCard = useCallback(({ item }) => (
    <EventCard
      event={item}
      onPress={() => handleEventStatus(item.id, item.status === 'interested' ? 'going' : 'interested')}
      theme={theme}
    />
  ), [theme]);

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

  const loadComments = async (postId: number) => {
    try {
      setLoadingComments(true);
      const response = await api.get(`/api/community/posts/${postId}/comments`);
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const addComment = async (postId: number) => {
    if (!commentText.trim()) return;
    
    try {
      const response = await api.post(`/api/community/posts/${postId}/comments`, {
        content: commentText.trim()
      });

      if (response.data.success) {
        setComments([response.data.data, ...comments]);
        setCommentText('');
        // Update the comment count in the posts list
        setPosts(posts.map(post => 
          post.PostID === postId 
            ? { ...post, CommentsCount: post.CommentsCount + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const deleteComment = async (postId: number, commentId: number) => {
    try {
      const response = await api.delete(`/api/community/comments/${commentId}`);
      if (response.data.success) {
        setComments(comments.filter(comment => comment.CommentID !== commentId));
        // Update the comment count in the posts list
        setPosts(posts.map(post => 
          post.PostID === postId 
            ? { ...post, CommentsCount: post.CommentsCount - 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
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

        <FlatList
          data={posts}
          renderItem={({ item }) => {
            switch (item.Type) {
              case 'POST':
                return renderPostCard(item);
              case 'POLL':
                return renderPollCard(item);
              case 'EVENT':
                return renderEventCard({ item });
              default:
                return null;
            }
          }}
          keyExtractor={item => item.PostID.toString()}
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
          ListEmptyComponent={() => (
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
          )}
          ListFooterComponent={() => (
            loading && posts.length > 0 && (
              <ActivityIndicator style={styles.loadingMore} color={theme.colors.primary} />
            )
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadData()}
              colors={[theme.colors.primary]}
            />
          }
        />

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

        {showComments && selectedPost && (
          <Portal>
            <Modal
              visible={showComments}
              onDismiss={() => {
                setShowComments(false);
                setSelectedPost(null);
                setComments([]);
              }}
              contentContainerStyle={[styles.commentsModal]}
            >
              <View style={[styles.commentsContainer, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.commentsHeader}>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => {
                      setShowComments(false);
                      setSelectedPost(null);
                      setComments([]);
                    }}
                  />
                  <Text style={[styles.commentsTitle, { color: theme.colors.text }]}>Comments</Text>
                  <View style={{ width: 40 }} />
                </View>

                <FlatList
                  data={comments}
                  renderItem={({ item }) => (
                    <View key={item.CommentID} style={styles.commentItem}>
                        <Avatar.Text
                          size={36}
                        label={item.UserName?.substring(0, 2) || '?'}
                          style={[styles.commentAvatar, { backgroundColor: theme.colors.primary + '20' }]}
                        />
                        <View style={styles.commentContent}>
                          <View style={styles.commentHeader}>
                            <Text style={[styles.commentUserName, { color: theme.colors.text }]}>
                            {item.UserName}
                            </Text>
                            <Text style={[styles.commentTime, { color: theme.colors.textSecondary }]}>
                            {format(new Date(item.CreatedAt), 'PPp')}
                            </Text>
                          </View>
                          <Text style={[styles.commentText, { color: theme.colors.text }]}>
                          {item.Content}
                          </Text>
                        </View>
                      {item.UserID === student?.id && (
                          <IconButton
                            icon="delete-outline"
                            size={20}
                          onPress={() => deleteComment(selectedPost.PostID, item.CommentID)}
                            style={styles.deleteComment}
                          />
                        )}
                      </View>
                  )}
                  keyExtractor={item => item.CommentID.toString()}
                  contentContainerStyle={styles.commentsList}
                  initialNumToRender={5}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                  ListEmptyComponent={() => (
                    <View style={styles.noComments}>
                      <MaterialCommunityIcons
                        name="comment-outline"
                        size={48}
                        color={theme.colors.primary}
                        style={{ opacity: 0.5 }}
                      />
                      <Text style={[styles.noCommentsText, { color: theme.colors.text }]}>
                        No comments yet. Be the first to comment!
                      </Text>
                    </View>
                  )}
                />

                <View style={styles.commentInput}>
                  <TextInput
                    mode="outlined"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                    right={
                      <TextInput.Icon
                        icon="send"
                        disabled={!commentText.trim()}
                        onPress={() => addComment(selectedPost.PostID)}
                      />
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </Modal>
          </Portal>
        )}
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
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    lineHeight: 28,
    paddingHorizontal: 16,
    color: '#1a1a1a',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pollTimeRemaining: {
    fontSize: 12,
  },
  pollOptions: {
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  pollOption: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pollOptionProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pollOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  pollOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pollOptionPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  pollTotalVotes: {
    fontSize: 14,
    textAlign: 'right',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventInfo: {
    marginVertical: 16,
    gap: 12,
    paddingHorizontal: 16,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  eventInfoText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  eventDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 20,
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
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventActionText: {
    fontSize: 15,
    fontWeight: '600',
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
  commentsModal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  commentsContainer: {
    maxHeight: SCREEN_HEIGHT * 0.8,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  commentsList: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  commentAvatar: {
    marginTop: 4,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
  },
  deleteComment: {
    margin: -8,
  },
  commentInput: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  noComments: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  noCommentsText: {
    textAlign: 'center',
    opacity: 0.7,
  },
}); 