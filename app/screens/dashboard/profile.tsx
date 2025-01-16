import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Surface, Text, IconButton, TextInput, Button, ActivityIndicator, Portal, Dialog, Snackbar, Avatar, Divider, SegmentedButtons } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { getProfileData, updateProfileData, updatePGDetails } from '@/app/services/profile.service';
import { validateEmail, validatePhone } from '@/app/utils/validation';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/app/services/upload.service';
import { getAmenities, Amenity } from '@/app/services/amenity.service';

export default function ProfileScreen() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    managerId: '',
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    profileImage: '',
    address: '',
    joinedDate: ''
  });
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalErrors, setPersonalErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: ''
  });

  // PG Details State
  const [pgDetails, setPgDetails] = useState({
    pgId: '',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    type: 'Boys' as const,
    totalRooms: '',
    costPerBed: '',
    capacity: '',  // tenants per room
    contactNumber: '',
    totalTenants: 0,
    description: '',
    createdAt: '',
    amenities: [] as Array<{id: number, name: string}>,
    selectedAmenityNames: [] as string[],
    otherAmenities: '',
    images: [] as string[],
    seasonalPrice: '',
    rating: 0,
    occupancyRate: 0
  });
  const [editingPG, setEditingPG] = useState(false);
  const [pgErrors, setPgErrors] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    type: '',
    contactNumber: '',
    totalRooms: '',
    capacity: ''
  });

  // Add after the PG Details state
  const [selectedAmenities, setSelectedAmenities] = useState<Array<{id: number, name: string}>>([]);
  const [otherAmenities, setOtherAmenities] = useState('');
  const [pgImages, setPgImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Add to state declarations
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);

  useEffect(() => {
    loadProfileData();
    loadAmenities();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await getProfileData();
      
      // Update personal info
      setPersonalInfo({
        managerId: data.personalInfo.managerId,
        fullName: data.personalInfo.fullName,
        email: data.personalInfo.email,
        phone: data.personalInfo.phone,
        alternatePhone: data.personalInfo.alternatePhone,
        profileImage: data.personalInfo.profileImage,
        address: data.personalInfo.address,
        joinedDate: data.personalInfo.joinedDate
      });

      // Update PG details if available
      if (data.pg) {
        setPgDetails({
          pgId: data.pg.pgId,
          name: data.pg.name,
          address: data.pg.address,
          city: data.pg.city,
          state: data.pg.state,
          pincode: data.pg.pincode,
          type: data.pg.type || 'Boys',
          totalRooms: data.pg.totalRooms?.toString() || '',
          costPerBed: data.pg.costPerBed?.toString() || '',
          capacity: data.pg.capacity?.toString() || '',
          contactNumber: data.pg.contactNumber,
          totalTenants: data.pg.totalTenants || 0,
          description: data.pg.description || '',
          createdAt: data.pg.createdAt,
          amenities: data.pg.amenities || [],
          selectedAmenityNames: data.pg.selectedAmenityNames || [],
          otherAmenities: data.pg.otherAmenities || '',
          images: data.pg.images || [],
          seasonalPrice: data.pg.seasonalPrice || '',
          rating: data.pg.rating || 0,
          occupancyRate: data.pg.occupancyRate || 0
        });
        setSelectedAmenities(data.pg.amenities || []);
        setOtherAmenities(data.pg.otherAmenities || '');
        setPgImages(data.pg.images || []);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      // TODO: Implement image upload logic
      setPersonalInfo(prev => ({
        ...prev,
        profileImage: result.assets[0].uri
      }));
    }
  };

  const validatePersonalInfo = () => {
    const errors = {
      fullName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: ''
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
    if (personalInfo.alternatePhone && !validatePhone(personalInfo.alternatePhone)) {
      errors.alternatePhone = 'Invalid alternate phone number';
    }

    setPersonalErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const validatePGDetails = () => {
    const errors = {
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      type: '',
      contactNumber: '',
      totalRooms: '',
      capacity: ''
    };
    
    if (!pgDetails.name) errors.name = 'PG name is required';
    if (!pgDetails.address) errors.address = 'Address is required';
    if (!pgDetails.city) errors.city = 'City is required';
    if (!pgDetails.state) errors.state = 'State is required';
    if (!pgDetails.pincode) errors.pincode = 'Pincode is required';
    if (!pgDetails.type) errors.type = 'PG type is required';
    if (!pgDetails.contactNumber) errors.contactNumber = 'Contact number is required';
    if (!pgDetails.totalRooms) errors.totalRooms = 'Total rooms is required';
    if (!pgDetails.capacity) errors.capacity = 'Capacity is required';

    if (!/^\d{6}$/.test(pgDetails.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }

    if (!validatePhone(pgDetails.contactNumber)) {
      errors.contactNumber = 'Invalid contact number format';
    }

    const totalRooms = parseInt(pgDetails.totalRooms);
    if (isNaN(totalRooms) || totalRooms <= 0) {
      errors.totalRooms = 'Total rooms must be greater than 0';
    }

    const capacity = parseInt(pgDetails.capacity);
    if (isNaN(capacity) || capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }

    if (!['Boys', 'Girls', 'Co-ed'].includes(pgDetails.type)) {
      errors.type = 'Invalid PG type';
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
      // Calculate total tenants before saving
      const totalTenants = (parseInt(pgDetails.totalRooms) || 0) * (parseInt(pgDetails.capacity) || 0);
      
      await updatePGDetails({
        ...pgDetails,
        totalRooms: parseInt(pgDetails.totalRooms),
        capacity: parseInt(pgDetails.capacity),
        totalTenants
      });

      setEditingPG(false);
      setSnackbarMessage('PG details updated successfully');
      setSnackbarVisible(true);
      
      // Reload data to ensure we have the latest
      await loadProfileData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const calculateTotalTenants = () => {
    const rooms = parseInt(pgDetails.totalRooms) || 0;
    const capacity = parseInt(pgDetails.capacity) || 0;
    return rooms * capacity;
  };

  useEffect(() => {
    // Update total tenants whenever rooms or capacity changes
    const total = calculateTotalTenants();
    setPgDetails(prev => ({ ...prev, totalTenants: total }));
  }, [pgDetails.totalRooms, pgDetails.capacity]);

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        const imageUrl = await uploadImage(result.assets[0].uri);
        setPgDetails(prev => ({
          ...prev,
          images: [...prev.images, imageUrl]
        }));
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const loadAmenities = async () => {
    try {
      const amenities = await getAmenities();
      setAvailableAmenities(amenities);
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
      {/* Profile Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.profileImageContainer}>
          {personalInfo.profileImage ? (
            <Image 
              source={{ uri: personalInfo.profileImage }} 
              style={styles.profileImage}
            />
          ) : (
            <Avatar.Text 
              size={100} 
              label={personalInfo.fullName.substring(0, 2).toUpperCase()} 
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          <IconButton
            icon="camera"
            size={24}
            style={styles.editImageButton}
            onPress={pickImage}
          />
        </View>
        <Text style={[styles.profileName, { color: theme.colors.primary }]}>
          {personalInfo.fullName}
        </Text>
        <Text style={styles.joinDate}>
          Member since {new Date(personalInfo.joinedDate).toLocaleDateString()}
        </Text>
      </Surface>

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
          label="Phone"
          value={personalInfo.phone}
          onChangeText={text => setPersonalInfo({ ...personalInfo, phone: text })}
          disabled={!editingPersonal}
          error={!!personalErrors.phone}
          style={styles.input}
        />
        {personalErrors.phone ? (
          <Text style={styles.errorText}>{personalErrors.phone}</Text>
        ) : null}

        <TextInput
          label="Alternate Phone"
          value={personalInfo.alternatePhone}
          onChangeText={text => setPersonalInfo({ ...personalInfo, alternatePhone: text })}
          disabled={!editingPersonal}
          error={!!personalErrors.alternatePhone}
          style={styles.input}
        />
        {personalErrors.alternatePhone ? (
          <Text style={styles.errorText}>{personalErrors.alternatePhone}</Text>
        ) : null}

        <TextInput
          label="Address"
          value={personalInfo.address}
          onChangeText={text => setPersonalInfo({ ...personalInfo, address: text })}
          disabled={!editingPersonal}
          error={!!personalErrors.address}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        {personalErrors.address ? (
          <Text style={styles.errorText}>{personalErrors.address}</Text>
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
          mode="outlined"
          disabled={!editingPG}
          error={!!pgErrors.name}
          style={styles.input}
        />

        <SegmentedButtons
          value={pgDetails.type}
          onValueChange={value => setPgDetails({ ...pgDetails, type: value })}
          buttons={[
            { value: 'Boys', label: 'Boys' },
            { value: 'Girls', label: 'Girls' },
            { value: 'Co-ed', label: 'Co-ed' }
          ]}
          disabled={!editingPG}
          style={styles.segmentedButtons}
        />

        <View style={styles.inputRow}>
          <TextInput
            label="Total Rooms"
            value={pgDetails.totalRooms.toString()}
            onChangeText={text => {
              const rooms = parseInt(text) || 0;
              setPgDetails(prev => ({
                ...prev,
                totalRooms: text,
                totalTenants: rooms * (parseInt(prev.capacity) || 0)
              }));
            }}
            mode="outlined"
            disabled={!editingPG}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
            error={!!pgErrors.totalRooms}
          />
          <TextInput
            label="Tenants per Room"
            value={pgDetails.capacity.toString()}
            onChangeText={text => {
              const capacity = parseInt(text) || 0;
              setPgDetails(prev => ({
                ...prev,
                capacity: text,
                totalTenants: (parseInt(prev.totalRooms) || 0) * capacity
              }));
            }}
            mode="outlined"
            disabled={!editingPG}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
            error={!!pgErrors.capacity}
          />
        </View>

        <TextInput
          label="Total Tenants (Auto-calculated)"
          value={pgDetails.totalTenants.toString()}
          mode="outlined"
          disabled={true}
          style={styles.input}
        />

        <TextInput
          label="Contact Number"
          value={pgDetails.contactNumber}
          onChangeText={text => setPgDetails({ ...pgDetails, contactNumber: text })}
          disabled={!editingPG}
          error={!!pgErrors.contactNumber}
          style={styles.input}
        />
        {pgErrors.contactNumber ? (
          <Text style={styles.errorText}>{pgErrors.contactNumber}</Text>
        ) : null}

        <TextInput
          label="Address"
          value={pgDetails.address}
          onChangeText={text => setPgDetails({ ...pgDetails, address: text })}
          disabled={!editingPG}
          error={!!pgErrors.address}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        {pgErrors.address ? (
          <Text style={styles.errorText}>{pgErrors.address}</Text>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            label="City"
            value={pgDetails.city}
            onChangeText={text => setPgDetails({ ...pgDetails, city: text })}
            disabled={!editingPG}
            error={!!pgErrors.city}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            label="State"
            value={pgDetails.state}
            onChangeText={text => setPgDetails({ ...pgDetails, state: text })}
            disabled={!editingPG}
            error={!!pgErrors.state}
            style={[styles.input, styles.halfInput]}
          />
        </View>

        <View style={styles.inputRow}>
          <TextInput
            label="Pincode"
            value={pgDetails.pincode}
            onChangeText={text => setPgDetails({ ...pgDetails, pincode: text })}
            disabled={!editingPG}
            error={!!pgErrors.pincode}
            style={[styles.input, styles.halfInput]}
            keyboardType="numeric"
          />
          <TextInput
            label="Tenants per Room"
            value={pgDetails.capacity}
            onChangeText={text => setPgDetails({ ...pgDetails, capacity: text })}
            disabled={!editingPG}
            error={!!pgErrors.capacity}
            style={[styles.input, styles.halfInput]}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputRow}>
          <TextInput
            label="Cost per Bed"
            value={pgDetails.costPerBed}
            onChangeText={text => setPgDetails({ ...pgDetails, costPerBed: text })}
            disabled={!editingPG}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
          />
        </View>

        <TextInput
          label="Description"
          value={pgDetails.description}
          onChangeText={text => setPgDetails({ ...pgDetails, description: text })}
          disabled={!editingPG}
          style={styles.input}
          multiline
          numberOfLines={4}
        />

        <Divider style={styles.divider} />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pgDetails.totalRooms}</Text>
            <Text style={styles.statLabel}>Total Rooms</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pgDetails.capacity}</Text>
            <Text style={styles.statLabel}>Tenants per Room</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pgDetails.totalTenants}</Text>
            <Text style={styles.statLabel}>Total Tenants</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Amenities</Text>
        <View style={styles.amenitiesContainer}>
          {availableAmenities.map((amenity) => (
            <Button
              key={amenity.id}
              mode={selectedAmenityIds.includes(amenity.id) ? "contained" : "outlined"}
              onPress={() => {
                if (selectedAmenityIds.includes(amenity.id)) {
                  setSelectedAmenityIds(prev => prev.filter(id => id !== amenity.id));
                  setPgDetails(prev => ({
                    ...prev,
                    amenities: prev.amenities.filter(a => a.id !== amenity.id)
                  }));
                } else {
                  setSelectedAmenityIds(prev => [...prev, amenity.id]);
                  setPgDetails(prev => ({
                    ...prev,
                    amenities: [...prev.amenities, { id: amenity.id, name: amenity.name }]
                  }));
                }
              }}
              style={styles.amenityButton}
              disabled={!editingPG}
            >
              {amenity.name}
            </Button>
          ))}
        </View>

        <TextInput
          label="Other Amenities"
          value={pgDetails.otherAmenities}
          onChangeText={text => setPgDetails(prev => ({ ...prev, otherAmenities: text }))}
          mode="outlined"
          disabled={!editingPG}
          multiline
          numberOfLines={2}
          style={styles.input}
        />

        {editingPG && (
          <Button mode="contained" onPress={handleSavePG} style={styles.saveButton}>
            Save Changes
          </Button>
        )}
      </Surface>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        {selectedAmenities.map((amenity, index) => (
          <Text key={amenity.id}>{amenity.name}</Text>
        ))}
        {otherAmenities && (
          <Text>Other Amenities: {otherAmenities}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PG Images</Text>
        <ScrollView horizontal style={styles.imageScroll}>
          {pgDetails.images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.pgImage} />
              {editingPG && (
                <IconButton
                  icon="close"
                  size={20}
                  style={styles.removeImageButton}
                  onPress={() => {
                    setPgDetails(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }));
                  }}
                />
              )}
            </View>
          ))}
          {editingPG && (
            <Button
              mode="outlined"
              onPress={handleImageUpload}
              loading={uploadingImage}
              style={styles.addImageButton}
              icon="camera"
            >
              Add Image
            </Button>
          )}
        </ScrollView>
      </View>

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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 8,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageButton: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    backgroundColor: 'white',
    elevation: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  joinDate: {
    opacity: 0.7,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  halfInput: {
    flex: 0.48,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  divider: {
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.7,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  pgImage: {
    width: 120,
    height: 120,
    marginRight: 8,
    borderRadius: 8
  },
  imageScroll: {
    flexGrow: 0,
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
  },
  addImageButton: {
    height: 120,
    justifyContent: 'center',
    marginLeft: 8,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amenityButton: {
    marginBottom: 8,
    marginRight: 8,
  },
}); 