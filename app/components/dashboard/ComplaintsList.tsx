import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Dialog, Portal, TextInput, useTheme, Chip } from 'react-native-paper';
import { ManagerComplaint } from '@/app/types/complaints';

interface Props {
  complaints: ManagerComplaint[];
  onStatusUpdate: (complaintId: number, status: 'in_progress' | 'resolved' | 'cancelled', comment: string) => void;
  onFileSelect: (complaintId: number) => void;
}

export default function ComplaintsList({
  complaints,
  onStatusUpdate,
  onFileSelect,
}: Props) {
  const { colors } = useTheme();
  const [selectedComplaint, setSelectedComplaint] = useState<ManagerComplaint | null>(null);
  const [comment, setComment] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleStatusUpdate = (status: 'in_progress' | 'resolved' | 'cancelled') => {
    if (selectedComplaint && comment.trim()) {
      onStatusUpdate(selectedComplaint.complaintId, status, comment);
      setDialogVisible(false);
      setComment('');
      setSelectedComplaint(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return colors.warning;
      case 'in_progress':
        return colors.primary;
      case 'resolved':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.disabled;
    }
  };

  const renderComplaint = (complaint: ManagerComplaint) => {
    const canUpdateStatus = complaint.status !== 'resolved' && complaint.status !== 'cancelled';

    return (
      <Card key={complaint.complaintId} style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium">{complaint.title}</Text>
            <View style={styles.chips}>
              <Chip
                style={[styles.chip, { backgroundColor: getPriorityColor(complaint.priority) }]}
                textStyle={{ color: '#fff' }}
              >
                {complaint.priority}
              </Chip>
              <Chip
                style={[styles.chip, { backgroundColor: getStatusColor(complaint.status) }]}
                textStyle={{ color: '#fff' }}
              >
                {complaint.status}
              </Chip>
            </View>
          </View>

          <Text variant="bodyMedium" style={styles.description}>
            {complaint.description}
          </Text>

          <View style={styles.details}>
            <Text variant="bodySmall">Room: {complaint.roomNumber}</Text>
            <Text variant="bodySmall">Tenant: {complaint.tenantName}</Text>
            <Text variant="bodySmall">
              Created: {new Date(complaint.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {complaint.timeline && complaint.timeline.length > 0 && (
            <View style={styles.timeline}>
              <Text variant="bodySmall" style={styles.timelineTitle}>
                Recent Activity
              </Text>
              {complaint.timeline.slice(-2).map((event, index) => (
                <Text key={index} variant="bodySmall" style={styles.timelineEvent}>
                  {new Date(event.createdAt).toLocaleDateString()}: {event.comment}
                </Text>
              ))}
            </View>
          )}
        </Card.Content>

        <Card.Actions>
          {canUpdateStatus && (
            <Button
              mode="contained"
              onPress={() => {
                setSelectedComplaint(complaint);
                setDialogVisible(true);
              }}
            >
              Resolve
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={() => onFileSelect(complaint.complaintId)}
          >
            Add Response
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {complaints.map(renderComplaint)}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Resolve Complaint</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Resolution Comment"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => handleStatusUpdate('resolved')}>
              Confirm Resolution
            </Button>
            <Button onPress={() => setDialogVisible(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    marginLeft: 8,
  },
  description: {
    marginBottom: 8,
  },
  details: {
    marginBottom: 8,
  },
  timeline: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  timelineTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timelineEvent: {
    marginBottom: 2,
  },
  input: {
    marginBottom: 16,
  },
}); 