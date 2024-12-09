import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { 
  DataTable, 
  FAB, 
  Searchbar, 
  Title, 
  Portal, 
  Modal, 
  TextInput,
  Button,
  Avatar,
  Text,
  useTheme
} from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStudents, addStudent, getDefaultRent, Student, StudentForm } from '@/app/services/student.service';
import { showMessage } from 'react-native-flash-message';
import { ErrorNotification } from '@/app/components/ErrorNotification';

interface FormData extends StudentForm {
  roomNo: number;
  monthlyRent: string;
  joinDate: string;
}

export default function StudentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const paperTheme = useTheme();
  const { theme, isDarkMode } = useCustomTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    moveInDate: new Date().toISOString().split('T')[0],
    monthlyRent: '',
    guardianName: '',
    guardianPhone: '',
    password: '',
    roomNo: 0,
    joinDate: new Date().toISOString().split('T')[0]
  });

  // Add error state for the notification
  const [error, setError] = useState<{
    message: string;
    type: 'error' | 'warning' | 'info';
    field?: string;
  } | null>(null);

  useEffect(() => {
    loadStudents();
    loadDefaultRent();
  }, []);

  const validateForm = () => {
    const errors: string[] = [];

    // Name validation
    if (!formData.name.trim()) {
      errors.push('Full name is required');
    } else if (formData.name.length < 3) {
      errors.push('Name must be at least 3 characters long');
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      errors.push('Name should only contain letters and spaces');
    }

    // Phone validation
    if (!formData.phone) {
      errors.push('Phone number is required');
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.push('Please enter a valid 10-digit phone number');
    }

    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    // Room number validation
    if (!formData.roomNo) {
      errors.push('Room number is required');
    } else if (formData.roomNo <= 0) {
      errors.push('Room number must be greater than 0');
    }

    // Monthly rent validation
    if (!formData.monthlyRent) {
      errors.push('Monthly rent is required');
    } else if (isNaN(Number(formData.monthlyRent)) || Number(formData.monthlyRent) <= 0) {
      errors.push('Please enter a valid monthly rent amount');
    }

    // Guardian details validation
    if (formData.guardianPhone && !/^[6-9]\d{9}$/.test(formData.guardianPhone)) {
      errors.push('Please enter a valid guardian phone number');
    }

    // Password validation
    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    // Join date validation
    if (!formData.joinDate) {
      errors.push('Join date is required');
    } else {
      const joinDate = new Date(formData.joinDate);
      const today = new Date();
      if (joinDate < today) {
        errors.push('Join date cannot be in the past');
      }
    }

    if (errors.length > 0) {
      setError({
        message: errors.join('\n'),
        type: 'error'
      });
      return false;
    }

    return true;
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get both PG data and token
      const [pgData, token] = await Promise.all([
        AsyncStorage.getItem('pg'),
        AsyncStorage.getItem('token')
      ]);

      console.log('Token before request:', token); // Debug log
      console.log('PG data:', pgData); // Debug log

      if (!token) {
        setError({
          message: 'Authentication token not found. Please login again.',
          type: 'error'
        });
        router.replace('/screens/LoginScreen');
        return;
      }

      if (!pgData) {
        setError({
          message: 'PG data not found',
          type: 'error'
        });
        return;
      }

      const { PGID } = JSON.parse(pgData);
      const studentsData = await getStudents(PGID);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      
      if (error.message === 'INVALID_TOKEN') {
        setError({
          message: 'Session expired. Please login again.',
          type: 'warning'
        });
        router.replace('/screens/LoginScreen');
        return;
      }

      setError({
        message: error.message || 'Failed to load students',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultRent = async () => {
    try {
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) {
        setError({
          message: 'No PG data found',
          type: 'warning'
        });
        return;
      }

      const pgDetails = JSON.parse(pgData);
      if (pgDetails.Rent) {
        setFormData(prev => ({
          ...prev,
          monthlyRent: pgDetails.Rent.toString()
        }));
      } else {
        const { PGID } = pgDetails;
        const defaultRent = await getDefaultRent(PGID);
        
        if (defaultRent) {
          setFormData(prev => ({
            ...prev,
            monthlyRent: defaultRent.toString()
          }));
        } else {
          setError({
            message: 'No default rent found',
            type: 'warning'
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading default rent:', error);
      setError({
        message: 'Failed to load default rent',
        type: 'warning'
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      // Get PG data
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) {
        throw new Error('PG data not found');
      }

      const { PGID } = JSON.parse(pgData);
      
      // Pass only pgId and formData
      await addStudent(PGID, formData);
      
      showMessage({
        message: 'Success',
        description: 'Student added successfully',
        type: 'success',
      });
      
      setModalVisible(false);
      loadStudents();
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        moveInDate: new Date().toISOString().split('T')[0],
        monthlyRent: '',
        guardianName: '',
        guardianPhone: '',
        password: '',
        roomNo: 0,
        joinDate: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      console.error('Error adding student:', error);
      
      if (error.message === 'INVALID_TOKEN') {
        setError({
          message: 'Session expired. Please login again.',
          type: 'warning'
        });
        router.replace('/screens/LoginScreen');
        return;
      }

      setError({
        message: error.message || 'Failed to add student',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Portal>
        <ErrorNotification
          visible={!!error}
          message={error?.message || ''}
          type={error?.type || 'error'}
          onDismiss={() => setError(null)}
          style={styles.errorNotification}
        />

        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { 
              backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : theme.colors.surface 
            }
          ]}
          style={styles.modalOverlay}
        >
          <ScrollView>
            <View style={styles.modalContent}>
              {/* Profile Icon */}
              <View style={styles.avatarContainer}>
                <Avatar.Icon 
                  size={80} 
                  icon="account-plus" 
                  style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                />
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Add New Student
                </Text>
              </View>

              {/* Form Fields */}
              <TextInput
                label="Full Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Phone Number *"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />

              <TextInput
                label="Room Number *"
                value={formData.roomNo.toString()}
                onChangeText={(text) => setFormData({ ...formData, roomNo: parseInt(text) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                label="Monthly Rent *"
                value={formData.monthlyRent}
                onChangeText={(text) => setFormData({ ...formData, monthlyRent: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                error={!formData.monthlyRent}
              />

              <TextInput
                label="Email (Optional)"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                mode="outlined"
                keyboardType="email-address"
                style={styles.input}
              />

              <TextInput
                label="Guardian Name"
                value={formData.guardianName}
                onChangeText={(text) => setFormData({ ...formData, guardianName: text })}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Guardian Phone"
                value={formData.guardianPhone}
                onChangeText={(text) => setFormData({ ...formData, guardianPhone: text })}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />

              <TextInput
                label="Password *"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />

              <TextInput
                label="Join Date *"
                value={formData.joinDate}
                onChangeText={(text) => setFormData({ ...formData, joinDate: text })}
                mode="outlined"
                style={styles.input}
                error={!formData.joinDate}
                right={
                  <TextInput.Icon 
                    icon="calendar" 
                    onPress={() => {
                      // Here you can add a date picker
                      // For now, we're using the default text input
                    }} 
                  />
                }
              />

              <View style={styles.buttonContainer}>
                <Button 
                  mode="outlined" 
                  onPress={() => setModalVisible(false)}
                  style={styles.button}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleSubmit}
                  style={styles.button}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Student'}
                </Button>
              </View>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <Title style={[styles.title, { color: theme.colors.text }]}>Student Management</Title>
      
      <Searchbar
        placeholder="Search students..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <DataTable>
        <DataTable.Header>
          <DataTable.Title textStyle={{ color: theme.colors.text }}>Name</DataTable.Title>
          <DataTable.Title textStyle={{ color: theme.colors.text }}>Room No</DataTable.Title>
          <DataTable.Title textStyle={{ color: theme.colors.text }}>Phone</DataTable.Title>
          <DataTable.Title textStyle={{ color: theme.colors.text }}>Status</DataTable.Title>
        </DataTable.Header>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          students.map(student => (
            <DataTable.Row key={student.TenantID}>
              <DataTable.Cell textStyle={{ color: theme.colors.text }}>
                {student.FullName}
              </DataTable.Cell>
              <DataTable.Cell textStyle={{ color: theme.colors.text }}>
                {student.Room_No || '-'}
              </DataTable.Cell>
              <DataTable.Cell textStyle={{ color: theme.colors.text }}>
                {student.Phone}
              </DataTable.Cell>
              <DataTable.Cell textStyle={{ color: theme.colors.text }}>
                {student.Status}
              </DataTable.Cell>
            </DataTable.Row>
          ))
        )}
      </DataTable>

      <FAB
        icon="plus"
        label="Add Student"
        style={[
          styles.fab, 
          { backgroundColor: isDarkMode ? '#D0BCFF' : theme.colors.primary }
        ]}
        onPress={() => setModalVisible(true)}
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    maxHeight: '90%',
    zIndex: 1001,
  },
  modalContent: {
    padding: 20,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  button: {
    minWidth: 100,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    height: 56,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
}); 