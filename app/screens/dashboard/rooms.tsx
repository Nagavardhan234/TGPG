import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Chip } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

export default function RoomManagement() {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.text }]}>Room Management</Title>

      <View style={styles.filterContainer}>
        <Chip selected onPress={() => {}}>All</Chip>
        <Chip onPress={() => {}}>Occupied</Chip>
        <Chip onPress={() => {}}>Vacant</Chip>
        <Chip onPress={() => {}}>Maintenance</Chip>
      </View>

      <ScrollView style={styles.roomsContainer}>
        <View style={styles.roomsGrid}>
          <Card style={[styles.roomCard, {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
          }]}>
            <Card.Content>
              <Title style={{ color: theme.colors.text }}>Room 101</Title>
              <Paragraph style={{ color: theme.colors.text }}>Capacity: 2</Paragraph>
              <Paragraph style={{ color: theme.colors.text }}>Status: Occupied</Paragraph>
              <Paragraph style={{ color: theme.colors.text }}>Current Occupants: 2/2</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button textColor={theme.colors.primary}>Details</Button>
              <Button textColor={theme.colors.primary}>Edit</Button>
            </Card.Actions>
          </Card>
        </View>
      </ScrollView>

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
}); 