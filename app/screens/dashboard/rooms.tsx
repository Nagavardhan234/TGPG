import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Chip, Searchbar } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoomStats } from '@/app/services/dashboard.service';
import { RoomStats } from '@/app/services/dashboard.service';

export default function RoomManagement() {
  const { theme, isDarkMode } = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomStats[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pgId, setPgId] = useState<number | null>(null);

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

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.text }]}>Room Management</Title>

      <Searchbar
        placeholder="Search rooms..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface }]}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.text }}
      />

      <View style={styles.filterContainer}>
        <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>All</Chip>
        <Chip selected={filter === 'occupied'} onPress={() => setFilter('occupied')}>Occupied</Chip>
        <Chip selected={filter === 'vacant'} onPress={() => setFilter('vacant')}>Vacant</Chip>
        <Chip selected={filter === 'maintenance'} onPress={() => setFilter('maintenance')}>Maintenance</Chip>
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
                <Card key={index} style={[styles.roomCard, {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
                }]}>
                  <Card.Content>
                    <Title style={{ color: theme.colors.text }}>
                      Room {room.room_number}
                    </Title>
                    <Paragraph style={{ color: theme.colors.text }}>
                      Capacity: {room.capacity}
                    </Paragraph>
                    <Paragraph style={{ color: theme.colors.text }}>
                      Status: {room.room_filled_status === 1 ? 'Occupied' : 'Vacant'}
                    </Paragraph>
                    <Paragraph style={{ color: theme.colors.text }}>
                      Current Occupants: {room.active_tenants}/{room.capacity}
                    </Paragraph>
                  </Card.Content>
                  <Card.Actions>
                    <Button textColor={theme.colors.primary}>Details</Button>
                    <Button textColor={theme.colors.primary}>Edit</Button>
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
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
        label="Add Room"
      />
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
  roomsContainer: {
    flex: 1,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  roomCard: {
    width: 300,
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