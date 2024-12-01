import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Title, FAB, Searchbar, Divider } from 'react-native-paper';

export default function Messages() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Messages</Title>

      <Searchbar
        placeholder="Search messages..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <List.Section>
        <List.Item
          title="John Doe"
          description="Room payment query"
          left={props => <List.Icon {...props} icon="account" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Jane Smith"
          description="Maintenance request"
          left={props => <List.Icon {...props} icon="account" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        label="New Message"
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