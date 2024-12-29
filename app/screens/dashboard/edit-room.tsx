import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
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
import { getRoomOccupants, RoomOccupant, updateRoomDetails, updateOccupantRoom, RoomDetails, updateRoomNumber } from '@/app/services/dashboard.service';
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

  const [newRoomNumber, setNewRoomNumber] = useState(initialRoom?.room_number || '');

  const [roomDetails, setRoomDetails] = useState({
    active_tenants: initialRoom?.active_tenants || 0,
    capacity: initialRoom?.capacity || '0'
  });

  const [occupantSearch, setOccupantSearch] = useState('');

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: 'Edit Room Details'
    });
  }, []);

  useEffect(() => {
    const loadRoomOccupants = async () => {
      if (!pg?.PGID || !initialRoom?.room_number) {
        setError(!pg?.PGID ? 'PG information not available' : 'Room number is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const occupants = await getRoomOccupants(
          pg.PGID,
          initialRoom.room_number.toString()
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
  }, [pg?.PGID, initialRoom?.room_number]);

  const handleRoomUpdate = (field: string, value: string) => {
    setRoomDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoomNumberChange = (value: string) => {
    const numValue = parseInt(value);
    if (value === '' || (numValue > 0 && numValue <= 999)) {
      setNewRoomNumber(value);
    }
  };

  const handleOccupantRoomChange = (studentId: number, value: string) => {
    const numValue = parseInt(value);
    if (value === '' || (numValue > 0 && numValue <= 999)) {
      setStudents(prev => 
        prev?.map(student => 
          student.student_id === studentId 
            ? { ...student, room_number: value }
            : student
        ) || null
      );
    }
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
      if (!students || !pg?.PGID) return;

      setIsLoading(true);

      // First update room number if changed
      if (newRoomNumber !== initialRoom?.room_number) {
        await updateRoomNumber(pg.PGID, initialRoom.room_number, newRoomNumber);

        // Update all occupants to new room number
        const updatePromises = students.map(async (student) => {
          await updateOccupantRoom(pg.PGID, initialRoom.room_number, {
            newRoomNumber: newRoomNumber,
            studentId: student.student_id
          });
        });

        await Promise.all(updatePromises);
      } else {
        // Only update individual room changes
        const updatePromises = students.map(async (student) => {
          if (student.room_number !== student.current_room) {
            await updateOccupantRoom(pg.PGID, student.current_room, {
              newRoomNumber: student.room_number,
              studentId: student.student_id
            });
          }
        });

        await Promise.all(updatePromises);
      }

      // Show success message
      setErrorMessage('Changes saved successfully');
      setShowError(false);

      // Navigate to rooms page after a short delay
      setTimeout(() => {
        router.push('/screens/dashboard/rooms');
      }, 1000);

    } catch (error) {
      console.error('Error saving changes:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save changes');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!occupantSearch) return students;

    const searchLower = occupantSearch.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(searchLower) ||
      student.phone.includes(searchLower)
    );
  }, [students, occupantSearch]);

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    if (error) {
      return <Text style={{ color: theme.colors.error }}>{error}</Text>;
    }

    if (!filteredStudents || filteredStudents.length === 0) {
      return <Text style={{ color: theme.colors.onSurface }}>No occupants found</Text>;
    }

    return filteredStudents.map((student, index) => (
      <React.Fragment key={student.student_id}>
        <List.Item
          title={student.name}
          description={
            <View>
              <Text style={styles.detailText}>
                Current Room: {student.current_room}
              </Text>
              <Text style={styles.detailText}>
                Phone: {student.phone}
              </Text>
              <Text style={styles.detailText}>
                Joined: {new Date(student.joining_date).toLocaleDateString()}
              </Text>
            </View>
          }
          left={props => (
            <Avatar.Text
              {...props}
              size={40}
              label={student.name.substring(0, 2).toUpperCase()}
            />
          )}
          right={props => (
            <View style={styles.actionButtons}>
              <TextInput
                mode="outlined"
                label="New Room"
                value={student.room_number}
                onChangeText={(value) => handleOccupantRoomChange(student.student_id, value)}
                style={styles.roomInput}
                keyboardType="numeric"
                error={student.room_number === '0' || student.room_number === ''}
              />
            </View>
          )}
        />
        {index < filteredStudents.length - 1 && <Divider />}
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
      
      <ScrollView style={styles.scrollView}>
        {/* Room Details Card */}
        <Card style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : theme.colors.surface }]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Room Information</Title>
            
            {/* Room Number Input */}
            <View style={styles.roomInfoRow}>
              <TextInput
                label="Room Number"
                value={newRoomNumber.toString()}
                onChangeText={handleRoomNumberChange}
                mode="outlined"
                style={styles.roomNumberInput}
                keyboardType="numeric"
                error={newRoomNumber === '0' || newRoomNumber === ''}
                helperText={newRoomNumber === '0' || newRoomNumber === '' ? 'Room number must be greater than 0' : ''}
              />
            </View>

            {/* Occupants Search */}
            <TextInput
              label="Search Occupants"
              value={occupantSearch}
              onChangeText={setOccupantSearch}
              mode="outlined"
              style={styles.searchInput}
              placeholder="Search by name or phone"
            />

            <View style={[styles.infoContainer, {
              backgroundColor: isDarkMode 
                ? 'rgba(103, 80, 164, 0.08)' 
                : 'rgba(103, 80, 164, 0.05)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
              marginBottom: 16,
            }]}>
              <Text style={[styles.infoText, { 
                color: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.8)' 
                  : theme.colors.primary,
                flex: 1,
                marginRight: 12,
              }]}>
                💡 Add new tenants from Student Management
              </Text>
              <Button 
                mode="contained-tonal"
                onPress={() => {
                  router.push({
                    pathname: '/screens/dashboard/students',
                    params: { action: 'add' }
                  });
                }}
                style={styles.managementButton}
              >
                Add Tenants
              </Button>
            </View>
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
  detailText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 2,
  },
  roomInput: {
    width: 80,
    height: 40,
    marginLeft: 8,
  },
  roomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  value: {
    fontSize: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  roomNumberInput: {
    flex: 1,
    marginBottom: 16,
  },
  infoContainer: {
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  managementButton: {
    marginLeft: 8,
  },
}); 