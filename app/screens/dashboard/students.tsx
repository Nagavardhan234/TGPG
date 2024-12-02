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
import { useLocalSearchParams, router } from 'expo-router';

interface StudentForm {
  name: string;
  phone: string;
  roomNumber: string;
  monthlyRent: string;
  aadhaar: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
}

export default function StudentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const paperTheme = useTheme();
  const { theme, isDarkMode } = useCustomTheme();
  const { action } = useLocalSearchParams();
  
  const [formData, setFormData] = useState<StudentForm>({
    name: '',
    phone: '',
    roomNumber: '',
    monthlyRent: '',
    aadhaar: '',
    email: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(true);

  useEffect(() => {
    if (action === 'add') {
      setModalVisible(true);
    }
  }, [action]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        // TODO: Load actual data
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsTableLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to add student
      console.log('Form Data:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setModalVisible(false);
      // Reset form
      setFormData({
        name: '',
        phone: '',
        roomNumber: '',
        monthlyRent: '',
        aadhaar: '',
        email: '',
        guardianName: '',
        guardianPhone: '',
        address: '',
      });
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setIsLoading(false);
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

        {isTableLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <DataTable.Row>
            <DataTable.Cell textStyle={{ color: theme.colors.text }}>John Doe</DataTable.Cell>
            <DataTable.Cell textStyle={{ color: theme.colors.text }}>101</DataTable.Cell>
            <DataTable.Cell textStyle={{ color: theme.colors.text }}>1234567890</DataTable.Cell>
            <DataTable.Cell textStyle={{ color: theme.colors.text }}>Active</DataTable.Cell>
          </DataTable.Row>
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
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />

              <TextInput
                label="Room Number"
                value={formData.roomNumber}
                onChangeText={(text) => setFormData({ ...formData, roomNumber: text })}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Monthly Rent (Optional)"
                value={formData.monthlyRent}
                onChangeText={(text) => setFormData({ ...formData, monthlyRent: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                label="Aadhaar Number"
                value={formData.aadhaar}
                onChangeText={(text) => setFormData({ ...formData, aadhaar: text })}
                mode="outlined"
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
                label="Address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                mode="outlined"
                multiline
                numberOfLines={3}
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
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Student'}
                </Button>
              </View>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        label="Add Student"
        style={[styles.fab, { 
          backgroundColor: isDarkMode ? '#D0BCFF' : theme.colors.primary // Lighter color in dark mode
        }]}
        onPress={() => setModalVisible(true)}
        labelStyle={[
          styles.fabLabel,
          { color: isDarkMode ? '#000000' : '#FFFFFF' } // Black text on light background in dark mode
        ]}
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 6,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    maxHeight: '90%',
  },
  modalContent: {
    padding: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Even darker overlay
  },
}); 