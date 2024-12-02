import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Title, FAB, Searchbar, Divider } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.text }]}>Messages</Title>

      <Searchbar
        placeholder="Search messages..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}
        iconColor={theme.colors.text}
        placeholderTextColor={theme.colors.text}
        inputStyle={{ color: theme.colors.text }}
      />

      <List.Section>
        <List.Item
          title="John Doe"
          description="Room payment query"
          left={props => <List.Icon {...props} icon="account" color={theme.colors.text} />}
          right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.text} />}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
        />
        <Divider style={{ backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0' }} />
        <List.Item
          title="Jane Smith"
          description="Maintenance request"
          left={props => <List.Icon {...props} icon="account" color={theme.colors.text} />}
          right={props => <List.Icon {...props} icon="chevron-right" color={theme.colors.text} />}
          titleStyle={{ color: theme.colors.text }}
          descriptionStyle={{ color: theme.colors.textSecondary }}
        />
      </List.Section>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
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