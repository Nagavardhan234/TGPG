import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme, Text, Button, Card, Portal, Dialog, TextInput, SegmentedButtons, Chip, DataTable } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { complaintsService, type Complaint, type ComplaintCategory } from '@/app/services/complaints.service';
import { format } from 'date-fns';

export default function ManagerComplaintsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
    byCategory: { categoryId: number; count: number }[];
    byPriority: { priority: string; count: number }[];
    avgResolutionTime: number;
    avgRating: number;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint>();
  
  // Response form state
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState<'submitted' | 'in_progress' | 'resolved' | 'cancelled'>();

  useEffect(() => {
    loadComplaints();
    loadCategories();
    loadStats();
  }, []);

  const loadComplaints = async () => {
    try {
      const data = await complaintsService.getManagerComplaints(user.pgId);
      setComplaints(data);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await complaintsService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await complaintsService.getStats(user.pgId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.pickMultiple({
        type: ['image/*', 'application/pdf'],
      });
      setSelectedFiles(result);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Error picking file:', err);
      }
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedComplaint) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('message', message);
      formData.append('respondedBy', user.managerId.toString());
      formData.append('respondedByType', 'manager');

      selectedFiles.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      await complaintsService.addResponse(selectedComplaint.complaintId, formData);

      if (newStatus) {
        await complaintsService.updateStatus(selectedComplaint.complaintId, {
          status: newStatus,
          comment: message,
          changedBy: user.managerId,
          changedByType: 'manager',
        });
      }
      
      // Reset form
      setMessage('');
      setSelectedFiles([]);
      setNewStatus(undefined);
      setDialogVisible(false);
      setSelectedComplaint(undefined);
      
      // Reload data
      await Promise.all([loadComplaints(), loadStats()]);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStats = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.statsTitle}>Complaints Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{stats?.total || 0}</Text>
            <Text>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{stats?.pending || 0}</Text>
            <Text>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{stats?.inProgress || 0}</Text>
            <Text>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineMedium">{stats?.resolved || 0}</Text>
            <Text>Resolved</Text>
          </View>
        </View>
        {stats?.avgRating && (
          <View style={styles.avgRating}>
            <Text>Average Rating: {stats.avgRating.toFixed(1)}/5</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderComplaint = (complaint: Complaint) => (
    <Card 
      key={complaint.complaintId} 
      style={styles.card}
      onPress={() => {
        setSelectedComplaint(complaint);
        setDialogVisible(true);
      }}
    >
      <Card.Title
        title={complaint.title}
        subtitle={`Status: ${complaint.status} • Priority: ${complaint.priority}`}
        right={(props) => (
          <Chip 
            mode="flat" 
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(complaint.status) }
            ]}
          >
            {complaint.status}
          </Chip>
        )}
      />
      <Card.Content>
        <Text>{complaint.description}</Text>
        {complaint.category && (
          <Text style={styles.category}>Category: {complaint.category.name}</Text>
        )}
        <Text style={styles.timestamp}>
          Submitted: {format(new Date(complaint.createdAt), 'PPp')}
        </Text>
        {complaint.resolvedAt && (
          <Text style={styles.timestamp}>
            Resolved: {format(new Date(complaint.resolvedAt), 'PPp')}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return theme.colors.error;
      case 'in_progress':
        return theme.colors.warning;
      case 'resolved':
        return theme.colors.success;
      default:
        return theme.colors.surfaceVariant;
    }
  };

  return (
    <DashboardLayout>
      <ScrollView style={styles.container}>
        {renderStats()}
        <Text variant="headlineMedium" style={styles.title}>All Complaints</Text>
        {complaints.map(renderComplaint)}
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Respond to Complaint</Dialog.Title>
          <Dialog.Content>
            {selectedComplaint && (
              <>
                <Card style={styles.selectedComplaint}>
                  <Card.Title title={selectedComplaint.title} />
                  <Card.Content>
                    <Text>{selectedComplaint.description}</Text>
                  </Card.Content>
                </Card>
                <TextInput
                  label="Response Message"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                />
                <SegmentedButtons
                  value={newStatus || ''}
                  onValueChange={(value) => setNewStatus(value as any)}
                  buttons={[
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'cancelled', label: 'Cancel' },
                  ]}
                  style={styles.statusButtons}
                />
                <Button
                  mode="outlined"
                  onPress={handleFilePick}
                  style={styles.fileButton}
                >
                  Attach Files
                </Button>
                {selectedFiles.map((file, index) => (
                  <Text key={index} style={styles.fileName}>{file.name}</Text>
                ))}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleSubmitResponse}
              loading={isLoading}
              disabled={!message}
            >
              Submit Response
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  statsCard: {
    marginBottom: 24,
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  avgRating: {
    alignItems: 'center',
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  selectedComplaint: {
    marginBottom: 16,
  },
  category: {
    marginTop: 8,
    opacity: 0.7,
  },
  timestamp: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  statusButtons: {
    marginBottom: 16,
  },
  fileButton: {
    marginBottom: 8,
  },
  fileName: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusChip: {
    marginRight: 16,
  },
}); 