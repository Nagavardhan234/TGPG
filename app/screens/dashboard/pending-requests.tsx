import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Searchbar, List, IconButton, Button, Text } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { NetworkErrorView } from '@/app/components/NetworkErrorView';
import { PageLoader } from '@/app/components/PageLoader';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentRegistrationService } from '@/app/services/student.registration.service';

export default function PendingRequests() {
  const { theme, isDarkMode } = useTheme();
  
  // State management
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<{[key: number]: boolean}>({});
  const [actionError, setActionError] = useState<{[key: number]: string}>({});

  // Fetch pending registrations
  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  // Update filtered results when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRegistrations(pendingRegistrations);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = pendingRegistrations.filter(registration => {
      return (
        registration.FullName.toLowerCase().includes(query) ||
        registration.Phone.includes(query) ||
        registration.Email.toLowerCase().includes(query) ||
        registration.RoomNumber.toString().includes(query)
      );
    });
    setFilteredRegistrations(filtered);
  }, [searchQuery, pendingRegistrations]);

  const fetchPendingRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const managerData = await AsyncStorage.getItem('manager');
      if (!managerData) throw new Error('Manager data not found');
      
      const manager = JSON.parse(managerData);
      const response = await studentRegistrationService.getPendingRegistrations(manager.tenantRegId);
      setPendingRegistrations(response.pendingRegistrations || []);
      setFilteredRegistrations(response.pendingRegistrations || []);
    } catch (error: any) {
      console.error('Error fetching pending registrations:', error);
      setError(error.message || 'Failed to load pending registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (pendingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [pendingId]: true }));
      setActionError(prev => ({ ...prev, [pendingId]: '' }));
      
      const managerData = await AsyncStorage.getItem('manager');
      if (!managerData) throw new Error('Manager data not found');
      
      const manager = JSON.parse(managerData);
      await studentRegistrationService.approveRegistration(pendingId);
      
      // Refresh the list
      const response = await studentRegistrationService.getPendingRegistrations(manager.tenantRegId);
      setPendingRegistrations(response.pendingRegistrations || []);
    } catch (error) {
      console.error('Error approving registration:', error);
      setActionError(prev => ({ 
        ...prev, 
        [pendingId]: error.message || 'Failed to approve registration'
      }));
    } finally {
      setActionLoading(prev => ({ ...prev, [pendingId]: false }));
    }
  };

  const handleDecline = async (pendingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [pendingId]: true }));
      setActionError(prev => ({ ...prev, [pendingId]: '' }));
      
      const managerData = await AsyncStorage.getItem('manager');
      if (!managerData) throw new Error('Manager data not found');
      
      const manager = JSON.parse(managerData);
      await studentRegistrationService.declineRegistration(pendingId);
      
      // Refresh the list
      const response = await studentRegistrationService.getPendingRegistrations(manager.tenantRegId);
      setPendingRegistrations(response.pendingRegistrations || []);
    } catch (error) {
      console.error('Error declining registration:', error);
      setActionError(prev => ({ 
        ...prev, 
        [pendingId]: error.message || 'Failed to decline registration'
      }));
    } finally {
      setActionLoading(prev => ({ ...prev, [pendingId]: false }));
    }
  };

  if (loading) {
    return <PageLoader message="Loading pending registrations..." />;
  }

  if (error) {
    return (
      <NetworkErrorView
        message={error}
        onRetry={fetchPendingRegistrations}
        showAnimation={false}
        icon="account-clock"
      />
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Pending Requests
        </Text>
      </View>

      <Searchbar
        placeholder="Search by name, phone, email, or room"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, {
          backgroundColor: isDarkMode ? '#383838' : '#F5F5F5',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        }]}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <View style={styles.content}>
        {filteredRegistrations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconButton
              icon="account-clock"
              size={50}
              iconColor={theme.colors.primary}
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'No matching requests found' : 'No pending requests'}
            </Text>
          </View>
        ) : (
          filteredRegistrations.map((registration) => (
            <View key={registration.PendingID} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.profileSection}>
                  <View style={[styles.avatar, {
                    backgroundColor: theme.colors.primary + '20',
                  }]}>
                    <IconButton icon="account" size={24} iconColor={theme.colors.primary} style={{ margin: 0 }} />
                  </View>
                  <View>
                    <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                      {registration.FullName}
                    </Text>
                    <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
                      Room {registration.RoomNumber}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Phone</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>{registration.Phone}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
                    {registration.Email || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Joining Date</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>{registration.JoiningDate}</Text>
                </View>
              </View>

              {actionError[registration.PendingID] && (
                <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
                  {actionError[registration.PendingID]}
                </Text>
              )}

              <View style={styles.actions}>
                <Button 
                  mode="contained" 
                  onPress={() => handleApprove(registration.PendingID)}
                  style={styles.actionButton}
                  loading={actionLoading[registration.PendingID]}
                  disabled={actionLoading[registration.PendingID]}
                >
                  Approve
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => handleDecline(registration.PendingID)}
                  style={styles.actionButton}
                  loading={actionLoading[registration.PendingID]}
                  disabled={actionLoading[registration.PendingID]}
                >
                  Decline
                </Button>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchBar: {
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    elevation: 0,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subText: {
    fontSize: 13,
    opacity: 0.7,
  },
  detailsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: 140,
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  errorMessage: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
    opacity: 0.7,
  },
  requestCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
}); 