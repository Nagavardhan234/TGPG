import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  TextInput, 
  Button, 
  IconButton, 
  SegmentedButtons,
  Chip,
  Portal,
  Modal,
  List,
  Divider,
  Avatar
} from 'react-native-paper';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Roommate {
  id: number;
  name: string;
  room: string;
}

const dummyRoommates: Roommate[] = [
  { id: 1, name: "John Doe", room: "301" },
  { id: 2, name: "Mike Smith", room: "301" },
  { id: 3, name: "Sarah Wilson", room: "301" }
];

export default function CreateTaskScreen() {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'cleaning' as 'cleaning' | 'cooking' | 'maintenance',
    priority: 'medium' as 'high' | 'medium' | 'low',
    deadline: new Date(),
    assignee: null as Roommate | null
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);

  const taskTypes = [
    { value: 'cleaning', label: 'Cleaning', icon: 'broom' },
    { value: 'cooking', label: 'Cooking', icon: 'food' },
    { value: 'maintenance', label: 'Maintenance', icon: 'tools' }
  ];

  const priorityColors = {
    high: theme?.colors?.error,
    medium: theme?.colors?.warning,
    low: theme?.colors?.success
  };

  return (
    <StudentDashboardLayout title="Create Task">
      <ScrollView style={styles.container}>
        <Surface style={[styles.section, { backgroundColor: theme?.colors?.surface }]}>
          {/* Task Type Selection */}
          <Text style={[styles.label, { color: theme?.colors?.primary }]}>Task Type</Text>
          <SegmentedButtons
            value={formData.type}
            onValueChange={value => setFormData({ ...formData, type: value as typeof formData.type })}
            buttons={taskTypes.map(type => ({
              value: type.value,
              label: type.label,
              icon: type.icon
            }))}
            style={styles.segmentedButtons}
          />

          {/* Basic Details */}
          <TextInput
            label="Task Title"
            value={formData.title}
            onChangeText={title => setFormData({ ...formData, title })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={description => setFormData({ ...formData, description })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {/* Priority Selection */}
          <Text style={[styles.label, { color: theme?.colors?.primary }]}>Priority</Text>
          <View style={styles.priorityContainer}>
            {(['high', 'medium', 'low'] as const).map(priority => (
              <Chip
                key={priority}
                selected={formData.priority === priority}
                onPress={() => setFormData({ ...formData, priority })}
                style={[
                  styles.priorityChip,
                  { 
                    backgroundColor: formData.priority === priority ? 
                      priorityColors[priority] + '20' : undefined 
                  }
                ]}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Chip>
            ))}
          </View>

          {/* Deadline Selection */}
          <Text style={[styles.label, { color: theme?.colors?.primary }]}>Deadline</Text>
          <View style={styles.dateTimeContainer}>
            <Button 
              mode="outlined"
              icon="calendar"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateTimeButton}
            >
              {formData.deadline.toLocaleDateString()}
            </Button>
            <Button 
              mode="outlined"
              icon="clock"
              onPress={() => setShowTimePicker(true)}
              style={styles.dateTimeButton}
            >
              {formData.deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Button>
          </View>

          {/* Assignee Selection */}
          <Text style={[styles.label, { color: theme?.colors?.primary }]}>Assign To</Text>
          <Button 
            mode="outlined"
            icon="account"
            onPress={() => setShowAssigneeModal(true)}
            style={styles.assigneeButton}
          >
            {formData.assignee?.name || 'Select Roommate'}
          </Button>

          <Button 
            mode="contained"
            onPress={() => router.back()}
            style={styles.submitButton}
          >
            Create Task
          </Button>
        </Surface>
      </ScrollView>

      {/* Assignee Modal */}
      <Portal>
        <Modal
          visible={showAssigneeModal}
          onDismiss={() => setShowAssigneeModal(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme?.colors?.surface }
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme?.colors?.primary }]}>
            Select Assignee
          </Text>
          <List.Section>
            {dummyRoommates.map((roommate, index) => (
              <React.Fragment key={roommate.id}>
                <List.Item
                  title={roommate.name}
                  description={`Room ${roommate.room}`}
                  left={() => (
                    <Avatar.Text
                      size={40}
                      label={roommate.name.substring(0, 2)}
                      style={{ backgroundColor: theme?.colors?.primary + '20' }}
                    />
                  )}
                  onPress={() => {
                    setFormData({ ...formData, assignee: roommate });
                    setShowAssigneeModal(false);
                  }}
                />
                {index < dummyRoommates.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List.Section>
        </Modal>
      </Portal>

      {/* Date & Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.deadline}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            date && setFormData({ ...formData, deadline: date });
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={formData.deadline}
          mode="time"
          onChange={(event, time) => {
            setShowTimePicker(false);
            time && setFormData({ ...formData, deadline: time });
          }}
        />
      )}
    </StudentDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  priorityChip: {
    minWidth: 80,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateTimeButton: {
    flex: 1,
  },
  assigneeButton: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 