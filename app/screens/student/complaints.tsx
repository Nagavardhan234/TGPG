import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  Button, 
  TextInput, 
  Card, 
  IconButton, 
  Chip, 
  SegmentedButtons,
  Portal,
  Modal,
  RadioButton
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: 'submitted' | 'in_progress' | 'resolved';
  timestamp: string;
  isEmergency: boolean;
  attachments?: string[];
}

type ComplaintCategory = 'ac' | 'plumbing' | 'electrical' | 'furniture' | 'other';

// Dummy data
const complaints: Complaint[] = [
  {
    id: 1,
    title: 'AC not cooling',
    description: 'AC in room 101 is not cooling properly',
    category: 'ac',
    status: 'in_progress',
    timestamp: '2024-03-15 10:30 AM',
    isEmergency: false,
  },
  {
    id: 2,
    title: 'Water Leakage',
    description: 'Urgent: Water leaking from bathroom pipe',
    category: 'plumbing',
    status: 'submitted',
    timestamp: '2024-03-14 09:15 PM',
    isEmergency: true,
  },
];

export default function ComplaintsScreen() {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    category: 'other' as ComplaintCategory,
    isEmergency: false,
  });
  const [attachments, setAttachments] = useState<string[]>([]);

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'submitted':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.primary;
      case 'resolved':
        return theme.colors.success;
      default:
        return theme.colors.secondary;
    }
  };

  const getCategoryIcon = (category: ComplaintCategory) => {
    switch (category) {
      case 'ac':
        return 'air-conditioner';
      case 'plumbing':
        return 'water';
      case 'electrical':
        return 'flash';
      case 'furniture':
        return 'chair-rolling';
      default:
        return 'alert-circle';
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setAttachments([...attachments, result.assets[0].uri]);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Filter Section */}
      <Surface style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
        <SegmentedButtons
          value={selectedFilter}
          onValueChange={value => setSelectedFilter(value as typeof selectedFilter)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'resolved', label: 'Resolved' },
          ]}
        />
      </Surface>

      {/* Complaints List */}
      {complaints.map(complaint => (
        <Surface 
          key={complaint.id} 
          style={[styles.complaintCard, { backgroundColor: theme.colors.surface }]}
        >
          <Card>
            <Card.Content>
              <View style={styles.complaintHeader}>
                <View style={styles.complaintHeaderLeft}>
                  <IconButton 
                    icon={getCategoryIcon(complaint.category)}
                    size={24}
                    iconColor={theme.colors.primary}
                  />
                  <View>
                    <Text style={[styles.complaintTitle, { color: theme.colors.text }]}>
                      {complaint.title}
                    </Text>
                    <Text style={{ color: theme.colors.secondary }}>
                      {complaint.timestamp}
                    </Text>
                  </View>
                </View>
                {complaint.isEmergency && (
                  <Chip 
                    mode="flat"
                    textStyle={{ color: theme.colors.surface }}
                    style={{ backgroundColor: theme.colors.error }}
                  >
                    Emergency
                  </Chip>
                )}
              </View>
              
              <Text style={[styles.complaintDescription, { color: theme.colors.text }]}>
                {complaint.description}
              </Text>

              <View style={styles.statusContainer}>
                <Chip 
                  mode="flat"
                  textStyle={{ color: theme.colors.surface }}
                  style={{ backgroundColor: getStatusColor(complaint.status) }}
                >
                  {complaint.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>
            </Card.Content>
          </Card>
        </Surface>
      ))}

      {/* New Complaint FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowNewComplaint(true)}
      />

      {/* New Complaint Modal */}
      <Portal>
        <Modal
          visible={showNewComplaint}
          onDismiss={() => setShowNewComplaint(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
            New Complaint
          </Text>

          <TextInput
            mode="outlined"
            label="Title"
            value={newComplaint.title}
            onChangeText={title => setNewComplaint({ ...newComplaint, title })}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Description"
            value={newComplaint.description}
            onChangeText={description => setNewComplaint({ ...newComplaint, description })}
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <RadioButton.Group
            value={newComplaint.category}
            onValueChange={category => 
              setNewComplaint({ ...newComplaint, category: category as ComplaintCategory })
            }
          >
            <View style={styles.categoryContainer}>
              {['ac', 'plumbing', 'electrical', 'furniture', 'other'].map((category) => (
                <RadioButton.Item
                  key={category}
                  label={category.charAt(0).toUpperCase() + category.slice(1)}
                  value={category}
                />
              ))}
            </View>
          </RadioButton.Group>

          <View style={styles.attachmentsContainer}>
            <Button 
              mode="outlined" 
              icon="camera"
              onPress={pickImage}
              style={styles.attachButton}
            >
              Add Photos
            </Button>
            {attachments.length > 0 && (
              <Text style={{ color: theme.colors.secondary }}>
                {attachments.length} photos attached
              </Text>
            )}
          </View>

          <View style={styles.emergencyContainer}>
            <Text style={{ color: theme.colors.text }}>Mark as Emergency?</Text>
            <Switch
              value={newComplaint.isEmergency}
              onValueChange={isEmergency => setNewComplaint({ ...newComplaint, isEmergency })}
            />
          </View>

          <View style={styles.modalActions}>
            <Button onPress={() => setShowNewComplaint(false)}>Cancel</Button>
            <Button mode="contained" onPress={() => {
              // Handle submission
              setShowNewComplaint(false);
            }}>
              Submit
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    padding: 16,
    elevation: 2,
  },
  complaintCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  complaintHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  complaintDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  attachButton: {
    flex: 1,
  },
  emergencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
}); 