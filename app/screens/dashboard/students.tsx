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

interface FormData extends StudentForm {
  roomNo: number;
  monthlyRent: string;
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
    roomNo: 0
  });

  useEffect(() => {
    loadStudents();
    loadDefaultRent();
  }, []);

  const validateForm = () => {
    if (!formData.name || !formData.phone || !formData.password || !formData.roomNo) {
      showMessage({
        message: 'Error',
        description: 'Please fill all required fields',
        type: 'danger',
      });
      return false;
    }
    if (formData.phone.length !== 10) {
      showMessage({
        message: 'Error',
        description: 'Phone number must be 10 digits',
        type: 'danger',
      });
      return false;
    }
    if (formData.password.length < 6) {
      showMessage({
        message: 'Error',
        description: 'Password must be at least 6 characters',
        type: 'danger',
      });
      return false;
    }
    return true;
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) {
        showMessage({
          message: 'Error',
          description: 'PG data not found',
          type: 'danger',
        });
        return;
      }

      const { PGID } = JSON.parse(pgData);
      const studentsData = await getStudents(PGID);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to load students',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultRent = async () => {
    try {
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) {
        console.warn('No PG data found');
        return;
      }

      const pgDetails = JSON.parse(pgData);
      if (pgDetails.Rent) {
        setFormData(prev => ({
          ...prev,
          monthlyRent: pgDetails.Rent.toString()
        }));
      } else {
        // Fallback to getting rent from API if not in AsyncStorage
        const { PGID } = pgDetails;
        const defaultRent = await getDefaultRent(PGID);
        
        if (defaultRent) {
          setFormData(prev => ({
            ...prev,
            monthlyRent: defaultRent.toString()
          }));
        } else {
          console.warn('No default rent found');
        }
      }
    } catch (error) {
      console.error('Error loading default rent:', error);
      showMessage({
        message: 'Warning',
        description: 'Failed to load default rent',
        type: 'warning'
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) throw new Error('PG data not found');

      const { PGID } = JSON.parse(pgData);
      await addStudent(PGID, formData);
      
      showMessage({
        message: 'Success',
        description: 'Student added successfully',
        type: 'success',
      });
      
      setModalVisible(false);
      loadStudents();
      
      setFormData({
        name: '',
        phone: '',
        email: '',
        moveInDate: new Date().toISOString().split('T')[0],
        monthlyRent: '',
        guardianName: '',
        guardianPhone: '',
        password: '',
        roomNo: 0
      });
    } catch (error) {
      console.error('Error adding student:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to add student',
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

      <Portal>
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
                label="Monthly Rent"
                value={formData.monthlyRent}
                onChangeText={(text) => setFormData({ ...formData, monthlyRent: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
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
  },
  modalContent: {
    padding: 20,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
}); 