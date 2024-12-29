import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  IconButton, 
  Button, 
  Chip,
  Avatar,
  FAB,
  Portal,
  Modal,
  List,
  Divider,
  ActivityIndicator,
  ProgressBar
} from 'react-native-paper';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { taskService } from '@/app/services/task.service';
import { TASK_STATUS, TASK_ICONS } from '@/app/config/constants';
import { socketService } from '@/app/services/socket.service';

interface Task {
  TaskID: number;
  TaskHeading: string;
  TaskDescription: string;
  ExpiryDate: string;
  CreatedDate: string;
  LogoID: number;
  CreatorName: string;
  MyStatus: typeof TASK_STATUS[keyof typeof TASK_STATUS] | null;
  AssignedCount: number;
  CompletedCount: number;
}

interface TaskDetails {
  TenantID: number;
  FullName: string;
  Status: string;
  AssignedDate: string;
  CompletedDate: string | null;
}

interface TaskStats {
  total: number;
  mine: number;
  completed: number;
}

export default function SplitWorkScreen() {
  const { theme } = useTheme();
  const { isAuthenticated, student } = useStudentAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetails, setTaskDetails] = useState<TaskDetails[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'mine'>('all');
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    mine: 0,
    completed: 0
  });
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getRoomTasks();
      if (response.success) {
        setTasks(response.data);
        
        // Calculate stats
        const myTasks = response.data.filter((task: Task) => task.MyStatus);
        const completedTasks = myTasks.filter((task: Task) => task.MyStatus === TASK_STATUS.COMPLETED);
        
        setStats({
          total: response.data.length,
          mine: myTasks.length,
          completed: completedTasks.length
        });
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !student) return;

    const setup = async () => {
      await setupSocket();
      await loadTasks();
    };

    setup();

    return () => {
      socketService.unsubscribeFromTaskUpdates();
      socketService.leaveRoom();
      socketService.disconnect();
    };
  }, [isAuthenticated, student]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && student) {
        setupSocket();
        loadTasks();
      }
    }, [isAuthenticated, student])
  );

  const setupSocket = async () => {
    if (!student?.Room_No) {
      console.warn('Student or room number is not available');
      return;
    }
    
    await socketService.connect();
    socketService.joinRoom(student.Room_No.toString());
    socketService.subscribeToTaskUpdates(() => {
      loadTasks();
    });
  };

  const handleTabChange = (tab: 'all' | 'mine') => {
    setSelectedTab(tab);
  };

  const handleShowDetails = async (task: Task) => {
    try {
      const response = await taskService.getTaskDetails(task.TaskID);
      if (response.success) {
        setSelectedTask(task);
        setTaskDetails(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading task details:', error);
      setError('Failed to load task details');
    }
  };

  const handleStartTask = async (taskId: number) => {
    try {
      const response = await taskService.startTask(taskId);
      if (response.success) {
        setTasks(prevTasks => prevTasks.map(task => {
          if (task.TaskID === taskId) {
            return {
              ...task,
              MyStatus: TASK_STATUS.ACTIVE
            };
          }
          return task;
        }));
      }
    } catch (error) {
      console.error('Error starting task:', error);
      setError('Failed to start task');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const response = await taskService.completeTask(taskId);
      if (response.success) {
        setTasks(prevTasks => prevTasks.map(task => {
          if (task.TaskID === taskId) {
            return {
              ...task,
              MyStatus: TASK_STATUS.COMPLETED,
              CompletedCount: task.CompletedCount + 1
            };
          }
          return task;
        }));

        setStats(prevStats => ({
          ...prevStats,
          completed: prevStats.completed + 1
        }));
      }
    } catch (error) {
      console.error('Error completing task:', error);
      setError('Failed to complete task');
    }
  };

  const renderTask = (task: Task) => {
    const expiryHours = Math.max(0, Math.round((new Date(task.ExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60)));
    const expiryText = expiryHours === 0 ? 'Expiring soon' : `Expires in ${expiryHours}h`;

    const renderActionButton = () => {
      if (selectedTab === 'all') {
        return null;
      }

      if (task.MyStatus === TASK_STATUS.COMPLETED) {
        return null;
      }

      if (task.MyStatus === TASK_STATUS.PENDING) {
        return (
          <Button 
            mode="contained"
            onPress={() => handleStartTask(task.TaskID)}
          >
            Start
          </Button>
        );
      }

      if (task.MyStatus === TASK_STATUS.ACTIVE) {
        return (
          <Button 
            mode="contained"
            onPress={() => handleCompleteTask(task.TaskID)}
          >
            Complete
          </Button>
        );
      }

      return null;
    };

    return (
      <Surface 
        key={task.TaskID}
        style={[styles.taskCard, { backgroundColor: theme?.colors?.surface }]}
        elevation={2}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            <IconButton
              icon={TASK_ICONS[task.LogoID] || TASK_ICONS[8]}
              size={24}
              iconColor={theme?.colors?.primary}
              style={[styles.taskIcon, { backgroundColor: `${theme?.colors?.primary}20` }]}
            />
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, { color: theme?.colors?.onSurface }]}>
                {task.TaskHeading}
              </Text>
              <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
                {task.TaskDescription}
              </Text>
            </View>
          </View>
          <Chip style={[styles.creatorChip, { backgroundColor: `${theme?.colors?.primary}20` }]}>
            {task.CreatorName}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.taskFooter}>
          <View style={styles.taskStats}>
            <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
              {task.CompletedCount}/{task.AssignedCount} completed
            </Text>
            <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
              {expiryText}
            </Text>
          </View>
          <View style={styles.taskActions}>
            <Button 
              mode="outlined"
              onPress={() => handleShowDetails(task)}
            >
              Info
            </Button>
            {renderActionButton()}
          </View>
        </View>
      </Surface>
    );
  };

  const renderStats = () => {
    const progressValue = stats.mine > 0 ? stats.completed / stats.mine : 0;
    const showProgress = stats.mine > 0;

    return (
      <Surface style={[styles.statsCard, { backgroundColor: theme?.colors?.surface }]} elevation={2}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>
              {stats.total}
            </Text>
            <Text style={[styles.statLabel, { color: theme?.colors?.onSurfaceVariant }]}>
              Total Tasks
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>
              {stats.mine}
            </Text>
            <Text style={[styles.statLabel, { color: theme?.colors?.onSurfaceVariant }]}>
              My Tasks
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>
              {stats.completed}
            </Text>
            <Text style={[styles.statLabel, { color: theme?.colors?.onSurfaceVariant }]}>
              Completed
            </Text>
          </View>
        </View>
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: theme?.colors?.onSurfaceVariant }]}>
                Task Completion
              </Text>
              <View style={[
                styles.progressPercentageContainer,
                { backgroundColor: `${theme?.colors?.primary}15` }
              ]}>
                <Text style={[styles.progressPercentage, { color: theme?.colors?.primary }]}>
                  {Math.round(progressValue * 100)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[
                styles.progressBackground,
                { backgroundColor: `${theme?.colors?.primary}10` }
              ]} />
              <ProgressBar
                progress={progressValue}
                color={theme?.colors?.primary}
                style={styles.progressBar}
              />
            </View>
          </View>
        )}
      </Surface>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconButton
        icon="check-circle-outline"
        size={48}
        iconColor={theme?.colors?.primary}
        style={[styles.emptyIcon, { backgroundColor: `${theme?.colors?.primary}20` }]}
      />
      <Text style={[styles.emptyTitle, { color: theme?.colors?.onSurface }]}>
        No Tasks Available
      </Text>
      <Text style={[styles.emptyDescription, { color: theme?.colors?.onSurfaceVariant }]}>
        {selectedTab === 'all' 
          ? 'Create a new task to get started with room management'
          : 'You have no assigned tasks at the moment'}
      </Text>
    </View>
  );

  return (
    <StudentDashboardLayout title="Split Work">
      <View style={styles.container}>
        {renderStats()}

        <View style={styles.header}>
          <Button
            mode={selectedTab === 'all' ? 'contained' : 'outlined'}
            onPress={() => handleTabChange('all')}
            style={styles.tabButton}
          >
            All Tasks ({stats.total})
          </Button>
          <Button
            mode={selectedTab === 'mine' ? 'contained' : 'outlined'}
            onPress={() => handleTabChange('mine')}
            style={styles.tabButton}
          >
            My Tasks ({stats.mine})
          </Button>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme?.colors?.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.taskList}
            contentContainerStyle={styles.taskListContent}
            showsVerticalScrollIndicator={false}
          >
            {tasks.filter(task => selectedTab === 'all' || task.MyStatus).length > 0 ? (
              tasks
                .filter(task => selectedTab === 'all' || task.MyStatus)
                .map(renderTask)
            ) : (
              renderEmptyState()
            )}
          </ScrollView>
        )}

        <FAB
          icon="plus"
          label="New Task"
          style={[styles.fab, { backgroundColor: theme?.colors?.primary }]}
          onPress={() => {
            try {
              router.push('/screens/student/split-work/create');
            } catch (error) {
              console.error('Navigation error:', error);
              setError('Failed to navigate to create task screen');
            }
          }}
        />

        <Portal>
          <Modal
            visible={showDetailsModal}
            onDismiss={() => setShowDetailsModal(false)}
            contentContainerStyle={[
              styles.modal,
              { backgroundColor: theme?.colors?.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme?.colors?.primary }]}>
              Task Details
            </Text>
            {selectedTask && (
              <>
                <Text style={[styles.modalSubtitle, { color: theme?.colors?.onSurface }]}>
                  {selectedTask.TaskHeading}
                </Text>
                <Text style={[styles.modalDescription, { color: theme?.colors?.onSurfaceVariant }]}>
                  {selectedTask.TaskDescription}
                </Text>
                <Divider style={styles.modalDivider} />
                <Text style={[styles.modalSubtitle, { color: theme?.colors?.onSurface }]}>
                  Assigned Members
                </Text>
                <List.Section>
                  {taskDetails.map((member, index) => (
                    <React.Fragment key={member.TenantID}>
                      <List.Item
                        title={member.FullName}
                        description={`Status: ${member.Status}`}
                        left={() => (
                          <Avatar.Text
                            size={40}
                            label={member.FullName.substring(0, 2)}
                            style={{ backgroundColor: `${theme?.colors?.primary}20` }}
                          />
                        )}
                      />
                      {index < taskDetails.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List.Section>
              </>
            )}
          </Modal>
        </Portal>
      </View>
    </StudentDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentageContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    position: 'relative',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  progressBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    borderRadius: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: 16,
    paddingBottom: 80,
  },
  taskCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  taskIcon: {
    borderRadius: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorChip: {
    height: 24,
  },
  divider: {
    marginHorizontal: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  taskStats: {
    gap: 4,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalDivider: {
    marginVertical: 16,
  },
}); 