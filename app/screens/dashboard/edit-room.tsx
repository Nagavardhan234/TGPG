import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  Title, 
  Card, 
  TextInput, 
  Button, 
  IconButton, 
  List,
  Divider,
  Portal,
  Dialog,
  Text,
  Avatar
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { getRoomOccupants, RoomOccupant } from '@/app/services/dashboard.service';
import { ErrorNotification } from '@/app/components/ErrorNotification';

export default function EditRoom() {
  const { roomData } = useLocalSearchParams();
  const { theme, isDarkMode } = useTheme();
  const { pg } = useAuth();
  const initialRoom = roomData ? JSON.parse(roomData as string) : null;

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [students, setStudents] = useState<RoomOccupant[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roomDetails, setRoomDetails] = useState({
    room_number: initialRoom?.room_number || '',
    capacity: initialRoom?.capacity || '',
    active_tenants: initialRoom?.active_tenants || 0,
  });

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  useEffect(() => {
    const loadRoomOccupants = async () => {
      if (!pg?.PGID || !roomDetails.room_number) {
        setError(!pg?.PGID ? 'PG information not available' : 'Room number is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const occupants = await getRoomOccupants(
          pg.PGID,
          roomDetails.room_number.toString()
        );
        setStudents(occupants);
        setError(null);
      } catch (error) {
        console.error('Error loading occupants:', error);
        const message = error instanceof Error ? error.message : 'Failed to load occupants';
        setError(message);
        setErrorMessage(message);
        setShowError(true);
        setStudents(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoomOccupants();
  }, [pg?.PGID, roomDetails.room_number]);

  const handleRoomUpdate = (field: string, value: string) => {
    setRoomDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteStudent = (studentId: number) => {
    setSelectedStudent(studentId);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteStudent = () => {
    if (selectedStudent) {
      setStudents(prev => prev?.filter(student => student.student_id !== selectedStudent) || null);
    }
    setDeleteDialogVisible(false);
  };

  const handleSaveChanges = async () => {
    try {
      console.log('Saving changes:', { roomDetails, students });
      router.back();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    if (error) {
      return <Text style={{ color: theme.colors.error }}>{error}</Text>;
    }

    if (!students || students.length === 0) {
      return <Text style={{ color: theme.colors.onSurface }}>No occupants found</Text>;
    }

    return students.map((student, index) => (
      <React.Fragment key={student.student_id}>
        <List.Item
          title={student.name}
          description={`Room ${student.room_number} • Joined: ${new Date(student.joining_date).toLocaleDateString()}`}
          left={props => (
            <Avatar.Text
              {...props}
              size={40}
              label={student.name.substring(0, 2).toUpperCase()}
            />
          )}
          right={props => (
            <View style={styles.actionButtons}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => {}}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteStudent(student.student_id)}
              />
            </View>
          )}
        />
        {index < students.length - 1 && <Divider />}
      </React.Fragment>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
      <ErrorNotification
        visible={showError}
        message={errorMessage}
        type="error"
        onDismiss={() => setShowError(false)}
      />
      
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Title style={[styles.title, { color: isDarkMode ? '#FFFFFF' : theme.colors.text }]}>
          Edit Room Details
        </Title>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Room Details Card */}
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : theme.colors.surface }]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Room Information</Title>
            <TextInput
              label="Room Number"
              value={roomDetails.room_number.toString()}
              onChangeText={(value) => handleRoomUpdate('room_number', value)}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Capacity"
              value={roomDetails.capacity.toString()}
              onChangeText={(value) => handleRoomUpdate('capacity', value)}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />
          </Card.Content>
        </Card>

        {/* Students List Card */}
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : theme.colors.surface }]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Current Occupants</Title>
            {renderContent()}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomButton}>
        <Button
          mode="contained"
          onPress={handleSaveChanges}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </View>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirm Deletion</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to remove this student from the room?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmDeleteStudent}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    borderRadius: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
}); 