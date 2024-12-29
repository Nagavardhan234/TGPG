import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  TextInput, 
  Button, 
  IconButton,
  Surface,
  Text,
  Portal,
  Modal,
  List,
  Avatar,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import * as taskService from '@/app/services/taskService';
import { socketService } from '@/app/services/socketService';
import { TASK_TYPES, TASK_ICONS } from '@/app/config/constants';
import { TokenExpiredError } from '@/app/services/student.service';
import { showMessage } from 'react-native-flash-message';

interface RoomMember {
  TenantID: number;
  FullName: string;
  Email: string;
  Phone: string;
  Status: string;
}

export default function CreateTaskScreen() {
  const { theme } = useTheme();
  const { student } = useStudentAuth();
  const [taskHeading, setTaskHeading] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<number>(TASK_TYPES.OTHER);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoomMembers();
  }, []);

  const loadRoomMembers = async () => {
    try {
      setLoadingMembers(true);
      setError(null);
      
      const response = await taskService.getRoomMembers();
      
      if (response.success) {
        setRoomMembers(response.data);
      } else {
        setError(response.message || 'Failed to load room members');
      }
    } catch (error: any) {
      console.error('Error loading room members:', error);
      if (error instanceof TokenExpiredError) {
        showMessage({
          message: 'Session Expired',
          description: 'Please login again to continue',
          type: 'warning',
        });
        router.replace('/login');
      } else {
        setError(error.message || 'Failed to load room members. Please try again.');
      }
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async () => {
    if (!taskHeading.trim() || !taskDescription.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // First ensure socket is connected
      await socketService.connect();
      
      const response = await taskService.createTask({
        taskHeading: taskHeading.trim(),
        taskDescription: taskDescription.trim(),
        logoId: selectedLogo,
        assignedTenants: selectedMembers.map(m => m.TenantID)
      });

      if (response.success) {
        // Emit a socket event to notify about the new task
        socketService.subscribeToTaskUpdates(() => {});
        showMessage({
          message: 'Success',
          description: 'Task created successfully',
          type: 'success',
        });
        router.back();
      } else {
        if (response.error === 'INACTIVE_STUDENT') {
          setError('You must be an active student to create tasks. Please contact your manager if you believe this is an error.');
        } else {
          setError(response.message || 'Failed to create task');
        }
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      if (error instanceof TokenExpiredError) {
        showMessage({
          message: 'Session Expired',
          description: 'Please login again to continue',
          type: 'warning',
        });
        router.replace('/login');
      } else {
        setError(error.message || 'Failed to create task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (member: RoomMember) => {
    if (selectedMembers.some(m => m.TenantID === member.TenantID)) {
      setSelectedMembers(selectedMembers.filter(m => m.TenantID !== member.TenantID));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const renderLogoOption = (logoId: number) => {
    const isSelected = selectedLogo === logoId;
    return (
      <Surface
        key={logoId}
        style={[
          styles.logoOption,
          {
            backgroundColor: isSelected 
              ? `${theme?.colors?.primary}20`
              : theme?.colors?.surface
          }
        ]}
        elevation={1}
      >
        <IconButton
          icon={TASK_ICONS[logoId]}
          size={32}
          iconColor={isSelected ? theme?.colors?.primary : theme?.colors?.onSurface}
          onPress={() => {
            setSelectedLogo(logoId);
            setShowLogoModal(false);
          }}
        />
      </Surface>
    );
  };

  const renderMembersList = () => {
    if (loadingMembers) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme?.colors?.primary} />
          <Text style={{ marginTop: 10 }}>Loading room members...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={{ color: theme?.colors?.error, textAlign: 'center', marginBottom: 10 }}>
            {error}
          </Text>
          <Button mode="contained" onPress={loadRoomMembers}>
            Retry
          </Button>
        </View>
      );
    }

    if (roomMembers.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={{ textAlign: 'center' }}>
            No other students found in your room.
          </Text>
        </View>
      );
    }

    return roomMembers.map((member) => (
      <React.Fragment key={member.TenantID}>
        <List.Item
          title={member.FullName}
          description={member.Phone}
          left={() => (
            <Avatar.Text
              size={40}
              label={member.FullName.split(' ').map(n => n[0]).join('')}
              style={{ backgroundColor: theme?.colors?.primary }}
            />
          )}
          right={() => (
            <IconButton
              icon={selectedMembers.some(m => m.TenantID === member.TenantID) ? 'check-circle' : 'checkbox-blank-circle-outline'}
              iconColor={selectedMembers.some(m => m.TenantID === member.TenantID) ? theme?.colors?.primary : theme?.colors?.onSurfaceVariant}
              onPress={() => toggleMemberSelection(member)}
            />
          )}
          onPress={() => toggleMemberSelection(member)}
        />
        <Divider />
      </React.Fragment>
    ));
  };

  return (
    <StudentDashboardLayout title="Create Task">
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Surface style={[styles.logoPreview, { backgroundColor: theme?.colors?.surface }]} elevation={1}>
            <IconButton
              icon={TASK_ICONS[selectedLogo]}
              size={48}
              iconColor={theme?.colors?.primary}
              style={{ backgroundColor: `${theme?.colors?.primary}20` }}
              onPress={() => setShowLogoModal(true)}
            />
            <Text style={[styles.logoHint, { color: theme?.colors?.onSurfaceVariant }]}>
              Tap to change logo
            </Text>
          </Surface>

          <TextInput
            mode="outlined"
            label="Task Title"
            value={taskHeading}
            onChangeText={setTaskHeading}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Task Description"
            value={taskDescription}
            onChangeText={setTaskDescription}
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Button
            mode="outlined"
            onPress={() => setShowMembersModal(true)}
            style={styles.membersButton}
          >
            {selectedMembers.length === 0 
              ? 'Select Members to Share Task (Optional)' 
              : `${selectedMembers.length} Member${selectedMembers.length === 1 ? '' : 's'} Selected`}
          </Button>

          {selectedMembers.length > 0 && (
            <View style={styles.selectedMembers}>
              <Text style={[styles.sectionTitle, { color: theme?.colors?.onSurface }]}>
                Selected Members
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedMembers.map(member => (
                  <Avatar.Text
                    key={member.TenantID}
                    size={40}
                    label={member.FullName.substring(0, 2)}
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: `${theme?.colors?.primary}20` }
                    ]}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.createButton}
            loading={loading}
            disabled={!taskHeading.trim() || !taskDescription.trim() || loading}
          >
            Create Task
          </Button>
        </View>

        <Portal>
          <Modal
            visible={showLogoModal}
            onDismiss={() => setShowLogoModal(false)}
            contentContainerStyle={[
              styles.modal,
              { backgroundColor: theme?.colors?.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme?.colors?.primary }]}>
              Select Task Logo
            </Text>
            <View style={styles.logoGrid}>
              {Object.values(TASK_TYPES).map(logoId => renderLogoOption(logoId))}
            </View>
          </Modal>

          <Modal
            visible={showMembersModal}
            onDismiss={() => setShowMembersModal(false)}
            contentContainerStyle={[
              styles.modal,
              { backgroundColor: theme?.colors?.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme?.colors?.primary }]}>
              Select Members
            </Text>
            {renderMembersList()}
          </Modal>
        </Portal>
      </ScrollView>
    </StudentDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  logoPreview: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  logoHint: {
    marginTop: 8,
    fontSize: 12,
  },
  input: {
    marginBottom: 16,
  },
  membersButton: {
    marginBottom: 16,
  },
  selectedMembers: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberAvatar: {
    marginRight: 8,
  },
  createButton: {
    marginBottom: 24,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  logoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  logoOption: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 