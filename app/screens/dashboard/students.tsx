import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
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
import { getStudents, addStudent, getDefaultRent, Student, StudentForm, deleteStudent, updateStudent, importStudentsFromExcel, getStudentsWithPagination, getAvailableRooms } from '@/app/services/student.service';
import { showMessage } from 'react-native-flash-message';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { StudentDetailsModal } from '@/app/components/StudentDetailsModal';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { ExtendedTheme } from '@/app/types/theme';
import * as DocumentPicker from 'expo-document-picker';
import { TokenExpiredError } from '@/app/services/student.service';

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

  const [filterStatus, setFilterStatus] = useState('ACTIVE');
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
  const [sortField, setSortField] = useState<'name' | 'room' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [importModalVisible, setImportModalVisible] = useState(false);

  // Add pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadStudents();
    loadDefaultRent();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      loadDefaultRent();
    }
  }, [modalVisible]);

  useEffect(() => {
    if (selectedStudent && editModalVisible) {
      setEditFormData({
        name: selectedStudent.FullName,
        phone: selectedStudent.Phone,
        email: selectedStudent.Email || '',
        monthlyRent: selectedStudent.Monthly_Rent || '',
        guardianName: selectedStudent.GuardianName || '',
        guardianPhone: selectedStudent.GuardianNumber || '',
        password: '', // Don't populate password
        roomNo: selectedStudent.Room_No || 0,
        joinDate: selectedStudent.MoveInDate,
        status: selectedStudent.Status
      });
    }
  }, [selectedStudent, editModalVisible]);

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

  const handleTokenExpiration = async () => {
    try {
      // Clear all auth related data
      await AsyncStorage.multiRemove(['token', 'user', 'pg']);
      
      // Show message to user
      showMessage({
        message: 'Session Expired',
        description: 'Please login again to continue',
        type: 'warning',
      });

      // Redirect to login
      router.replace('/login');
    } catch (error) {
      console.error('Error handling token expiration:', error);
    }
  };

  const loadStudents = async (pageNum = page, search = searchQuery, status = filterStatus) => {
    try {
      setLoading(true);
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) throw new Error('PG data not found');
      
      const { PGID } = JSON.parse(pgData);
      const response = await getStudentsWithPagination(PGID, pageNum, 10, search, status);
      
      setStudents(response.data);
      setTotalPages(response.totalPages);
      setPage(response.currentPage);
    } catch (error) {
      console.error('Error loading students:', error);
      
      if (error instanceof TokenExpiredError) {
        await handleTokenExpiration();
        return;
      }

      setError({
        message: error instanceof Error ? error.message : 'Failed to load students',
        type: 'error'
      });
    } finally {
      setLoading(false);
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

  const handleEdit = async (student: Student) => {
    try {
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) throw new Error('PG data not found');
      const { PGID } = JSON.parse(pgData);

      // Set the form data correctly
      setFormData({
        name: student.FullName,
        phone: student.Phone,
        email: student.Email || '',
        monthlyRent: student.Monthly_Rent.toString(),
        guardianName: student.GuardianName || '',
        guardianPhone: student.GuardianNumber || '',
        password: student.Password || '',
        roomNo: parseInt(student.Room_No),
        joinDate: student.MoveInDate,
        status: student.Status
      });

      setSelectedStudent(student);
      setIsEditMode(true);
      setModalVisible(true);
    } catch (error) {
      console.error('Error preparing edit:', error);
      showMessage({
        message: 'Error preparing to edit student',
        type: 'danger'
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedStudent) return;

    try {
      setIsSubmitting(true);
      const pgData = await AsyncStorage.getItem('pg');
      if (!pgData) {
        throw new Error('PG data not found');
      }
      const { PGID } = JSON.parse(pgData);

      await updateStudent(PGID, selectedStudent.TenantID, formData);
      
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
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        await handleTokenExpiration();
        return;
      }
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
      setViewModalVisible(false); // Close view modal first
      await deleteStudent(studentId, deleteType);
      showMessage({
        message: 'Student deleted successfully',
        type: 'success',
      });
      loadStudents(); // Refresh the list
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        await handleTokenExpiration();
        return;
      }
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

  // Add search handler with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    setSearchTimeout(setTimeout(() => {
      loadStudents(1, query);
    }, 500));
  };

  // Add sorting function
  const handleSort = (field: 'name' | 'room') => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking new field, set it with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort the students array
  const sortedStudents = useMemo(() => {
    if (!sortField) return students;

    return [...students].sort((a, b) => {
      let compareA, compareB;
      
      if (sortField === 'name') {
        compareA = a.FullName.toLowerCase();
        compareB = b.FullName.toLowerCase();
      } else {
        compareA = parseInt(a.Room_No);
        compareB = parseInt(b.Room_No);
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDirection]);

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
          <ScrollView style={{ zIndex: 1 }}>
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

              <View style={styles.roomSection}>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>Room Number *</Text>
                <View style={styles.roomInputContainer}>
                  <TextInput
                    label="Room Number *"
                    value={formData.roomNo.toString()}
                    onChangeText={(text) => setFormData({ ...formData, roomNo: parseInt(text) || 0 })}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              <TextInput
                label="Monthly Rent"
                value={formData.monthlyRent}
                onChangeText={(text) => setFormData({ ...prev, monthlyRent: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                disabled={isEditMode}
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
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
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
        <Title style={styles.title}>Student Management</Title>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by name, phone or room"
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
          <SegmentedButtons
            value={filterStatus}
            onValueChange={(value) => {
              setFilterStatus(value as typeof filterStatus);
              loadStudents(1, searchQuery, value);  // Pass status to loadStudents
            }}
            buttons={[
              { value: 'ALL', label: 'All' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'MOVED_OUT', label: 'Moved Out' }
            ]}
          />
        </View>
      </View>

     
      <ScrollView 
        style={styles.tableContainer}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 50; // Trigger loading earlier for smoother experience
          const isCloseToBottom = 
            layoutMeasurement.height + contentOffset.y >= 
            contentSize.height - paddingToBottom;
          
          if (isCloseToBottom && !loading && page < totalPages) {
            loadStudents(page + 1);
          }
        }}
        scrollEventThrottle={16} // More frequent updates for smoother scrolling
        showsVerticalScrollIndicator={false} // Cleaner look
      >
        <DataTable>
          <DataTable.Header style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
            <DataTable.Title 
              style={styles.nameColumn}
              sortDirection={sortField === 'name' ? sortDirection : 'none'}
              onPress={() => handleSort('name')}
            >
              <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>Name</Text>
            </DataTable.Title>
            <DataTable.Title 
              style={styles.roomColumn}
              sortDirection={sortField === 'room' ? sortDirection : 'none'}
              onPress={() => handleSort('room')}
            >
              <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>Room</Text>
            </DataTable.Title>
            <DataTable.Title style={styles.actionColumn}>
              <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>View</Text>
            </DataTable.Title>
          </DataTable.Header>

          {sortedStudents.map((student) => (
            <DataTable.Row 
              key={student.TenantID}
              style={[styles.tableRow, { backgroundColor: theme.colors.surface }]}
            >
              <DataTable.Cell style={styles.nameColumn}>
                <View style={styles.nameCell}>
                  <Avatar.Text 
                    size={36} 
                    label={student.FullName.substring(0, 2).toUpperCase()}
                    style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                  />
                  <Text style={[styles.nameText, { color: theme.colors.onSurface }]}>
                    {student.FullName}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={styles.roomColumn}>
                <View style={styles.roomBadge}>
                  <Text style={[styles.roomText, { color: theme.colors.onSurface }]}>
                    {student.Room_No}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={styles.actionColumn}>
                <IconButton
                  icon="eye"
                  size={24}
                  iconColor={theme.colors.primary}
                  onPress={() => {
                    setSelectedStudent(student);
                    setViewModalVisible(true);
                  }}
                  style={styles.viewButton}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>

      <FAB
        icon="plus"
        style={[
          styles.fab, 
          { backgroundColor: isDarkMode ? '#D0BCFF' : theme.colors.primary }
        ]}
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Dialog
          visible={deleteConfirmVisible && selectedStudent !== null}
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
    position: 'relative',
    zIndex: 1,
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
    paddingHorizontal: 16,
  },
  tableHeader: {
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 8,
    elevation: 2,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tableRow: {
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
  },
  nameColumn: {
    flex: 4,
    paddingRight: 16,
  },
  roomColumn: {
    flex: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'nowrap',
  },
  avatar: {
    width: 40,
    height: 40,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  roomBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignSelf: 'flex-start',
  },
  roomText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    margin: 0,
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