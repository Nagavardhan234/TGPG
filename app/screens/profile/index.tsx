import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, IconButton, TextInput, Button, ActivityIndicator, Portal, Dialog, Snackbar } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { getProfileData, updateProfileData, updatePGDetails } from '@/app/services/profile.service';
import { validateEmail, validatePhone } from '@/app/utils/validation';

export default function ProfileScreen() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalErrors, setPersonalErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  // PG Details State
  const [pgDetails, setPgDetails] = useState({
    name: '',
    address: '',
    numRooms: 0,
    numStudents: 0,
    latitude: 0,
    longitude: 0,
  });
  const [editingPG, setEditingPG] = useState(false);
  const [pgErrors, setPgErrors] = useState({
    name: '',
    address: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await getProfileData();
      setPersonalInfo({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      });
      setPgDetails({
        name: data.pg.name,
        address: data.pg.address,
        numRooms: data.pg.numRooms,
        numStudents: data.pg.numStudents,
        latitude: data.pg.latitude,
        longitude: data.pg.longitude,
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validatePersonalInfo = () => {
    const errors = {
      fullName: '',
      email: '',
      phone: '',
    };
    
    if (!personalInfo.fullName) {
      errors.fullName = 'Full name is required';
    }
    if (!validateEmail(personalInfo.email)) {
      errors.email = 'Invalid email format';
    }
    if (!validatePhone(personalInfo.phone)) {
      errors.phone = 'Invalid phone number';
    }

    setPersonalErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const validatePGDetails = () => {
    const errors = {
      name: '',
      address: '',
    };
    
    if (!pgDetails.name) {
      errors.name = 'PG name is required';
    }
    if (!pgDetails.address) {
      errors.address = 'Address is required';
    }

    setPgErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSavePersonal = async () => {
    if (!validatePersonalInfo()) return;

    try {
      await updateProfileData(personalInfo);
      setEditingPersonal(false);
      setSnackbarMessage('Personal information updated successfully');
      setSnackbarVisible(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSavePG = async () => {
    if (!validatePGDetails()) return;

    try {
      await updatePGDetails(pgDetails);
      setEditingPG(false);
      setSnackbarMessage('PG details updated successfully');
      setSnackbarVisible(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Personal Information Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Personal Information</Text>
          <IconButton
            icon={editingPersonal ? 'close' : 'pencil'}
            onPress={() => setEditingPersonal(!editingPersonal)}
          />
        </View>

        <TextInput
          label="Full Name"
          value={personalInfo.fullName}
          onChangeText={text => setPersonalInfo({ ...personalInfo, fullName: text })}
          disabled={!editingPersonal}
          error={!!personalErrors.fullName}
          style={styles.input}
        />
        {personalErrors.fullName ? (
          <Text style={styles.errorText}>{personalErrors.fullName}</Text>
        ) : null}

        <TextInput
          label="Email"
          value={personalInfo.email}
          onChangeText={text => setPersonalInfo({ ...personalInfo, email: text })}
          disabled={!editingPersonal}
          error={!!personalErrors.email}
          style={styles.input}
        />
        {personalErrors.email ? (
          <Text style={styles.errorText}>{personalErrors.email}</Text>
        ) : null}

        <TextInput
          label="Phone Number"
          value={personalInfo.phone}
          onChangeText={text => setPersonalInfo({ ...personalInfo, phone: text })}
          disabled={!editingPersonal}
          error={!!personalErrors.phone}
          style={styles.input}
        />
        {personalErrors.phone ? (
          <Text style={styles.errorText}>{personalErrors.phone}</Text>
        ) : null}

        {editingPersonal && (
          <Button mode="contained" onPress={handleSavePersonal} style={styles.saveButton}>
            Save Changes
          </Button>
        )}
      </Surface>

      {/* PG Details Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>PG Details</Text>
          <IconButton
            icon={editingPG ? 'close' : 'pencil'}
            onPress={() => setEditingPG(!editingPG)}
          />
        </View>

        <TextInput
          label="PG Name"
          value={pgDetails.name}
          onChangeText={text => setPgDetails({ ...pgDetails, name: text })}
          disabled={!editingPG}
          error={!!pgErrors.name}
          style={styles.input}
        />
        {pgErrors.name ? (
          <Text style={styles.errorText}>{pgErrors.name}</Text>
        ) : null}

        <TextInput
          label="Address"
          value={pgDetails.address}
          onChangeText={text => setPgDetails({ ...pgDetails, address: text })}
          disabled={!editingPG}
          error={!!pgErrors.address}
          style={styles.input}
          multiline
        />
        {pgErrors.address ? (
          <Text style={styles.errorText}>{pgErrors.address}</Text>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rooms</Text>
            <Text style={styles.statValue}>{pgDetails.numRooms}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Students</Text>
            <Text style={styles.statValue}>{pgDetails.numStudents}</Text>
          </View>
        </View>

        {editingPG && (
          <Button mode="contained" onPress={handleSavePG} style={styles.saveButton}>
            Save Changes
          </Button>
        )}
      </Surface>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

      <Portal>
        <Dialog visible={!!error} onDismiss={() => setError(null)}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Text>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setError(null)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
}); 