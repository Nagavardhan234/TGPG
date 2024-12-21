import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
  Text
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

export default function EditRoom() {
  const { roomData } = useLocalSearchParams();
  const { theme, isDarkMode } = useTheme();
  const initialRoom = roomData ? JSON.parse(roomData as string) : null;

  // State for room details
  const [roomDetails, setRoomDetails] = useState({
    room_number: initialRoom?.room_number || '',
    capacity: initialRoom?.capacity || '',
    active_tenants: initialRoom?.active_tenants || 0,
  });

  // State for student list (mock data - replace with actual data)
  const [students, setStudents] = useState([
    { id: 1, name: 'John Doe', room_number: roomDetails.room_number },
    { id: 2, name: 'Jane Smith', room_number: roomDetails.room_number },
  ]);

  // State for delete confirmation dialog
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  // Handle room details update
  const handleRoomUpdate = (field: string, value: string) => {
    setRoomDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle student deletion
  const handleDeleteStudent = (studentId: number) => {
    setSelectedStudent(studentId);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteStudent = () => {
    if (selectedStudent) {
      setStudents(prev => prev.filter(student => student.id !== selectedStudent));
    }
    setDeleteDialogVisible(false);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      // Add your API call here to save the changes
      console.log('Saving changes:', { roomDetails, students });
      router.back();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
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
            {students.map((student, index) => (
              <React.Fragment key={student.id}>
                <List.Item
                  title={student.name}
                  description={`Room ${student.room_number}`}
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
                        onPress={() => handleDeleteStudent(student.id)}
                      />
                    </View>
                  )}
                />
                {index < students.length - 1 && <Divider />}
              </React.Fragment>
            ))}
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
}); 