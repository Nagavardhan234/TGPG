import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DataTable, FAB, Searchbar, Title } from 'react-native-paper';

export default function StudentManagement() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Student Management</Title>
      
      <Searchbar
        placeholder="Search students..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Name</DataTable.Title>
          <DataTable.Title>Room No</DataTable.Title>
          <DataTable.Title>Phone</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
        </DataTable.Header>

        {/* Sample data - replace with actual data */}
        <DataTable.Row>
          <DataTable.Cell>John Doe</DataTable.Cell>
          <DataTable.Cell>101</DataTable.Cell>
          <DataTable.Cell>1234567890</DataTable.Cell>
          <DataTable.Cell>Active</DataTable.Cell>
        </DataTable.Row>
      </DataTable>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        label="Add Student"
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
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 