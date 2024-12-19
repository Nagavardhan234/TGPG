import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Alert, Modal, TextInput, Text } from 'react-native';
import { Card, Title, Paragraph, IconButton, FAB, Chip, Searchbar, DataTable, Button } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoomStats, getRoomDetails, deleteRoom, StudentInRoom, updateRoomNumber } from '@/app/services/dashboard.service';
import { RoomStats } from '@/app/services/dashboard.service';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const windowWidth = Dimensions.get('window').width;

// Function to calculate card width based on screen size
const getCardWidth = () => {
  if (windowWidth >= 1200) return (windowWidth - 64) / 4;
  if (windowWidth >= 768) return (windowWidth - 48) / 2;
  return windowWidth - 32;
};

// Static styles that don't depend on theme
const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  roomsContainer: {
    flex: 1,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  gradientCard: {
    width: getCardWidth(),
    borderRadius: 16,
    marginBottom: 16,
    padding: 1,
  },
  cardContent: {
    padding: 16,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRoomsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    flex: 1,
  },
});

export default function RoomManagement() {
  const { theme, isDarkMode } = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomStats[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pgId, setPgId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomStats | null>(null);
  const [roomStudents, setRoomStudents] = useState<StudentInRoom[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');

  // Load PG data and rooms on component mount
  useEffect(() => {
    const loadPGData = async () => {
      try {
        const pgData = await AsyncStorage.getItem('pg');
        if (pgData) {
          const pg = JSON.parse(pgData);
          setPgId(pg.PGID);
          await loadRoomStats(pg.PGID);
        }
      } catch (error) {
        console.error('Error loading PG data:', error);
      }
    };

    loadPGData();
  }, []);

  // Load room statistics
  const loadRoomStats = async (pgId: number) => {
    try {
      setLoading(true);
      const response = await getRoomStats(pgId);
      console.log('Response from getRoomStats:', response);
      if (response.success && response.rooms_json) {
        // Check if rooms_json is a string and parse it if necessary
        const parsedRooms = typeof response.rooms_json[0].rooms_json === 'string' 
          ? JSON.parse(response.rooms_json[0].rooms_json) 
          : response.rooms_json[0].rooms_json;

        // Ensure the rooms are in the expected format
        const formattedRooms = parsedRooms.map(room => ({
          room_number: room.room_number || 'N/A',
          capacity: response.rooms_json[0].Capacity || 0,
          active_tenants: room.active_tenants || 0,
          room_filled_status: room.room_filled_status || 0,
        }));
        setRooms(formattedRooms);
        console.log('Set rooms to:', formattedRooms);
      } else {
        console.error('Invalid response format:', response);
      }
    } catch (error) {
      console.error('Error loading room stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize filtered rooms based on search query and selected filter
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const roomNumber = room.room_number.toString();
      const matchesSearch = searchQuery ? roomNumber.includes(searchQuery) : true;

      if (filter === 'all') return matchesSearch;
      if (filter === 'occupied') return matchesSearch && room.room_filled_status === 1;
      if (filter === 'vacant') return matchesSearch && room.room_filled_status === 0;
      if (filter === 'maintenance') return matchesSearch && room.room_filled_status === 2;

      return matchesSearch;
    });
  }, [rooms, searchQuery, filter]);

  const handleDeleteRoom = async (room: RoomStats) => {
    try {
      if (room.active_tenants > 0) {
        Alert.alert(
          'Cannot Delete Room',
          'This room currently has active tenants. Please relocate all tenants before deleting the room.',
          [
            {
              text: 'View Tenants',
              onPress: () => handleRoomPress(room),
              style: 'default',
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
          { cancelable: true }
        );
        return;
      }

      Alert.alert(
        'Delete Room',
        `Are you sure you want to delete Room ${room.room_number}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await deleteRoom(pgId!, room.room_number.toString());
                if (response.success) {
                  Alert.alert('Success', 'Room deleted successfully');
                  // Refresh the room list immediately after successful deletion
                  await loadRoomStats(pgId!);
                } else {
                  Alert.alert('Error', response.message || 'Failed to delete room');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete room');
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete room');
    }
  };

  const handleRoomPress = async (room: RoomStats) => {
    try {
      setSelectedRoom(room);
      const response = await getRoomDetails(pgId!, room.room_number.toString());
      if (response.success) {
        setRoomStudents(response.students);
        setIsModalVisible(true);
      }
    } catch (error: any) {
      if (error.message === 'Authentication token not found') {
        Alert.alert('Error', 'Please login again to continue');
        // You might want to redirect to login screen here
        return;
      }
      Alert.alert('Error', error.message || 'Failed to fetch room details');
    }
  };

  const handleUpdateRoomNumber = async () => {
    try {
      if (!newRoomNumber) {
        Alert.alert('Error', 'Please enter a new room number');
        return;
      }

      const response = await updateRoomNumber(pgId!, selectedRoom!.room_number.toString(), newRoomNumber);
      if (response.success) {
        Alert.alert('Success', 'Room number updated successfully');
        setIsEditing(false);
        setIsModalVisible(false);
        // Refresh room list
        await loadRoomStats(pgId!);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update room number');
    }
  };

  // Dynamic styles that depend on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      ...staticStyles.container,
      backgroundColor: isDarkMode ? '#121212' : theme.colors.background,
    },
    title: {
      marginBottom: 24,
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    searchBar: {
      marginBottom: 16,
      elevation: 0,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
      borderRadius: 12,
    },
    chip: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    },
    roomCard: {
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : theme.colors.surface,
      elevation: isDarkMode ? 0 : 4,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    cardParagraph: {
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      marginBottom: 4,
    },
    iconButton: {
      margin: 4,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    statusChip: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface,
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#1A1A1A' : theme.colors.background,
      margin: 20,
      borderRadius: 20,
      padding: 24,
      maxHeight: '80%',
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.5 : 0.25,
      shadowRadius: 3.84,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'transparent',
    },
    modalContent: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1A1A1A' : theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      paddingBottom: 16,
      backgroundColor: isDarkMode ? '#1A1A1A' : theme.colors.background,
    },
    modalTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      fontFamily: 'Inter-Bold',
    },
    editContainer: {
      backgroundColor: isDarkMode ? '#222222' : theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : theme.colors.outline,
    },
    roomNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    currentRoomInfo: {
      flex: 1,
      alignItems: 'center',
    },
    newRoomInput: {
      flex: 1,
      alignItems: 'center',
    },
    label: {
      color: isDarkMode ? '#FFFFFF' : theme.colors.text,
      marginBottom: 8,
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      opacity: isDarkMode ? 1 : 0.87,
    },
    currentRoomNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : theme.colors.text,
      fontFamily: 'Inter-Bold',
    },
    arrow: {
      marginHorizontal: 16,
    },
    input: {
      width: '100%',
      height: 48,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#1A1A1A' : theme.colors.background,
      paddingHorizontal: 16,
      color: isDarkMode ? '#FFFFFF' : theme.colors.text,
      fontSize: 18,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : theme.colors.outline,
      fontFamily: 'Inter-Regular',
    },
    saveButton: {
      marginTop: 16,
      borderRadius: 8,
      height: 48,
      backgroundColor: isDarkMode ? '#2D2D2D' : 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    closeButton: {
      marginTop: 16,
      borderRadius: 8,
      height: 48,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
    },
    buttonLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? theme.colors.primary : theme.colors.primary,
      fontFamily: 'Inter-Medium',
    },
    tableContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? '#222222' : theme.colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : theme.colors.outline,
    },
    dataTable: {
      flex: 1,
    },
    tableHeader: {
      backgroundColor: isDarkMode ? theme.colors.elevation.level3 : theme.colors.primary + '20',
      height: 56,
    },
    headerText: {
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      fontSize: 16,
      fontFamily: 'Inter-Bold',
    },
    tableScrollView: {
      maxHeight: 400,
      backgroundColor: isDarkMode ? '#222222' : theme.colors.surface,
    },
    tableRow: {
      minHeight: 52,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    evenRow: {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    },
    oddRow: {
      backgroundColor: isDarkMode ? '#222222' : 'transparent',
    },
    cellText: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      opacity: 0.87,
    },
  });

  // Combine static and dynamic styles
  const styles = { ...staticStyles, ...dynamicStyles };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Room Management</Title>

      <Searchbar
        placeholder="Search rooms..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.text }}
      />

      <View style={styles.filterContainer}>
        <Chip 
          selected={filter === 'all'} 
          onPress={() => setFilter('all')}
          style={styles.chip}
        >
          All
        </Chip>
        <Chip 
          selected={filter === 'occupied'} 
          onPress={() => setFilter('occupied')}
          style={styles.chip}
        >
          Occupied
        </Chip>
        <Chip 
          selected={filter === 'vacant'} 
          onPress={() => setFilter('vacant')}
          style={styles.chip}
        >
          Vacant
        </Chip>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.roomsContainer}>
          <View style={styles.roomsGrid}>
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room, index) => (
                <LinearGradient
                  key={index}
                  colors={[
                    isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.primary + '20',
                    isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.primary + '10'
                  ]}
                  style={styles.gradientCard}
                >
                  <Card style={styles.roomCard}>
                    <View style={styles.cardContent}>
                      <Title style={styles.cardTitle}>Room {room.room_number}</Title>
                      <Chip 
                        style={styles.statusChip}
                        textStyle={{ color: theme.colors.text }}
                      >
                        {room.room_filled_status === 1 ? 'Occupied' : 'Vacant'}
                      </Chip>
                      <Paragraph style={styles.cardParagraph}>
                        Capacity: {room.capacity}
                      </Paragraph>
                      <Paragraph style={styles.cardParagraph}>
                        Current Occupants: {room.active_tenants}/{room.capacity}
                      </Paragraph>
                    </View>
                    <Card.Actions style={styles.cardActions}>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDeleteRoom(room)}
                        style={styles.iconButton}
                        iconColor={theme.colors.error}
                      />
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleRoomPress(room)}
                        style={styles.iconButton}
                        iconColor={theme.colors.primary}
                      />
                    </Card.Actions>
                  </Card>
                </LinearGradient>
              ))
            ) : (
              <View style={styles.noRoomsContainer}>
                <Paragraph style={{ color: theme.colors.text }}>No rooms available.</Paragraph>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        color={isDarkMode ? '#000' : '#fff'}
      />

      <Modal
        visible={isModalVisible}
        onDismiss={() => {
          setIsModalVisible(false);
          setIsEditing(false);
          setNewRoomNumber('');
        }}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>
              Room {selectedRoom?.room_number} Details
            </Title>
            <IconButton
              icon={isEditing ? "close" : "pencil"}
              size={24}
              onPress={() => {
                setIsEditing(!isEditing);
                if (!isEditing) {
                  setNewRoomNumber(selectedRoom?.room_number.toString() || '');
                }
              }}
              style={styles.editButton}
              iconColor={theme.colors.primary}
            />
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <View style={styles.roomNumberContainer}>
                <View style={styles.currentRoomInfo}>
                  <Text style={styles.label}>Current Room Number</Text>
                  <Text style={styles.currentRoomNumber}>{selectedRoom?.room_number}</Text>
                </View>
                <Ionicons 
                  name="arrow-forward" 
                  size={24} 
                  color={theme.colors.primary} 
                  style={styles.arrow} 
                />
                <View style={styles.newRoomInput}>
                  <Text style={styles.label}>New Room Number</Text>
                  <TextInput
                    value={newRoomNumber}
                    onChangeText={setNewRoomNumber}
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Enter new room number"
                    placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                  />
                </View>
              </View>
              <Button
                mode="outlined"
                onPress={handleUpdateRoomNumber}
                style={styles.saveButton}
                labelStyle={[styles.buttonLabel, { color: theme.colors.primary }]}
                theme={{ colors: { outline: 'transparent' } }}
              >
                Update Room Number
              </Button>
            </View>
          ) : (
            <View style={styles.tableContainer}>
              <DataTable style={styles.dataTable}>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title textStyle={styles.headerText}>Name</DataTable.Title>
                  <DataTable.Title textStyle={styles.headerText}>Phone</DataTable.Title>
                  <DataTable.Title textStyle={styles.headerText}>Email</DataTable.Title>
                  <DataTable.Title textStyle={styles.headerText}>Joined</DataTable.Title>
                </DataTable.Header>

                <ScrollView style={styles.tableScrollView}>
                  {roomStudents.map((student, index) => (
                    <DataTable.Row 
                      key={index}
                      style={[
                        styles.tableRow,
                        index % 2 === 0 ? styles.evenRow : styles.oddRow
                      ]}
                    >
                      <DataTable.Cell textStyle={styles.cellText}>{student.name}</DataTable.Cell>
                      <DataTable.Cell textStyle={styles.cellText}>{student.phone}</DataTable.Cell>
                      <DataTable.Cell textStyle={styles.cellText}>{student.email}</DataTable.Cell>
                      <DataTable.Cell textStyle={styles.cellText}>
                        {new Date(student.joining_date).toLocaleDateString()}
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </ScrollView>
              </DataTable>
            </View>
          )}

          <Button 
            mode="outlined" 
            onPress={() => {
              setIsModalVisible(false);
              setIsEditing(false);
              setNewRoomNumber('');
            }}
            style={styles.closeButton}
            labelStyle={[styles.buttonLabel, { color: isDarkMode ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)' }]}
            theme={{ colors: { outline: 'transparent' } }}
          >
            Close
          </Button>
        </View>
      </Modal>
    </View>
  );
} 