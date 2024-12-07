import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, Surface, IconButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ManagerData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

interface PGData {
  PGID: number;
  PGName: string;
  Status: string;
  // Add other PG fields you need
}

export default function Dashboard() {
  const { theme } = useTheme();
  const [managerData, setManagerData] = useState<ManagerData | null>(null);
  const [pgData, setPgData] = useState<PGData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load manager data from AsyncStorage
        const managerStr = await AsyncStorage.getItem('manager');
        if (managerStr) {
          setManagerData(JSON.parse(managerStr));
        }

        // Load PG data if needed
        // You can either store it in AsyncStorage during login
        // or make an API call here to get fresh data
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Manager Profile Card */}
      <Surface style={styles.section}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Manager Profile</Title>
            {managerData && (
              <>
                <View style={styles.infoRow}>
                  <IconButton icon="account" size={24} />
                  <View>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{managerData.fullName}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <IconButton icon="phone" size={24} />
                  <View>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.value}>{managerData.phone}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <IconButton icon="email" size={24} />
                  <View>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{managerData.email}</Text>
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </Surface>

      {/* PG Details Card */}
      <Surface style={styles.section}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>PG Details</Title>
            {pgData ? (
              <>
                <View style={styles.infoRow}>
                  <IconButton icon="home" size={24} />
                  <View>
                    <Text style={styles.label}>PG Name</Text>
                    <Text style={styles.value}>{pgData.PGName}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <IconButton icon="information" size={24} />
                  <View>
                    <Text style={styles.label}>Status</Text>
                    <Text style={[
                      styles.value,
                      { color: pgData.Status === 'ACTIVE' ? theme.colors.primary : theme.colors.error }
                    ]}>
                      {pgData.Status}
                    </Text>
                  </View>
                </View>
                {/* Add more PG details as needed */}
              </>
            ) : (
              <Paragraph>No PG data available</Paragraph>
            )}
          </Card.Content>
        </Card>
      </Surface>

      {/* Add more sections/cards as needed */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    elevation: 4,
  },
  card: {
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 