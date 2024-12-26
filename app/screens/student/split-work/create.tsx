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
import { taskService } from '@/app/services/taskService';
import { socketService } from '@/app/services/socketService';
import { TASK_TYPES, TASK_ICONS } from '@/app/config/constants';

interface RoomMember {
  TenantID: number;
  FullName: string;
  Email: string;
  Phone: string;
}

export default function CreateTaskScreen() {
  const { theme } = useTheme();
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
      const response = await taskService.getRoomMembers();
      if (response.success) {
        setRoomMembers(response.data);
      }
    } catch (error) {
      console.error('Error loading room members:', error);
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
      // First ensure socket is connected
      await socketService.connect();
      
      const response = await taskService.createTask({
        taskHeading,
        taskDescription,
        logoId: selectedLogo,
        assignedTenants: selectedMembers.map(m => m.TenantID)
      });

      if (response.success) {
        // Emit a socket event to notify about the new task
        socketService.subscribeToTaskUpdates(() => {});
        router.back();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
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
            {loadingMembers ? (
              <ActivityIndicator style={styles.loadingIndicator} />
            ) : (
              <List.Section>
                {roomMembers.map((member, index) => (
                  <React.Fragment key={member.TenantID}>
                    <List.Item
                      title={member.FullName}
                      description={member.Email}
                      left={() => (
                        <Avatar.Text
                          size={40}
                          label={member.FullName.substring(0, 2)}
                          style={{ backgroundColor: `${theme?.colors?.primary}20` }}
                        />
                      )}
                      right={() => (
                        <IconButton
                          icon={selectedMembers.some(m => m.TenantID === member.TenantID)
                            ? 'checkbox-marked-circle'
                            : 'checkbox-blank-circle-outline'
                          }
                          iconColor={theme?.colors?.primary}
                          onPress={() => toggleMemberSelection(member)}
                        />
                      )}
                      onPress={() => toggleMemberSelection(member)}
                    />
                    {index < roomMembers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List.Section>
            )}
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
}); 