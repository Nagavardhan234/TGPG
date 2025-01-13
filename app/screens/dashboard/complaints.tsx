import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/app/context/AuthContext';
import { managerComplaintsService } from '@/app/services/manager.complaints.service';
import ComplaintsAnalytics from '@/app/components/dashboard/ComplaintsAnalytics';
import ComplaintsList from '@/app/components/dashboard/ComplaintsList';
import { ApiError } from '@/app/services/student.service';
import { Link } from 'expo-router';

type Complaint = {
  id: number;
  title: string;
  status: string;
};

type Stats = {
  total: number;
  resolved: number;
  pending: number;
};

export default function ComplaintsScreen() {
  const { colors } = useTheme();
  const { manager, pg, isAuthenticated, token } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logs for auth state
  useEffect(() => {
    console.log('Auth State:', {
      isAuthenticated,
      hasManager: !!manager,
      managerDetails: manager ? {
        id: manager.id,
        role: manager.role,
      } : null,
      hasPG: !!pg,
      pgDetails: pg ? {
        PGID: pg.PGID,
        Status: pg.Status,
      } : null,
      hasToken: !!token,
    });
  }, [isAuthenticated, manager, pg, token]);

  // Load complaints and stats
  useEffect(() => {
    if (!isAuthenticated || !manager || !pg?.PGID) {
      return;
    }
    console.log('Loading complaints for PG:', pg.PGID);
    loadComplaintsAndStats();
  }, [isAuthenticated, manager, pg?.PGID]);

  const loadComplaintsAndStats = async () => {
    if (!pg?.PGID) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching complaints and stats for PG:', pg.PGID, {
        managerRole: manager?.role,
        token: token ? 'present' : 'missing',
      });

      const [complaintsData, statsData] = await Promise.all([
        managerComplaintsService.getComplaints(pg.PGID),
        managerComplaintsService.getStats(pg.PGID)
      ]);

      console.log('Data loaded successfully:', {
        complaintsCount: complaintsData.length,
        hasStats: !!statsData,
      });

      setComplaints(complaintsData);
      setStats(statsData);
    } catch (err: unknown) {
      const error = err instanceof ApiError ? err : new ApiError((err as Error).message);
      console.error('Error loading data:', {
        error: error.message,
        status: error.status,
        response: error.response?.data,
      });

      if (error.status === 403) {
        console.error('Permission denied:', {
          managerRole: manager?.role,
          pgId: pg.PGID,
          hasToken: !!token,
        });
        return;
      }
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (complaintId: number) => {
    try {
      console.log('Selecting file for complaint:', complaintId);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('File selection cancelled');
        return;
      }

      console.log('File selected:', {
        name: result.assets[0].name,
        type: result.assets[0].mimeType,
        size: result.assets[0].size,
      });

      const formData = new FormData();
      const file = result.assets[0];
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name,
      } as any);

      console.log('Adding response with file for complaint:', complaintId);
      await managerComplaintsService.addResponse(complaintId, formData);
      console.log('Response added successfully');
      await loadComplaintsAndStats();
    } catch (err: unknown) {
      const error = err instanceof ApiError ? err : new ApiError((err as Error).message);
      console.error('Error handling file:', {
        error: error.message,
        status: error.status,
        response: error.response?.data,
      });
      setError(error.message || 'Failed to upload file');
    }
  };

  const handleStatusUpdate = async (complaintId: number, status: string, comment: string) => {
    try {
      if (!manager?.id) {
        throw new Error('Manager ID not found');
      }
      await managerComplaintsService.updateStatus(complaintId, {
        status,
        comment,
        managerId: manager.id
      });
      await loadComplaintsAndStats();
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    }
  };

  const handleAssignManager = async (complaintId: number) => {
    try {
      await managerComplaintsService.assignManager(complaintId);
      await loadComplaintsAndStats();
    } catch (error) {
      console.error('Error assigning manager:', error);
      setError('Failed to assign manager');
    }
  };

  // Handle authentication and PG selection first
  if (!isAuthenticated || !manager) {
    console.log('Not authenticated or no manager, redirecting to login');
    return (
      <Link href="/screens/LoginScreen" asChild>
        <View style={{ ...styles.container, backgroundColor: colors.background }}>
          <Text>Redirecting to login...</Text>
        </View>
      </Link>
    );
  }

  if (!pg?.PGID) {
    console.log('No PG selected');
    return (
      <View style={{ ...styles.container, backgroundColor: colors.background }}>
        <Text>Please select a PG to continue</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ ...styles.container, ...styles.centered }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ ...styles.container, ...styles.centered }}>
        <Text style={styles.error}>{error}</Text>
        <Button mode="contained" onPress={loadComplaintsAndStats} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {stats && <ComplaintsAnalytics stats={stats} />}
      <ComplaintsList
        complaints={complaints}
        onStatusUpdate={handleStatusUpdate}
        onAssignManager={handleAssignManager}
        onFileSelect={handleFileSelect}
        currentManagerId={manager?.id}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
}); 