import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Chip, Searchbar, Portal, Dialog } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoomStats, RoomStatsResponse, deleteRoom } from '@/app/services/dashboard.service';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/app/context/AuthContext';
import { ErrorNotification } from '@/app/components/ErrorNotification';

export default function RoomManagement() {
  const { theme, isDarkMode } = useTheme();
  const { pg } = useAuth(); // Get pg from AuthContext
  
  // State management
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomStats[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomStats | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Load room statistics
  const loadRoomStats = useCallback(async () => {
    if (!pg?.PGID) return;

    try {
      setLoading(true);
      const response = await getRoomStats(pg.PGID);
      if (response.success && response.rooms_json) {
        const parsedRooms = typeof response.rooms_json[0].rooms_json === 'string' 
          ? JSON.parse(response.rooms_json[0].rooms_json) 
          : response.rooms_json[0].rooms_json;

        const formattedRooms = parsedRooms.map(room => ({
          room_number: room.room_number || 'N/A',
          capacity: response.rooms_json[0].Capacity || 0,
          active_tenants: room.active_tenants || 0,
          room_filled_status: room.room_filled_status || 0,
        }));
        setRooms(formattedRooms);
      }
    } catch (error) {
      console.error('Error loading room stats:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load room stats');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }, [pg?.PGID]);

  // Load initial data
  useEffect(() => {
    if (pg?.PGID) {
      loadRoomStats();
    }
  }, [pg?.PGID, loadRoomStats]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (pg?.PGID) {
        loadRoomStats();
      }
    }, [pg?.PGID, loadRoomStats])
  );

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

  // Add navigation handler
  const handleEditRoom = (room: RoomStats) => {
    router.push({
      pathname: '/screens/dashboard/edit-room',
      params: { roomData: JSON.stringify(room) }
    });
  };

  // Add delete handler
  const handleDeleteRoom = (room: RoomStats) => {
    setSelectedRoom(room);
    setDeleteDialogVisible(true);
    setDeleteError('');
  };

  // Add confirm delete function
  const confirmDeleteRoom = async () => {
    if (!selectedRoom || !pg?.PGID) return;

    try {
      setLoading(true);
      const response = await deleteRoom(pg.PGID, selectedRoom.room_number);
      
      if (response.success) {
        // Remove room from state
        setRooms(prev => prev.filter(r => r.room_number !== selectedRoom.room_number));
        setDeleteDialogVisible(false);
        setErrorMessage('Room deleted successfully');
        setShowError(false);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
      <ErrorNotification
        visible={showError}
        message={errorMessage}
        onDismiss={() => setShowError(false)}
        type="error"
      />
      
      <Title style={[styles.title, { color: isDarkMode ? '#FFFFFF' : theme.colors.text }]}>Room Management</Title>

      <Searchbar
        placeholder="Search rooms..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surface }]}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.text }}
      />

      <View style={styles.filterContainer}>
        <Chip selected={filter === 'all'} onPress={() => setFilter('all')} style={styles.chip}>All</Chip>
        <Chip selected={filter === 'occupied'} onPress={() => setFilter('occupied')} style={styles.chip}>Occupied</Chip>
        <Chip selected={filter === 'vacant'} onPress={() => setFilter('vacant')} style={styles.chip}>Vacant</Chip>
        <Chip selected={filter === 'maintenance'} onPress={() => setFilter('maintenance')} style={styles.chip}>Maintenance</Chip>
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
                <Card key={index} style={[styles.roomCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
                  <Card.Content>
                    <Title style={{ color: theme.colors.text }}>Room {room.room_number}</Title>
                    <Paragraph style={{ color: theme.colors.text }}>Capacity: {room.capacity}</Paragraph>
                    <Paragraph style={{ color: theme.colors.text }}>
                      Current Occupants: {room.active_tenants}/{room.capacity}
                    </Paragraph>
                  </Card.Content>
                  <Card.Actions>
                    <Button 
                      onPress={() => handleEditRoom(room)} 
                      style={styles.actionButton}
                    >
                      Edit
                    </Button>
                    <Button 
                      onPress={() => handleDeleteRoom(room)} 
                      style={[styles.actionButton]} 
                      textColor={isDarkMode ? '#FF6F61' : '#FF4444'}
                    >
                      Delete
                    </Button>
                  </Card.Actions>
                </Card>
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
        style={[styles.fab, { 
          backgroundColor: isDarkMode ? '#FF6F61' : '#FFB4A9',
        }]}
        onPress={() => {}}
      />

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Room</Dialog.Title>
          <Dialog.Content>
            {deleteError ? (
              <Text style={{ color: theme.colors.error }}>{deleteError}</Text>
            ) : (
              <Text>Are you sure you want to delete Room {selectedRoom?.room_number}?</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={confirmDeleteRoom}
              disabled={!!deleteError || loading}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: 'transparent',
    color: '#6200EE',
  },
  roomsContainer: {
    flex: 1,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  roomCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 15,
    elevation: 5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  noRoomsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 