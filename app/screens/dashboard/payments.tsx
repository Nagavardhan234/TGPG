import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DataTable, Title, Card, Paragraph, Searchbar } from 'react-native-paper';

export default function PaymentsOverview() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Payments Overview</Title>

      <View style={styles.summaryCards}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Total Revenue</Title>
            <Paragraph>₹50,000</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Pending Payments</Title>
            <Paragraph>₹10,000</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>This Month</Title>
            <Paragraph>₹15,000</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Searchbar
        placeholder="Search payments..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Student</DataTable.Title>
          <DataTable.Title>Amount</DataTable.Title>
          <DataTable.Title>Date</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
        </DataTable.Header>

        <DataTable.Row>
          <DataTable.Cell>John Doe</DataTable.Cell>
          <DataTable.Cell>₹5,000</DataTable.Cell>
          <DataTable.Cell>2024-02-01</DataTable.Cell>
          <DataTable.Cell>Paid</DataTable.Cell>
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