import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
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
  useTheme,
  IconButton,
  Dialog,
  Chip,
  RadioButton
} from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStudents, addStudent, getDefaultRent, Student, StudentForm, deleteStudent, updateStudent } from '@/app/services/student.service';
import { showMessage } from 'react-native-flash-message';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { StudentDetailsModal } from '@/app/components/StudentDetailsModal';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { ExtendedTheme } from '@/app/types/theme';

interface FormData {
  name: string;
  phone: string;
  email: string;
  monthlyRent: string;
  guardianName: string;
  guardianPhone: string;
  password: string;
  roomNo: number;
  joinDate: string;
}

const getStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'ACTIVE':
      return theme.colors.primaryContainer;
    case 'INACTIVE':
      return theme.colors.errorContainer;
    case 'MOVED_OUT':
      return theme.colors.surfaceVariant;
    default:
      return theme.colors.surfaceVariant;
  }
};

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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'joinDate'>('joinDate');

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  // Add state for edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'name',
    order: 'asc'
  });

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'MOVED_OUT'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'room' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [deleteType, setDeleteType] = useState<'SOFT' | 'HARD'>('SOFT');

  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  useEffect(() => {
    loadStudents();
    loadDefaultRent();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      loadDefaultRent();
    }
  }, [modalVisible]);

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
      const { PGID } = pgDetails;
      
      const defaultRent = await getDefaultRent(PGID);
      if (defaultRent) {
        setFormData(prev => ({
          ...prev,
          monthlyRent: defaultRent.toString()
        }));
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

    if (isEditMode) {
      await handleUpdate();
    } else {
      try {
        setIsSubmitting(true);
        
        const pgData = await AsyncStorage.getItem('pg');
        if (!pgData) {
          throw new Error('PG data not found');
        }

        const { PGID } = JSON.parse(pgData);
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
          monthlyRent: '',
          guardianName: '',
          guardianPhone: '',
          password: '',
          roomNo: 0,
          joinDate: new Date().toISOString().split('T')[0]
        });
      } catch (error: any) {
        console.error('Error adding student:', error);
        setError({
          message: error.message || 'Failed to add student',
          type: 'error'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false); // Close the picker after a date is selected
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        [dateType]: formattedDate,
      }));
    }
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.FullName,
      phone: student.Phone,
      email: student.Email || '',
      monthlyRent: student.Monthly_Rent || '',
      guardianName: student.GuardianName || '',
      guardianPhone: student.GuardianNumber || '',
      password: '', // Don't set password for edit
      roomNo: student.Room_No || 0,
      joinDate: new Date(student.MoveInDate).toISOString().split('T')[0]
    });
    setIsEditMode(true);
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!selectedStudent) return;

    try {
      setIsSubmitting(true);
      await updateStudent(selectedStudent.TenantID, formData);
      
      showMessage({
        message: 'Success',
        description: 'Student updated successfully',
        type: 'success',
      });
      
      setModalVisible(false);
      loadStudents();
      
      // Reset form and state
      setFormData({
        name: '',
        phone: '',
        email: '',
        monthlyRent: '',
        guardianName: '',
        guardianPhone: '',
        password: '',
        roomNo: 0,
        joinDate: new Date().toISOString().split('T')[0]
      });
      setIsEditMode(false);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error('Error updating student:', error);
      setError({
        message: error.message || 'Failed to update student',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (studentId: number, deleteType: 'SOFT' | 'HARD') => {
    try {
      const response = await deleteStudent(studentId, deleteType);
      
      showMessage({
        message: 'Success',
        description: response.message || (deleteType === 'HARD' 
          ? 'Student permanently deleted'
          : 'Student marked as moved out'),
        type: 'success',
      });

      // Refresh the list
      loadStudents();
      
      // Close any open modals
      setDeleteConfirmVisible(false);
      setViewModalVisible(false);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      setError({
        message: error.message || 'Failed to delete student',
        type: 'error'
      });
    }
  };

  // Update modal close handler
  const handleModalClose = () => {
    setModalVisible(false);
    setIsEditMode(false);
    setSelectedStudent(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      monthlyRent: '',
      guardianName: '',
      guardianPhone: '',
      password: '',
      roomNo: 0,
      joinDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const exportToExcel = async () => {
    try {
      const ws = XLSX.utils.json_to_sheet(students.map(s => ({
        Name: s.FullName,
        Phone: s.Phone,
        Email: s.Email || '',
        Room: s.Room_No || '',
        Status: s.Status,
        'Monthly Rent': s.Monthly_Rent || '',
        'Join Date': new Date(s.MoveInDate).toLocaleDateString()
      })));
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileName = `${FileSystem.documentDirectory}students.xlsx`;
      
      await FileSystem.writeAsStringAsync(fileName, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      await Sharing.shareAsync(fileName);
    } catch (error) {
      console.error('Export error:', error);
      showMessage({
        message: 'Export failed',
        description: 'Failed to export student data',
        type: 'error'
      });
    }
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter(student => filterStatus === 'ALL' ? true : student.Status === filterStatus)
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return sortOrder === 'asc' 
              ? a.FullName.localeCompare(b.FullName)
              : b.FullName.localeCompare(a.FullName);
          case 'room':
            return sortOrder === 'asc'
              ? (a.Room_No || 0) - (b.Room_No || 0)
              : (b.Room_No || 0) - (a.Room_No || 0);
          case 'date':
            return sortOrder === 'asc'
              ? new Date(a.MoveInDate).getTime() - new Date(b.MoveInDate).getTime()
              : new Date(b.MoveInDate).getTime() - new Date(a.MoveInDate).getTime();
          default:
            return 0;
        }
      });
  }, [students, filterStatus, sortBy, sortOrder]);

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
          onDismiss={handleModalClose}
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
                  {isEditMode ? 'Edit Student' : 'Add New Student'}
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
        mode="outlined"
        style={styles.input}
        error={!formData.joinDate}
        editable={false}
        right={
          <TextInput.Icon 
            icon="calendar" 
            onPress={() => setShowDatePicker(true)} 
          />
        }
      />
      {showDatePicker && (
        <DateTimePicker
          value={formData.joinDate ? new Date(formData.joinDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onDateChange}
        />
      )}

              <View style={styles.buttonContainer}>
                <Button 
                  mode="outlined" 
                  onPress={handleModalClose}
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
                  {isSubmitting 
                    ? (isEditMode ? 'Updating...' : 'Adding...') 
                    : (isEditMode ? 'Update Student' : 'Add Student')
                  }
                </Button>
              </View>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <View style={styles.header}>
        <Title style={[styles.title, { color: theme.colors.text }]}>
          Student Management
        </Title>
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search students..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, isSmallScreen && styles.fullWidth]}
          />
          
          <View style={styles.actionButtons}>
            <IconButton
              icon="refresh"
              mode="contained-tonal"
              onPress={handleRefresh}
              loading={refreshing}
            />
            <IconButton
              icon="filter-variant"
              mode="contained-tonal"
              onPress={() => setFilterVisible(true)}
            />
            <IconButton
              icon="microsoft-excel"
              mode="contained-tonal"
              onPress={exportToExcel}
            />
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={filterStatus === 'ALL'}
            onPress={() => setFilterStatus('ALL')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={filterStatus === 'ACTIVE'}
            onPress={() => setFilterStatus('ACTIVE')}
            style={styles.filterChip}
          >
            Active
          </Chip>
          <Chip
            selected={filterStatus === 'INACTIVE'}
            onPress={() => setFilterStatus('INACTIVE')}
            style={styles.filterChip}
          >
            Inactive
          </Chip>
          <Chip
            selected={filterStatus === 'MOVED_OUT'}
            onPress={() => setFilterStatus('MOVED_OUT')}
            style={styles.filterChip}
          >
            Moved Out
          </Chip>
        </ScrollView>
      </View>

      <ScrollView style={styles.tableContainer}>
        <DataTable>
          <DataTable.Header style={[
            styles.tableHeader,
            { backgroundColor: theme.colors.surfaceVariant }
          ]}>
            <DataTable.Title 
              style={styles.nameColumn}
              textStyle={[styles.headerText, { color: theme.colors.text }]}
            >
              Name
            </DataTable.Title>
            <DataTable.Title 
              style={styles.roomColumn}
              textStyle={[styles.headerText, { color: theme.colors.text }]}
            >
              Room
            </DataTable.Title>
            <DataTable.Title 
              style={styles.statusColumn}
              textStyle={[styles.headerText, { color: theme.colors.text }]}
            >
              Status
            </DataTable.Title>
            <DataTable.Title 
              style={styles.actionColumn}
              textStyle={[styles.headerText, { color: theme.colors.text }]}
            >
              View
            </DataTable.Title>
          </DataTable.Header>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            filteredStudents.map(student => (
              <DataTable.Row 
                key={student.TenantID}
                style={[
                  styles.tableRow,
                  { borderBottomColor: theme.colors.surfaceVariant }
                ]}
                onPress={() => {
                  setSelectedStudent(student);
                  setViewModalVisible(true);
                }}
              >
                <DataTable.Cell style={styles.nameColumn}>
                  <View style={styles.nameCell}>
                    <Avatar.Text 
                      size={32} 
                      label={student.FullName.substring(0, 2).toUpperCase()} 
                      style={styles.avatar}
                    />
                    <Text style={[
                      styles.nameText,
                      { color: theme.colors.text }
                    ]}>
                      {student.FullName}
                    </Text>
                  </View>
                </DataTable.Cell>
                
                <DataTable.Cell style={styles.roomColumn}>
                  <Text style={[
                    styles.roomText,
                    { color: theme.colors.text }
                  ]}>
                    {student.Room_No || '-'}
                  </Text>
                </DataTable.Cell>
                
                <DataTable.Cell style={styles.statusColumn}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(student.Status, theme) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: isDarkMode ? '#000' : '#FFF' }
                    ]}>
                      {student.Status}
                    </Text>
                  </View>
                </DataTable.Cell>
                
                <DataTable.Cell style={styles.actionColumn}>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={theme.colors.primary}
                  />
                </DataTable.Cell>
              </DataTable.Row>
            ))
          )}
        </DataTable>
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Student"
        style={[
          styles.fab, 
          { backgroundColor: isDarkMode ? '#D0BCFF' : theme.colors.primary }
        ]}
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
        >
          <Dialog.Title>Delete Student</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16 }}>
              Are you sure you want to delete {selectedStudent?.FullName}?
            </Text>
            <View style={styles.deleteOptions}>
              <RadioButton.Group
                onValueChange={value => setDeleteType(value as 'SOFT' | 'HARD')}
                value={deleteType}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="SOFT" />
                  <Text>Mark as Moved Out</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="HARD" />
                  <Text>Permanently Delete</Text>
                </View>
              </RadioButton.Group>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmVisible(false)}>Cancel</Button>
            <Button 
              onPress={() => {
                if (selectedStudent) {
                  handleDelete(selectedStudent.TenantID, deleteType);
                }
                setDeleteConfirmVisible(false);
              }}
              textColor={theme.colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <StudentDetailsModal
        visible={viewModalVisible}
        onDismiss={() => {
          setViewModalVisible(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onEdit={(student) => {
          setViewModalVisible(false);
          handleEdit(student);
        }}
        onDelete={(student) => {
          setViewModalVisible(false);
          setSelectedStudent(student);
          setDeleteConfirmVisible(true);
        }}
      />

      <Portal>
        <Modal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          contentContainerStyle={[
            styles.filterModal,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Title>Filter Students</Title>
          {/* Add filter options */}
        </Modal>
      </Portal>
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tableContainer: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  filterModal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  tableHeader: {
    height: 48,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableRow: {
    minHeight: 64,
    borderBottomWidth: 1,
  },
  nameColumn: {
    flex: 3,
    paddingRight: 8,
  },
  roomColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statusColumn: {
    flex: 2,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatar: {
    marginRight: 12,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '500',
  },
  roomText: {
    fontSize: 14,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  deleteOptions: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
}); 