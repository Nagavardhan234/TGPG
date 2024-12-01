import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Chip } from 'react-native-paper';

export default function RoomManagement() {
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Room Management</Title>

      <View style={styles.filterContainer}>
        <Chip selected onPress={() => {}}>All</Chip>
        <Chip onPress={() => {}}>Occupied</Chip>
        <Chip onPress={() => {}}>Vacant</Chip>
        <Chip onPress={() => {}}>Maintenance</Chip>
      </View>

      <ScrollView style={styles.roomsContainer}>
        <View style={styles.roomsGrid}>
          {/* Sample Room Card */}
          <Card style={styles.roomCard}>
            <Card.Content>
              <Title>Room 101</Title>
              <Paragraph>Capacity: 2</Paragraph>
              <Paragraph>Status: Occupied</Paragraph>
              <Paragraph>Current Occupants: 2/2</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => {}}>Details</Button>
              <Button onPress={() => {}}>Edit</Button>
            </Card.Actions>
          </Card>
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
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