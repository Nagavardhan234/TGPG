import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Platform, useWindowDimensions, TouchableOpacity, RefreshControl } from 'react-native';
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
  SegmentedButtons,
  Card,
  Divider
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
  const isMobile = width < 768;

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
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const response = await getStudents();
      
      if (response.success && response.data) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Load students error:', error);
      if (error instanceof TokenExpiredError) {
        await handleTokenExpiration();
      } else {
        setError({
          message: 'Failed to load students. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadDefaultRent = async () => {
    try {
      console.log('Fetching default rent...');
      const rent = await getDefaultRent();
      console.log('Default rent received:', rent);
      setFormData(prev => ({
        ...prev,
        monthlyRent: rent.toString()
      }));
    } catch (error) {
      console.error('Error loading default rent:', error);
      if (error instanceof TokenExpiredError) {
        await handleTokenExpiration();
      } else {
        setError({
          message: error instanceof Error ? error.message : 'Failed to load default rent',
          type: 'error'
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const studentData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        moveInDate: formData.joinDate,
        monthlyRent: Number(formData.monthlyRent),
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        password: formData.password,
        roomNo: Number(formData.roomNo)
      };

      const response = await addStudent(studentData);
      showMessage({
        message: 'Success',
        description: 'Student added successfully',
        type: 'success',
      });
      setModalVisible(false);
      loadStudents();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiration();
        return;
      }
      setError({
        message: error instanceof Error ? error.message : 'Failed to add student',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        joinDate: formattedDate,
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

  const handleDelete = async () => {
    try {
      if (!selectedStudent) return;

      await deleteStudent(selectedStudent.TenantID, deleteType);
      showMessage({
        message: 'Success',
        description: 'Student deleted successfully',
        type: 'success',
      });
      setDeleteConfirmVisible(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        await handleTokenExpiration();
      } else {
        setError({
          message: error instanceof Error ? error.message : 'Failed to delete student',
          type: 'error'
        });
      }
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
    await loadStudents(1); // Reset to first page when refreshing
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
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
          student.FullName.toLowerCase().includes(searchLower) ||
          student.Phone.includes(searchQuery) ||
          student.Room_No.toString().includes(searchQuery)
        );
      })
      .filter(student => filterStatus === 'ALL' ? true : student.Status === filterStatus)
      .sort((a, b) => {
        const direction = sortOrder === 'asc' ? 1 : -1;
        switch (sortBy) {
          case 'name':
            return direction * a.FullName.localeCompare(b.FullName);
          case 'room':
            return direction * ((a.Room_No || 0) - (b.Room_No || 0));
          default:
            return 0;
        }
      });
  }, [students, searchQuery, filterStatus, sortBy, sortOrder]);

  // Update search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  };

  // Update filter handler
  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setPage(1); // Reset to first page when filtering
  };

  // Add room filter handler
  const handleRoomFilter = (roomNumber: string) => {
    setFilterRoom(roomNumber);
    setPage(1);
    loadStudents(1);
  };

  // Clean up search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Update search bar component
  const renderSearchBar = () => (
    <Searchbar
      placeholder="Search by name or phone..."
      onChangeText={handleSearch}
      value={searchQuery}
      style={styles.searchBar}
      onClearIconPress={() => {
        setSearchQuery('');
        setPage(1);
        loadStudents(1);
      }}
    />
  );

  // Update filter component
  const renderFilter = () => (
    <SegmentedButtons
      value={filterStatus}
      onValueChange={handleFilterChange}
      buttons={[
        { value: 'ALL', label: 'All' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'MOVED_OUT', label: 'Moved Out' }
      ]}
      style={styles.filterButtons}
    />
  );

  const renderTable = () => (
    <DataTable style={styles.table}>
      <DataTable.Header style={styles.tableHeader}>
        <DataTable.Title style={styles.logoColumn}></DataTable.Title>
        <DataTable.Title style={styles.nameColumn}>Name</DataTable.Title>
        <DataTable.Title style={styles.phoneColumn}>Phone</DataTable.Title>
        <DataTable.Title style={styles.roomColumn}>Room</DataTable.Title>
        <DataTable.Title style={styles.actionColumn}>Actions</DataTable.Title>
      </DataTable.Header>

      {students.map((student) => (
        <DataTable.Row key={student.TenantID}>
          <DataTable.Cell style={styles.logoColumn}>
            <Avatar.Text 
              size={40} 
              label={student.FullName.split(' ').map(n => n[0]).join('')}
              style={{ backgroundColor: theme.colors.primary }}
            />
          </DataTable.Cell>
          <DataTable.Cell style={styles.nameColumn}>{student.FullName}</DataTable.Cell>
          <DataTable.Cell style={styles.phoneColumn}>{student.Phone}</DataTable.Cell>
          <DataTable.Cell style={styles.roomColumn}>{student.Room_No}</DataTable.Cell>
          <DataTable.Cell style={styles.actionColumn}>
            <IconButton
              icon="eye"
              size={20}
              onPress={() => handleViewStudent(student)}
            />
          </DataTable.Cell>
        </DataTable.Row>
      ))}
    </DataTable>
  );

  // Add sorting handler
  const handleSort = (field: 'name' | 'room') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Add sorted students computation
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'name') {
        return direction * a.FullName.localeCompare(b.FullName);
      }
      
      if (sortField === 'room') {
        const roomA = a.Room_No || 0;
        const roomB = b.Room_No || 0;
        return direction * (roomA - roomB);
      }
      
      return 0;
    });
  }, [students, sortField, sortDirection]);

  // Render student card with alternating backgrounds
  const renderStudentCard = (student: Student, index: number) => (
    <Card 
      style={[
        styles.studentCard,
        { 
          backgroundColor: index % 2 === 0 ? theme.colors.surface : theme.colors.surfaceVariant,
          elevation: 2,
        }
      ]}
      onPress={() => handleViewStudent(student)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleSection}>
            <Avatar.Text 
              size={40} 
              label={student.FullName.split(' ').map(n => n[0]).join('')} 
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.cardTitleText}>
              <Text variant="titleMedium" style={styles.studentName}>{student.FullName}</Text>
              <Text variant="bodyMedium" style={[styles.studentPhone, { color: theme.colors.onSurfaceVariant }]}>
                {student.Phone}
              </Text>
            </View>
          </View>
          <View style={styles.cardInfo}>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(student.Status, theme) }
              ]}
            >
              {student.Status}
            </Chip>
            <Text style={[styles.roomNumber, { color: theme.colors.primary }]}>
              Room {student.Room_No}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // Add debounced search
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      loadStudents(1);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, filterStatus]);

  // Initial load
  useEffect(() => {
    loadStudents();
  }, []);

  // Update pagination handlers
  const handlePreviousPage = () => {
    if (page > 1) {
      loadStudents(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      loadStudents(page + 1);
    }
  };

  // Add view student handler
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setViewModalVisible(true);
  };

  // Add view modal component
  const ViewStudentModal = () => {
    if (!selectedStudent) return null;

    return (
      <Modal
        visible={viewModalVisible}
        onDismiss={() => {
          setViewModalVisible(false);
          setSelectedStudent(null);
        }}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <ScrollView>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Avatar.Text 
                size={60} 
                label={selectedStudent.FullName.split(' ').map(n => n[0]).join('')}
                style={{ backgroundColor: theme.colors.primary }}
              />
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                {selectedStudent.FullName}
              </Text>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Phone</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {selectedStudent.Phone}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Room No</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {selectedStudent.Room_No}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Status</Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getStatusColor(selectedStudent.Status, theme) }}
                >
                  {selectedStudent.Status}
                </Chip>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Join Date</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {new Date(selectedStudent.MoveInDate).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Monthly Rent</Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  ₹{selectedStudent.Monthly_Rent}
                </Text>
              </View>

              {selectedStudent.Email && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                    {selectedStudent.Email}
                  </Text>
                </View>
              )}

              {selectedStudent.GuardianName && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Guardian Name</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                    {selectedStudent.GuardianName}
                  </Text>
                </View>
              )}

              {selectedStudent.GuardianNumber && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Guardian Phone</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                    {selectedStudent.GuardianNumber}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setViewModalVisible(false);
                  setEditModalVisible(true);
                }}
                style={styles.actionButton}
              >
                Edit
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setViewModalVisible(false);
                  setDeleteConfirmVisible(true);
                }}
                style={styles.actionButton}
                buttonColor={theme.colors.error}
              >
                Delete
              </Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    );
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

        <ViewStudentModal />

        <Modal
          visible={modalVisible}
          onDismiss={handleModalClose}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
          style={styles.modalOverlay}
        >
          <ScrollView style={{ zIndex: 1 }}>
            <View style={styles.modalContent}>
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

              <View style={styles.formSection}>
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

                <View style={styles.datePickerContainer}>
                  <TextInput
                    label="Join Date *"
                    value={formData.joinDate}
                    mode="outlined"
                    style={styles.input}
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
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange}
                    />
                  )}
                </View>

                {isEditMode && (
                  <View style={styles.statusSelector}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>Status</Text>
                    <SegmentedButtons
                      value={editFormData.status}
                      onValueChange={value => 
                        setEditFormData(prev => ({ ...prev, status: value as 'ACTIVE' | 'INACTIVE' | 'MOVED_OUT' }))
                      }
                      buttons={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'INACTIVE', label: 'Inactive' },
                        { value: 'MOVED_OUT', label: 'Moved Out' }
                      ]}
                    />
                  </View>
                )}
              </View>

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
        <Title style={[styles.title, { color: theme.colors.onBackground }]}>
          Student Management
        </Title>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by name, phone or room..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
            icon="magnify"
            clearIcon="close"
            onClearIconPress={() => {
              setSearchQuery('');
              loadStudents();
            }}
          />
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
          >
            <SegmentedButtons
              value={filterStatus}
              onValueChange={handleFilterChange}
              buttons={[
                { value: 'ALL', label: 'All' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'MOVED_OUT', label: 'Moved Out' }
              ]}
              style={styles.filterButtons}
            />
          </ScrollView>
        </View>
      </View>

      <ScrollView 
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
        ) : (
          <View style={styles.cardContainer}>
            {filteredStudents.map((student, index) => renderStudentCard(student, index))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label={isMobile ? undefined : "Add Student"}
        style={[
          styles.fab,
          { 
            backgroundColor: isDarkMode ? '#D0BCFF' : theme.colors.primary,
            right: isMobile ? 16 : 24,
            bottom: isMobile ? 16 : 24,
          }
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

      <View style={styles.paginationContainer}>
        <Button
          mode="outlined"
          onPress={handlePreviousPage}
          disabled={page === 1 || isLoading}
        >
          Previous
        </Button>
        <Text style={styles.pageInfo}>
          Page {page} of {totalPages}
        </Text>
        <Button
          mode="outlined"
          onPress={handleNextPage}
          disabled={page >= totalPages || isLoading}
        >
          Next
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  searchContainer: {
    gap: 16,
  },
  searchBar: {
    elevation: 2,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterScrollView: {
    marginBottom: 8,
  },
  filterButtons: {
    minWidth: 300,
  },
  contentContainer: {
    flex: 1,
  },
  cardContainer: {
    gap: 12,
    paddingBottom: 80,
  },
  studentCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitleText: {
    flex: 1,
  },
  studentName: {
    fontWeight: 'bold',
  },
  studentPhone: {
    opacity: 0.7,
  },
  cardInfo: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusChip: {
    borderRadius: 8,
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
  },
  loader: {
    padding: 20,
  },
  modalContainer: {
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    borderRadius: 16,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 24,
    gap: 24,
  },
  formSection: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  errorNotification: {
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    minWidth: 100,
  },
  filterModal: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    maxWidth: 600,
    width: '90%',
    alignSelf: 'center',
  },
  filterModalContent: {
    gap: 24,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sortSection: {
    marginBottom: 16,
  },
  filterSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sortDirectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortButton: {
    minWidth: 100,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  filterButton: {
    minWidth: 100,
  },
  columnList: {
    marginBottom: 16,
  },
  importModal: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    maxWidth: 600,
    width: '90%',
    alignSelf: 'center',
  },
  importModalContent: {
    gap: 24,
  },
  importInstructions: {
    fontSize: 16,
    marginBottom: 16,
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  importButton: {
    minWidth: 100,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  pageInfo: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 