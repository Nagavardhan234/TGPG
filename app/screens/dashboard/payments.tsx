import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DataTable, Title, Card, Paragraph, Searchbar } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

export default function PaymentsOverview() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.text }]}>Payments Overview</Title>

      <View style={styles.summaryCards}>
        <Card style={[styles.summaryCard, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Total Revenue</Title>
            <Paragraph style={{ color: theme.colors.text }}>₹50,000</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Pending Payments</Title>
            <Paragraph style={{ color: theme.colors.text }}>₹10,000</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>This Month</Title>
            <Paragraph style={{ color: theme.colors.text }}>₹15,000</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Searchbar
        placeholder="Search payments..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}
        iconColor={theme.colors.text}
        placeholderTextColor={theme.colors.text}
        inputStyle={{ color: theme.colors.text }}
      />

      <DataTable>
        <DataTable.Header>
          <DataTable.Title textStyle={{ color: theme.colors.text }}>Student</DataTable.Title>
          <DataTable.Title textStyle={{ color: theme.colors.text }}>Amount</DataTable.Title>
          <DataTable.Title textStyle={{ color: theme.colors.text }}>Date</DataTable.Title>
          <DataTable.Title textStyle={{ color: theme.colors.text }}>Status</DataTable.Title>
        </DataTable.Header>

        <DataTable.Row>
          <DataTable.Cell textStyle={{ color: theme.colors.text }}>John Doe</DataTable.Cell>
          <DataTable.Cell textStyle={{ color: theme.colors.text }}>₹5,000</DataTable.Cell>
          <DataTable.Cell textStyle={{ color: theme.colors.text }}>2024-02-01</DataTable.Cell>
          <DataTable.Cell textStyle={{ color: theme.colors.text }}>Paid</DataTable.Cell>
        </DataTable.Row>
      </DataTable>
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
  summaryCards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
  },
  searchBar: {
    marginBottom: 16,
  },
}); 