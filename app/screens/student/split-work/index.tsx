import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  IconButton, 
  Button, 
  Chip,
  Avatar,
  FAB,
  ProgressBar,
  Badge,
  Divider,
  SegmentedButtons
} from 'react-native-paper';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/app/context/ThemeContext';
import { useTheme as usePaperTheme } from 'react-native-paper';

interface Task {
  id: number;
  title: string;
  description: string;
  deadline: string;
  type: 'cleaning' | 'cooking' | 'maintenance';
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  assignee: {
    id: number;
    name: string;
  };
}

const dummyTasks: Task[] = [
  {
    id: 1,
    title: "Vacuum Living Room",
    description: "Vacuum under furniture and around corners",
    deadline: "2024-03-20T17:00:00",
    type: "cleaning",
    status: "pending",
    priority: "high",
    assignee: { id: 1, name: "John" }
  },
  {
    id: 2,
    title: "Cook Dinner",
    description: "Prepare dinner for roommates",
    deadline: "2024-03-20T20:00:00",
    type: "cooking",
    status: "in_progress",
    priority: "medium",
    assignee: { id: 2, name: "You" }
  }
];

// Use the same updated withOpacity function
const withOpacity = (color: string | undefined, opacity: number) => {
  if (!color) return `rgba(0, 0, 0, ${opacity})`;
  
  try {
    // For rgb/rgba colors
    if (color.startsWith('rgb')) {
      const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (rgbaMatch) {
        const [_, r, g, b] = rgbaMatch;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }
    
    // For hex colors
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return `rgba(0, 0, 0, ${opacity})`;
  } catch {
    return `rgba(0, 0, 0, ${opacity})`;
  }
};

export default function SplitWorkScreen() {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const [tasks, setTasks] = useState<Task[]>(dummyTasks);
  const [selectedTab, setSelectedTab] = useState<'all' | 'mine'>('all');

  // Move getPriorityColor inside component to access theme
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return withOpacity(theme?.colors?.error || '#FF0000', 0.12);
      case 'medium':
        return withOpacity(theme?.colors?.warning || '#FFA500', 0.12);
      case 'low':
        return withOpacity(theme?.colors?.success || '#4CAF50', 0.12);
      default:
        return 'rgba(0, 0, 0, 0.12)';
    }
  };

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: paperTheme.dark ? '#121212' : theme?.colors?.background,
    },
    statsCard: {
      backgroundColor: paperTheme.dark ? '#1E1E1E' : theme?.colors?.surface,
      borderColor: paperTheme.dark ? '#2C2C2C' : undefined,
      borderWidth: paperTheme.dark ? 1 : 0,
    },
    taskCard: {
      backgroundColor: paperTheme.dark ? '#1E1E1E' : theme?.colors?.surface,
      borderColor: paperTheme.dark ? '#2C2C2C' : undefined,
      borderWidth: paperTheme.dark ? 1 : 0,
    }
  };

  const renderTask = (task: Task) => {
    return (
      <Surface 
        key={task.id}
        style={[styles.taskCard, dynamicStyles.taskCard]}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            <IconButton
              icon={task.type === 'cleaning' ? 'broom' : task.type === 'cooking' ? 'food' : 'tools'}
              iconColor={theme?.colors?.primary}
              style={[
                styles.taskIcon, 
                { backgroundColor: withOpacity(theme?.colors?.primary, 0.12) }
              ]}
            />
            <View>
              <Text style={[styles.taskTitle, { color: theme?.colors?.onSurface }]}>
                {task.title}
              </Text>
              <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
                {task.description}
              </Text>
            </View>
          </View>
          <Chip 
            style={[
              styles.priorityChip,
              { backgroundColor: getPriorityColor(task.priority) }
            ]}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.taskFooter}>
          <View style={styles.taskInfo}>
            <Avatar.Text
              size={24}
              label={task.assignee.name.substring(0, 2)}
              style={{ 
                backgroundColor: withOpacity(theme?.colors?.primary, 0.12) 
              }}
            />
            <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
              Due {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.taskActions}>
            {task.status === 'pending' && (
              <Button 
                mode="contained-tonal"
                onPress={() => {}}
              >
                Start
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button 
                mode="contained"
                onPress={() => {}}
              >
                Complete
              </Button>
            )}
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <StudentDashboardLayout title="Split Work">
      <View style={dynamicStyles.container}>
        <Surface style={[styles.statsCard, dynamicStyles.statsCard]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>5</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>2</Text>
              <Text style={styles.statLabel}>Your Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.colors?.error }]}>1</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
          <ProgressBar 
            progress={0.6} 
            color={theme?.colors?.primary}
            style={styles.progressBar}
          />
        </Surface>

        <View style={styles.tabContainer}>
          <SegmentedButtons
            value={selectedTab}
            onValueChange={value => setSelectedTab(value as 'all' | 'mine')}
            buttons={[
              { value: 'all', label: 'All Tasks' },
              { value: 'mine', label: 'My Tasks' }
            ]}
          />
        </View>

        <ScrollView style={styles.taskList}>
          {tasks
            .filter(task => selectedTab === 'all' || task.assignee.name === 'You')
            .map(renderTask)}
        </ScrollView>

        <FAB
          icon="plus"
          label="New Task"
          style={[styles.fab, { backgroundColor: theme?.colors?.primary }]}
          onPress={() => router.push('/screens/student/split-work/create')}
        />
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
    borderRadius: 20,
    elevation: 4,
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
    opacity: 0.7,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  taskList: {
    paddingHorizontal: 16,
  },
  taskCard: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
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
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskIcon: {
    borderRadius: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  priorityChip: {
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
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
}); 