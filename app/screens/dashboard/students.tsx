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
  RadioButton,
  SegmentedButtons
} from 'react-native-paper';
import { useTheme as useCustomTheme } from '@/app/context/ThemeContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStudents, addStudent, getDefaultRent, Student, StudentForm, deleteStudent, updateStudent, importStudentsFromExcel } from '@/app/services/student.service';
import { showMessage } from 'react-native-flash-message';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { StudentDetailsModal } from '@/app/components/StudentDetailsModal';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { ExtendedTheme } from '@/app/types/theme';
import * as DocumentPicker from 'expo-document-picker';

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

  const [editFormData, setEditFormData] = useState<FormData & { status: string }>({
    name: '',
    phone: '',
    email: '',
    monthlyRent: '',
    guardianName: '',
    guardianPhone: '',
    password: '',
    roomNo: 0,
    joinDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE'
  });

  const [filterName, setFilterName] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [sortField, setSortField] = useState<'name' | 'room'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [importModalVisible, setImportModalVisible] = useState(false);

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
    setEditFormData({
      name: student.FullName,
      phone: student.Phone,
      email: student.Email || '',
      monthlyRent: student.Monthly_Rent || '',
      guardianName: student.GuardianName || '',
      guardianPhone: student.GuardianNumber || '',
      password: '', // Don't set password for edit
      roomNo: student.Room_No || 0,
      joinDate: new Date(student.MoveInDate).toISOString().split('T')[0],
      status: student.Status
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
      // Create data for Excel
      const data = students.map(s => ({
        'Full Name': s.FullName,
        'Phone': s.Phone,
        'Email': s.Email || '',
        'Room No': s.Room_No || '',
        'Status': s.Status,
        'Monthly Rent': s.Monthly_Rent || '',
        'Guardian Name': s.GuardianName || '',
        'Guardian Phone': s.GuardianNumber || '',
        'Join Date': new Date(s.MoveInDate).toLocaleDateString()
      }));

      // Convert data to CSV string
      const csvContent = [
        Object.keys(data[0]).join(','), // Headers
        ...data.map(row => Object.values(row).join(',')) // Data rows
      ].join('\n');

      // Create file
      const fileName = `students_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // Write file
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Share file
      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.error('Export error:', error);
      showMessage({
        message: 'Export failed',
        description: 'Failed to export student data',
        type: 'error' as any
      });
    }
  };

  const importExcel = async () => {
    try {
      // Show import instructions modal first
      setImportModalVisible(true);
    } catch (error) {
      console.error('Import error:', error);
      showMessage({
        message: 'Import failed',
        description: 'Failed to import student data',
        type: 'error'
      });
    }
  };

  const handleFileSelect = async () => {
    try {
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) {
        throw new Error('PG data not found');
      }
      const { PGID } = JSON.parse(pgData);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        const fileContent = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.Base64
        });

        const workbook = XLSX.read(fileContent, { type: 'base64' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Validate data
        const validatedData = data.map((row: any) => {
          if (!row['Full Name'] || !row['Phone'] || !row['Room No'] || !row['Monthly Rent'] || !row['Password']) {
            throw new Error('Missing required fields');
          }
          return {
            'Full Name': row['Full Name'],
            'Phone': row['Phone'],
            'Room No': row['Room No'],
            'Monthly Rent': row['Monthly Rent'],
            'Password': row['Password'],
            'Email': row['Email'] || null,
            'Guardian Name': row['Guardian Name'] || null,
            'Guardian Phone': row['Guardian Phone'] || null
          };
        });

        const response = await importStudentsFromExcel(PGID, validatedData);

        showMessage({
          message: 'Import Successful',
          description: `Added ${response.data.added} students. ${
            response.data.failed > 0 
              ? `Failed to add ${response.data.failed} students.` 
              : ''
          }`,
          type: 'success'
        });

        loadStudents();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      showMessage({
        message: 'Import Failed',
        description: error.message || 'Failed to import students',
        type: 'error'
      });
    } finally {
      setImportModalVisible(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const template = [{
        'Full Name': 'John Doe',
        'Phone': '9876543210',
        'Room No': '101',
        'Monthly Rent': '5000',
        'Password': 'password123',
        'Email': 'john@example.com',
        'Guardian Name': 'Jane Doe',
        'Guardian Phone': '9876543211'
      }];

      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileName = `${FileSystem.documentDirectory}student_template.xlsx`;
      
      await FileSystem.writeAsStringAsync(fileName, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      await Sharing.shareAsync(fileName);
    } catch (error) {
      console.error('Template download error:', error);
      showMessage({
        message: 'Download Failed',
        description: 'Failed to download template',
        type: 'error'
      });
    }
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter(student => {
        const matchesStatus = filterStatus === 'ALL' ? true : student.Status === filterStatus;
        const matchesSearch = searchQuery 
          ? student.FullName.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        const matchesRoom = filterRoom 
          ? student.Room_No?.toString() === filterRoom
          : true;
        return matchesStatus && matchesSearch && matchesRoom;
      })
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        if (sortField === 'name') {
          return direction * a.FullName.localeCompare(b.FullName);
        } else {
          return direction * ((a.Room_No || 0) - (b.Room_No || 0));
        }
      });
  }, [students, filterStatus, searchQuery, filterRoom, sortField, sortDirection]);

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

              {isEditMode && (
                <View style={styles.statusSelector}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>Status</Text>
                  <SegmentedButtons
                    value={editFormData.status}
                    onValueChange={value => 
                      setEditFormData(prev => ({ ...prev, status: value as 'ACTIVE' | 'INACTIVE' | 'MOVED_OUT' }))
                    }
                    buttons={[
                      {
                        value: 'ACTIVE',
                        label: 'Active',
                        style: [
                          styles.statusButton,
                          { backgroundColor: editFormData.status === 'ACTIVE' ? theme.colors.primaryContainer : undefined }
                        ]
                      },
                      {
                        value: 'INACTIVE',
                        label: 'Inactive',
                        style: [
                          styles.statusButton,
                          { backgroundColor: editFormData.status === 'INACTIVE' ? theme.colors.errorContainer : undefined }
                        ]
                      },
                      {
                        value: 'MOVED_OUT',
                        label: 'Moved Out',
                        style: [
                          styles.statusButton,
                          { backgroundColor: editFormData.status === 'MOVED_OUT' ? theme.colors.surfaceVariant : undefined }
                        ]
                      }
                    ]}
                  />
                </View>
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
            placeholder="Search by name..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          />
          {!isSmallScreen && (
          <TextInput
            placeholder="Room No."
            value={filterRoom}
            onChangeText={setFilterRoom}
            mode="outlined"
            keyboardType="numeric"
              style={styles.roomSearch}
          />
          )}
          <View style={styles.actionButtons}>
            <IconButton
              icon="refresh"
              mode="contained-tonal"
              onPress={handleRefresh}
              loading={refreshing}
            />
            <IconButton
              icon="sort"
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
            elevation={2}
          >
            All
          </Chip>
          <Chip
            selected={filterStatus === 'ACTIVE'}
            onPress={() => setFilterStatus('ACTIVE')}
            style={styles.filterChip}
            elevation={2}
          >
            Active
          </Chip>
          <Chip
            selected={filterStatus === 'INACTIVE'}
            onPress={() => setFilterStatus('INACTIVE')}
            style={styles.filterChip}
            elevation={2}
          >
            Inactive
          </Chip>
          <Chip
            selected={filterStatus === 'MOVED_OUT'}
            onPress={() => setFilterStatus('MOVED_OUT')}
            style={styles.filterChip}
            elevation={2}
          >
            Moved Out
          </Chip>
        </ScrollView>
      </View>

      <ScrollView style={styles.tableContainer}>
        <DataTable>
          <DataTable.Header style={{ backgroundColor: theme.colors.surfaceVariant }}>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title>Room</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title style={{ justifyContent: 'center' }}>View</DataTable.Title>
          </DataTable.Header>

          {students.map((student) => (
            <DataTable.Row key={student.TenantID}>
              <DataTable.Cell>{student.FullName}</DataTable.Cell>
              <DataTable.Cell>{student.Room_No || '-'}</DataTable.Cell>
              <DataTable.Cell>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(student.Status, theme) }
                ]}>
                  <Text style={[styles.statusText, { color: '#ffffff' }]}>
                    {student.Status}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={{ justifyContent: 'center' }}>
                <IconButton
                  icon="eye"
                  size={20}
                  onPress={() => {
                    setSelectedStudent(student);
                    setViewModalVisible(true);
                  }}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
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
        onEdit={handleEdit}
        onDelete={(student) => {
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
          <ScrollView>
            <View style={styles.filterModalContent}>
              <Title style={styles.filterTitle}>Sort Students</Title>

              <View style={styles.sortSection}>
                <Text style={[styles.filterSubtitle, { color: theme.colors.text }]}>Sort By</Text>
                <RadioButton.Group
                  onValueChange={value => setSortField(value as 'name' | 'room')}
                  value={sortField}
                >
                  <View style={styles.radioOption}>
                    <RadioButton value="name" />
                    <Text>Name</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="room" />
                    <Text>Room Number</Text>
                  </View>
                </RadioButton.Group>

                <View style={styles.sortDirectionContainer}>
                  <Button
                    mode={sortDirection === 'asc' ? 'contained' : 'outlined'}
                    onPress={() => setSortDirection('asc')}
                    style={styles.sortButton}
                  >
                    Ascending
                  </Button>
                  <Button
                    mode={sortDirection === 'desc' ? 'contained' : 'outlined'}
                    onPress={() => setSortDirection('desc')}
                    style={styles.sortButton}
                  >
                    Descending
                  </Button>
                </View>
              </View>

              <View style={styles.filterActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSortField('name');
                    setSortDirection('asc');
                  }}
                  style={styles.filterButton}
                >
                  Reset
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setFilterVisible(false)}
                  style={styles.filterButton}
                >
                  Apply
                </Button>
              </View>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={importModalVisible}
          onDismiss={() => setImportModalVisible(false)}
          contentContainerStyle={[
            styles.importModal,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <ScrollView>
            <View style={styles.importModalContent}>
              <Title>Import Students from Excel</Title>
              
              <Text style={[styles.importInstructions, { color: theme.colors.text }]}>
                Please ensure your Excel file has the following columns:
              </Text>
              
              <View style={styles.columnList}>
                <Text>• Full Name (required)</Text>
                <Text>• Phone (required)</Text>
                <Text>• Room No (required)</Text>
                <Text>• Monthly Rent (required)</Text>
                <Text>• Email (optional)</Text>
                <Text>• Guardian Name (optional)</Text>
                <Text>• Guardian Phone (optional)</Text>
              </View>

              <View style={styles.importActions}>
                <Button
                  mode="outlined"
                  onPress={() => setImportModalVisible(false)}
                  style={styles.importButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleFileSelect}
                  style={styles.importButton}
                >
                  Select File
                </Button>
                <Button
                  mode="outlined"
                  onPress={downloadTemplate}
                  style={styles.importButton}
                >
                  Download Template
                </Button>
              </View>
            </View>
          </ScrollView>
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
  header: {
    marginBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 2,
    minWidth: 200,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
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
    right: 16,
    bottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    gap: 8,
    flexWrap: 'wrap',
  },
  filterContainer: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
    borderRadius: 20,
  },
  tableContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tableHeader: {
    height: 56,
    backgroundColor: '#f5f5f5',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tableRow: {
    minHeight: 72,
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
    backgroundColor: '#e0e0e0',
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
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteOptions: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusSelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusButton: {
    flex: 1,
  },
  importModal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  importModalContent: {
    padding: 20,
  },
  importInstructions: {
    marginBottom: 20,
  },
  columnList: {
    marginBottom: 20,
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  importButton: {
    minWidth: 100,
  },
  filterModal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  filterModalContent: {
    padding: 20,
  },
  filterTitle: {
    marginBottom: 20,
  },
  filterInput: {
    marginBottom: 16,
  },
  sortSection: {
    marginTop: 16,
  },
  filterSubtitle: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  sortDirectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  sortButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterButton: {
    minWidth: 100,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  searchBarSmall: {
    flex: 1,
    width: '100%',
    marginBottom: 8,
  },
  roomSearch: {
    flex: 1,
    minWidth: 100,
    maxWidth: 150,
    backgroundColor: 'transparent',
  },
  roomSearchSmall: {
    flex: 1,
    width: '100%',
    marginBottom: 8,
  },
}); 