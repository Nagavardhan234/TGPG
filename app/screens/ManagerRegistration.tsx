import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Switch, Modal, ActivityIndicator } from 'react-native';
import {PortalProvider} from 'react-native-portal'
import { 
  Text, 
  TextInput, 
  Button, 
  Surface, 
  MD3Colors, 
  ProgressBar,
  IconButton,
  HelperText,
  Avatar,
  SegmentedButtons,
  Checkbox
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { registerManager, uploadImage } from '../services/manager.service';
import { showMessage } from 'react-native-flash-message';
import { router } from 'expo-router';
import { getAmenities, Amenity } from '../services/amenity.service';
import ValidationModal from '../components/ValidationModal';

type Step = {
  title: string;
  subtitle: string;
  icon: string;
};

const STEPS: Step[] = [
  { 
    title: 'Personal Details', 
    subtitle: 'Your basic information',
    icon: 'account'
  },
  { 
    title: 'PG Details', 
    subtitle: 'About your property',
    icon: 'home'
  },
  { 
    title: 'Payment Setup', 
    subtitle: 'Banking information',
    icon: 'bank'
  },
  { 
    title: 'Review', 
    subtitle: 'Confirm your details',
    icon: 'check-circle'
  }
];

// Add these interfaces
interface RoomType {
  type: 'Single' | 'Double' | 'Triple';
  count: number;
  price: string;
}

interface PGDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  type: 'Boys' | 'Girls' | 'Co-ed';
  contactNumber: string;
  amenities: number[];
  selectedAmenityNames: string[];
  otherAmenities: string;
  totalRooms: string;
  costPerBed: string;
  totalTenants: string;
  images: string[];
  description: string;
  seasonalPrice?: string;
  rating?: number;
  occupancyRate?: number;
}

interface PaymentDetails {
  paymentMethod: 'upi' | 'bank';
  upiId: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  extraCharges: {
    food: boolean;
    foodPrice: string;
    laundry: boolean;
    laundryPrice: string;
    electricity: boolean;
    electricityPrice: string;
  };
  includeGST: boolean;
  includeServiceCharge: boolean;
}

// Add this component for amenities
const AmenityCard = ({ 
  amenity,
  selected, 
  onPress 
}: { 
  amenity: Amenity;
  selected: boolean; 
  onPress: () => void; 
}) => {
  const { theme, isDarkMode } = useTheme();
  
  // Map amenity names to icons (you can expand this mapping)
  const getAmenityIcon = (name: string) => {
    const iconMap: { [key: string]: string } = {
      'WiFi': 'wifi',
      'Air Conditioning': 'air-conditioner',
      'Parking': 'car',
      'Laundry': 'washing-machine',
      'Food Service': 'food',
      'Housekeeping': 'broom',
      'Gym': 'dumbbell',
      'CCTV': 'cctv'
    };
    return iconMap[name] || 'star'; // Default icon
  };
  
  return (
    <TouchableOpacity onPress={onPress}>
      <Surface 
        style={[
          styles.amenityCard,
          { 
            backgroundColor: selected ? theme.colors.primary : isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5',
          }
        ]}
      >
        <IconButton
          icon={getAmenityIcon(amenity.AmenityName)}
          size={24}
          iconColor={selected ? '#fff' : theme.colors.text}
        />
        <Text style={[styles.amenityLabel, { color: selected ? '#fff' : theme.colors.text }]}>
          {amenity.AmenityName}
        </Text>
      </Surface>
    </TouchableOpacity>
  );
};

// Add this component for room type selection
const RoomTypeAccordion = ({
  type,
  isSelected,
  onToggle,
  roomData,
  onUpdate
}: {
  type: RoomType['type'];
  isSelected: boolean;
  onToggle: () => void;
  roomData: RoomType;
  onUpdate: (data: Partial<RoomType>) => void;
}) => {
  const { theme } = useTheme();

  return (
    <Surface style={styles.roomTypeAccordion}>
      <View style={styles.roomTypeHeader}>
        <Checkbox.Item
          label={`${type} Sharing`}
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={onToggle}
          labelStyle={{ color: theme.colors.text }}
        />
      </View>
      
      {isSelected && (
        <View style={styles.roomTypeDetails}>
          <TextInput
            label="Number of Rooms"
            value={roomData.count.toString()}
            onChangeText={text => onUpdate({ count: parseInt(text) || 0 })}
            mode="outlined"
            keyboardType="numeric"
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            label="Price per Bed"
            value={roomData.price}
            onChangeText={text => onUpdate({ price: text })}
            mode="outlined"
            keyboardType="numeric"
            style={[styles.input, { flex: 1 }]}
          />
        </View>
      )}
    </Surface>
  );
};

// Add state for info modal
const [showInfoModal, setShowInfoModal] = useState(false);

// Add this component
const PaymentInfoModal = ({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) => {
  const { theme } = useTheme();
  
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      style={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <Surface style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Understanding Charges</Text>
        
        <View style={styles.exampleCard}>
          <Text style={[styles.exampleTitle, { color: theme.colors.text }]}>Example:</Text>
          <Text style={styles.exampleText}>Room Cost: ₹1000</Text>
          <Text style={styles.exampleText}>GST (18%): ₹180</Text>
          <Text style={styles.exampleText}>Service Charge (5%): ₹50</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.exampleSubtitle}>If charges are included in room cost:</Text>
          <Text style={styles.exampleText}>• You receive: ₹770 (₹1000 - ₹180 - ₹50)</Text>
          <Text style={styles.exampleText}>• Student pays: ₹1000</Text>
          
          <Text style={styles.exampleSubtitle}>If charges are added separately:</Text>
          <Text style={styles.exampleText}>• You receive: ₹1000</Text>
          <Text style={styles.exampleText}>• Student pays: ₹1230 (₹1000 + ₹180 + ₹50)</Text>
        </View>

        <Button mode="contained" onPress={onDismiss}>Got it</Button>
      </Surface>
    </Modal>
  );
};

// Add state for OTP
const [showOTP, setShowOTP] = useState(false);
const [otp, setOTP] = useState('');

// Add validation types
interface ValidationError {
  field: string;
  message: string;
}

export default function ManagerRegistration() {
  const { theme, isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Form states for Step 1
  const [managerDetails, setManagerDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    alternatePhone: '',
  });

  // Add new state for PG details
  const [pgDetails, setPgDetails] = useState<PGDetails>({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    type: 'Boys',
    contactNumber: '',
    amenities: [],
    selectedAmenityNames: [],
    otherAmenities: '',
    totalRooms: '',
    costPerBed: '',
    totalTenants: '',
    images: [],
    description: '',
    seasonalPrice: '',
    rating: undefined,
    occupancyRate: undefined
  });

  // Add state for payment details
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    paymentMethod: 'upi',
    upiId: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    },
    extraCharges: {
      food: false,
      foodPrice: '',
      laundry: false,
      laundryPrice: '',
      electricity: false,
      electricityPrice: ''
    },
    includeGST: true,
    includeServiceCharge: true
  });

  // Add termsAccepted state
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Add state for amenities
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);

  // Add useEffect to fetch amenities
  useEffect(() => {
    const fetchAmenities = async () => {
      setIsLoadingAmenities(true);
      try {
        const amenitiesData = await getAmenities();
        setAvailableAmenities(amenitiesData);
      } catch (error) {
        showMessage({
          message: 'Error',
          description: 'Failed to load amenities',
          type: 'danger',
        });
      } finally {
        setIsLoadingAmenities(false);
      }
    };

    fetchAmenities();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickPGImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPgDetails(prev => ({
        ...prev,
        images: [...prev.images, ...result.assets.map(asset => asset.uri)]
      }));
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <Surface 
            style={[
              styles.stepCircle,
              { 
                backgroundColor: index <= currentStep ? 
                  theme.colors.primary : 
                  isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0'
              }
            ]}
          >
            <IconButton
              icon={step.icon}
              size={24}
              iconColor={index <= currentStep ? 
                isDarkMode ? '#000' : '#fff' : 
                theme.colors.text
              }
            />
          </Surface>
          <Text 
            style={[
              styles.stepTitle,
              { color: theme.colors.text }
            ]}
          >
            {step.title}
          </Text>
          <Text 
            style={[
              styles.stepSubtitle,
              { color: theme.colors.textSecondary }
            ]}
          >
            {step.subtitle}
          </Text>
        </View>
      ))}
      <View 
        style={[
          styles.progressBar,
          { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }
        ]}
      >
        <ProgressBar 
          progress={(currentStep + 1) / STEPS.length} 
          color={theme.colors.primary}
          style={styles.progress}
        />
      </View>
    </View>
  );

  const renderPersonalDetails = () => (
    <View style={styles.formContainer}>
      {/* Profile Image Section */}
      <Surface style={styles.profileSection}>
      <View style={styles.imageUpload}>
          <View style={styles.imageContainer}>
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: theme.colors.primaryContainer }]}>
                <FontAwesome name="user-o" size={40} color={theme.colors.primary} />
            </View>
            )}
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={pickImage}
        >
              <FontAwesome name="camera" size={16} color="white" />
            </TouchableOpacity>
      </View>
          <Text style={[styles.uploadText, { color: theme.colors.text }]}>
            Add Profile Picture
          </Text>
        </View>
      </Surface>

      {/* Personal Info Section */}
      <Surface style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personal Information</Text>
        
        <View style={styles.inputGroup}>
      <TextInput
        label="Full Name"
        value={managerDetails.fullName}
        onChangeText={(text) => setManagerDetails({ ...managerDetails, fullName: text })}
        mode="outlined"
        style={styles.input}
        theme={{
          colors: {
            primary: theme.colors.primary,
            background: 'transparent',
          },
        }}
        left={<TextInput.Icon icon="account" />}
      />
        </View>

        <View style={styles.inputRow}>
      <TextInput
        label="Email"
        value={managerDetails.email}
        onChangeText={text => setManagerDetails({ ...managerDetails, email: text })}
        mode="outlined"
        keyboardType="email-address"
            style={[styles.input, { flex: 1 }]}
            left={<TextInput.Icon icon="email" />}
      />
        </View>

        <View style={styles.inputRow}>
      <TextInput
        label="Phone Number"
        value={managerDetails.phone}
        onChangeText={text => setManagerDetails({ ...managerDetails, phone: text })}
        mode="outlined"
        keyboardType="phone-pad"
            style={[styles.input, { flex: 1 }]}
            left={<TextInput.Icon icon="phone" />}
        right={
          <TextInput.Icon 
            icon={showOTP ? "check-circle" : "send"}
            color={showOTP ? theme.colors.primary : undefined}
            onPress={() => !showOTP && setShowOTP(true)}
          />
        }
      />
        </View>

        {showOTP && (
          <Surface style={styles.otpContainer}>
            <Text style={[styles.otpText, { color: theme.colors.text }]}>
              Enter OTP sent to your phone
            </Text>
            <View style={styles.otpInputRow}>
              {[...Array(6)].map((_, index) => (
                <TextInput
                  key={index}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="numeric"
                  mode="outlined"
                  value={otp[index] || ''}
                  onChangeText={(text) => {
                    const newOTP = otp.split('');
                    newOTP[index] = text;
                    setOTP(newOTP.join(''));
                  }}
                />
              ))}
            </View>
            <Button 
              mode="contained" 
              onPress={() => {
                // Verify OTP logic here
                setShowOTP(false);
              }}
              style={styles.verifyButton}
            >
              Verify OTP
            </Button>
          </Surface>
        )}
      </Surface>

      {/* Security Section */}
      <Surface style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Security</Text>
        
        <View style={styles.inputGroup}>
      <TextInput
        label="Password"
        value={managerDetails.password}
        onChangeText={text => setManagerDetails({ ...managerDetails, password: text })}
        mode="outlined"
        secureTextEntry
        style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon="eye" />}
      />

      <TextInput
        label="Confirm Password"
        value={managerDetails.confirmPassword}
        onChangeText={text => setManagerDetails({ ...managerDetails, confirmPassword: text })}
        mode="outlined"
        secureTextEntry
        style={styles.input}
            left={<TextInput.Icon icon="lock-check" />}
            right={<TextInput.Icon icon="eye" />}
          />
        </View>
      </Surface>

      {/* Address Section */}
      <Surface style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Address</Text>

      <TextInput
          label="Current Address"
        value={managerDetails.address}
        onChangeText={text => setManagerDetails({ ...managerDetails, address: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
          left={<TextInput.Icon icon="map-marker" />}
        />
      </Surface>
    </View>
  );

  const renderPGDetails = () => (
    <View style={styles.formContainer}>
      <TextInput
        label="PG Name"
        value={pgDetails.name}
        onChangeText={text => setPgDetails(prev => ({ ...prev, name: text }))}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Address"
        value={pgDetails.address}
        onChangeText={text => setPgDetails(prev => ({ ...prev, address: text }))}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <View style={styles.inputRow}>
        <TextInput
          label="City"
          value={pgDetails.city}
          onChangeText={text => setPgDetails(prev => ({ ...prev, city: text }))}
          mode="outlined"
          style={[styles.input, { flex: 1 }]}
        />
        <TextInput
          label="State"
          value={pgDetails.state}
          onChangeText={text => setPgDetails(prev => ({ ...prev, state: text }))}
          mode="outlined"
          style={[styles.input, { flex: 1 }]}
        />
      </View>

      <TextInput
        label="Pincode"
        value={pgDetails.pincode}
        onChangeText={text => setPgDetails(prev => ({ ...prev, pincode: text }))}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <SegmentedButtons
        value={pgDetails.type}
        onValueChange={value => setPgDetails(prev => ({ 
          ...prev, 
          type: value as PGDetails['type'] 
        }))}
        buttons={[
          { value: 'Boys', label: 'Boys' },
          { value: 'Girls', label: 'Girls' },
          { value: 'Co-ed', label: 'Co-ed' }
        ]}
      />

      <TextInput
        label="Contact Number"
        value={pgDetails.contactNumber}
        onChangeText={text => setPgDetails(prev => ({ ...prev, contactNumber: text }))}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Amenities</Text>
      {isLoadingAmenities ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <View style={styles.amenitiesGrid}>
          {availableAmenities.map((amenity) => (
            <AmenityCard
              key={amenity.AmenityID}
              amenity={amenity}
              selected={pgDetails.amenities.includes(amenity.AmenityID)}
              onPress={() => {
                setPgDetails(prev => {
                  const isSelected = prev.amenities.includes(amenity.AmenityID);
                  return {
                    ...prev,
                    amenities: isSelected 
                      ? prev.amenities.filter(id => id !== amenity.AmenityID)
                      : [...prev.amenities, amenity.AmenityID],
                    selectedAmenityNames: isSelected
                      ? prev.selectedAmenityNames.filter(name => name !== amenity.AmenityName)
                      : [...prev.selectedAmenityNames, amenity.AmenityName]
                  };
                });
              }}
            />
          ))}
        </View>
      )}

      <TextInput
        label="Other Amenities"
        value={pgDetails.otherAmenities}
        onChangeText={text => setPgDetails(prev => ({ ...prev, otherAmenities: text }))}
        mode="outlined"
        style={styles.input}
      />

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Room Details</Text>
      <Surface style={styles.detailsCard}>
        <View style={styles.inputGroup}>
          <TextInput
            label="Total Number of Rooms"
            value={pgDetails.totalRooms}
            onChangeText={text => setPgDetails(prev => ({ ...prev, totalRooms: text }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            left={<TextInput.Icon icon="door" />}
          />
          <TextInput
            label="Total Number of Tenants"
            value={pgDetails.totalTenants}
            onChangeText={text => setPgDetails(prev => ({ ...prev, totalTenants: text }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            left={<TextInput.Icon icon="account-group" />}
          />
          <TextInput
            label="Cost per Bed"
            value={pgDetails.costPerBed}
            onChangeText={text => setPgDetails(prev => ({ ...prev, costPerBed: text }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            left={<TextInput.Icon icon="currency-inr" />}
          />
        </View>
      </Surface>

      <Button 
        mode="outlined" 
        onPress={pickPGImages}
        style={styles.uploadButton}
      >
        Upload PG Images ({pgDetails.images.length}/5)
      </Button>

      {pgDetails.images.length > 0 && (
        <ScrollView horizontal style={styles.imagePreviewContainer}>
          {pgDetails.images.map((uri, index) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.imagePreview}
            />
          ))}
        </ScrollView>
      )}

      <TextInput
        label="Description"
        value={pgDetails.description}
        onChangeText={text => setPgDetails(prev => ({ ...prev, description: text }))}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
      />
    </View>
  );

  const renderPaymentSetup = () => (
    <View style={styles.formContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payment Collection Method</Text>
      
      <SegmentedButtons
        value={paymentDetails.paymentMethod}
        onValueChange={value => setPaymentDetails(prev => ({ 
          ...prev, 
          paymentMethod: value as 'upi' | 'bank' 
        }))}
        buttons={[
          { 
            value: 'upi', 
            label: 'UPI', 
            icon: 'qrcode',
            showSelectedCheck: true
          },
          { 
            value: 'bank', 
            label: 'Bank Account',
            icon: 'bank',
            showSelectedCheck: true
          }
        ]}
      />

      {paymentDetails.paymentMethod === 'upi' ? (
        <Surface style={styles.paymentMethodCard}>
          <TextInput
            label="UPI ID"
            value={paymentDetails.upiId}
            onChangeText={text => setPaymentDetails(prev => ({ ...prev, upiId: text }))}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="at" />}
          />
        </Surface>
      ) : (
        <Surface style={styles.paymentMethodCard}>
          <TextInput
            label="Bank Name"
            value={paymentDetails.bankDetails.bankName}
            onChangeText={text => setPaymentDetails(prev => ({
              ...prev,
              bankDetails: { ...prev.bankDetails, bankName: text }
            }))}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="bank" />}
          />
          <TextInput
            label="Account Number"
            value={paymentDetails.bankDetails.accountNumber}
            onChangeText={text => setPaymentDetails(prev => ({
              ...prev,
              bankDetails: { ...prev.bankDetails, accountNumber: text }
            }))}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="numeric" />}
          />
          <TextInput
            label="IFSC Code"
            value={paymentDetails.bankDetails.ifscCode}
            onChangeText={text => setPaymentDetails(prev => ({
              ...prev,
              bankDetails: { ...prev.bankDetails, ifscCode: text }
            }))}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="code-brackets" />}
          />
        </Surface>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Charges & Taxes
        </Text>
        <IconButton
          icon="information"
          size={20}
          onPress={() => setShowInfoModal(true)}
          style={styles.infoButton}
        />
      </View>
      <Surface style={styles.chargesCard}>
        <View style={styles.chargeRow}>
          <View style={styles.chargeInfo}>
            <Text style={styles.chargeTitle}>GST (18%)</Text>
            <Text style={styles.chargeDescription}>
              Include GST in room cost or charge separately?
            </Text>
          </View>
          <Switch
            value={paymentDetails.includeGST}
            onValueChange={value => setPaymentDetails(prev => ({
              ...prev,
              includeGST: value
            }))}
          />
        </View>

        <View style={styles.chargeRow}>
          <View style={styles.chargeInfo}>
            <Text style={styles.chargeTitle}>Service Charge (5%)</Text>
            <Text style={styles.chargeDescription}>
              Include service charge in room cost or charge separately?
            </Text>
          </View>
          <Switch
            value={paymentDetails.includeServiceCharge}
            onValueChange={value => setPaymentDetails(prev => ({
              ...prev,
              includeServiceCharge: value
            }))}
          />
        </View>
      </Surface>
    </View>
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for validation modal
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validate form data
      const errors = [];
      
      // Personal Details validation
      if (!managerDetails.fullName) {
        errors.push({ field: 'fullName', message: 'Full name is required' });
      }
      if (!managerDetails.email) {
        errors.push({ field: 'email', message: 'Email is required' });
      } else if (!validateEmail(managerDetails.email)) {
        errors.push({ field: 'email', message: 'Please enter a valid email address' });
      }
      if (!managerDetails.phone) {
        errors.push({ field: 'phone', message: 'Phone number is required' });
      } else if (!validatePhone(managerDetails.phone)) {
        errors.push({ field: 'phone', message: 'Please enter a valid 10-digit phone number' });
      }
      if (!managerDetails.password) {
        errors.push({ field: 'password', message: 'Password is required' });
      } else if (managerDetails.password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
      }
      if (managerDetails.password !== managerDetails.confirmPassword) {
        errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
      }

      // PG Details validation
      if (!pgDetails.name) {
        errors.push({ field: 'pgName', message: 'PG name is required' });
      }
      if (!pgDetails.address) {
        errors.push({ field: 'pgAddress', message: 'PG address is required' });
      }
      if (!pgDetails.totalRooms) {
        errors.push({ field: 'totalRooms', message: 'Total rooms is required' });
      }
      if (!pgDetails.costPerBed) {
        errors.push({ field: 'costPerBed', message: 'Cost per bed is required' });
      }

      // Payment validation
      if (paymentDetails.paymentMethod === 'upi' && !paymentDetails.upiId) {
        errors.push({ field: 'upiId', message: 'UPI ID is required' });
      }
      if (paymentDetails.paymentMethod === 'bank') {
        if (!paymentDetails.bankDetails.bankName) {
          errors.push({ field: 'bankName', message: 'Bank name is required' });
        }
        if (!paymentDetails.bankDetails.accountNumber) {
          errors.push({ field: 'accountNumber', message: 'Account number is required' });
        }
        if (!paymentDetails.bankDetails.ifscCode) {
          errors.push({ field: 'ifscCode', message: 'IFSC code is required' });
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationModal(true);
        return;
      }

      // Upload profile image if exists
      let profileImageUrl = '';
      if (profileImage) {
        profileImageUrl = await uploadImage(profileImage);
      }

      // Upload PG images if exists
      let pgImageUrls: string[] = [];
      if (pgDetails.images.length > 0) {
        pgImageUrls = await Promise.all(
          pgDetails.images.map(image => uploadImage(image))
        );
      }

      // Prepare form data with all fields
      const formData = {
        // Personal Details
        fullName: managerDetails.fullName,
        email: managerDetails.email,
        phone: managerDetails.phone,
        password: managerDetails.password,
        profileImage: profileImageUrl,
        address: managerDetails.address,
        alternatePhone: managerDetails.alternatePhone,

        // PG Details
        pgName: pgDetails.name,
        pgAddress: pgDetails.address,
        city: pgDetails.city,
        state: pgDetails.state,
        pincode: pgDetails.pincode,
        pgType: pgDetails.type,
        pgContactNumber: pgDetails.contactNumber,
        totalRooms: parseInt(pgDetails.totalRooms),
        costPerBed: parseInt(pgDetails.costPerBed),
        totalTenants: parseInt(pgDetails.totalTenants),
        amenities: pgDetails.amenities,
        otherAmenities: pgDetails.otherAmenities,
        pgImages: pgImageUrls,
        description: pgDetails.description,
        seasonalPrice: pgDetails.seasonalPrice || null,
        rating: null,
        occupancyRate: null,

        // Payment Details
        paymentMethod: paymentDetails.paymentMethod,
        upiId: paymentDetails.paymentMethod === 'upi' ? paymentDetails.upiId : null,
        bankDetails: paymentDetails.paymentMethod === 'bank' ? {
          bankName: paymentDetails.bankDetails.bankName,
          accountNumber: paymentDetails.bankDetails.accountNumber,
          ifscCode: paymentDetails.bankDetails.ifscCode
        } : null,

        // Extra Charges
        extraCharges: {
          food: {
            available: paymentDetails.extraCharges.food,
            price: parseInt(paymentDetails.extraCharges.foodPrice) || 0
          },
          laundry: {
            available: paymentDetails.extraCharges.laundry,
            price: parseInt(paymentDetails.extraCharges.laundryPrice) || 0
          },
          electricity: {
            available: paymentDetails.extraCharges.electricity,
            price: parseInt(paymentDetails.extraCharges.electricityPrice) || 0
          }
        },

        // Tax Settings
        taxSettings: {
          includeGST: paymentDetails.includeGST,
          includeServiceCharge: paymentDetails.includeServiceCharge
        },

        // Status and Verification
        status: 'pending',
        emailVerified: false,
        phoneVerified: false,
        documentsVerified: false,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Validate form data
      if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
        throw new Error('Please fill in all personal details');
      }

      if (!formData.pgName || !formData.pgAddress || !formData.totalRooms || !formData.costPerBed) {
        throw new Error('Please fill in all PG details');
      }

      if (formData.paymentMethod === 'upi' && !formData.upiId) {
        throw new Error('Please enter UPI ID');
      }

      if (formData.paymentMethod === 'bank' && 
          (!formData.bankDetails?.bankName || 
           !formData.bankDetails?.accountNumber || 
           !formData.bankDetails?.ifscCode)) {
        throw new Error('Please fill in all bank details');
      }

      // Submit form data
      const response = await registerManager(formData);

      showMessage({
        message: 'Registration Successful',
        description: 'Your account has been created successfully. Please wait for verification.',
        type: 'success',
      });

      // Navigate to login
      router.replace('/screens/LoginScreen');

    } catch (error: any) {
      setValidationErrors([{
        field: 'api',
        message: error.response?.data?.error || 'Registration failed'
      }]);
      setShowValidationModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSummary = () => (
    <View style={styles.formContainer}>
      {/* Personal Details Card */}
      <Surface style={styles.summarySection}>
        <Text style={[styles.summaryTitle, { color: theme.colors.primary }]}>
          Personal Details
        </Text>
        <View style={styles.summaryHeader}>
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: theme.colors.primaryContainer }]}>
              <FontAwesome name="user-o" size={40} color={theme.colors.primary} />
            </View>
          )}
          <View style={styles.summaryHeaderText}>
            <Text style={styles.summaryName}>{managerDetails.fullName}</Text>
            <Text style={styles.summarySubtext}>{managerDetails.email}</Text>
            <Text style={styles.summarySubtext}>{managerDetails.phone}</Text>
          </View>
        </View>
      </Surface>

      {/* PG Details Card */}
      <Surface style={styles.summarySection}>
        <Text style={[styles.summaryTitle, { color: theme.colors.primary }]}>
          PG Details
        </Text>
        <View style={styles.summaryRow}>
          <IconButton icon="home" size={24} />
          <View>
            <Text style={styles.summaryLabel}>{pgDetails.name}</Text>
            <Text style={styles.summaryValue}>{pgDetails.type} PG</Text>
            <Text style={styles.summaryValue}>{pgDetails.totalRooms} Rooms</Text>
            <Text style={styles.summaryValue}>₹{pgDetails.costPerBed} per bed</Text>
          </View>
        </View>
      </Surface>

      {/* Payment Details Card */}
      <Surface style={styles.summarySection}>
        <Text style={[styles.summaryTitle, { color: theme.colors.primary }]}>
          Payment Details
        </Text>
        {paymentDetails.paymentMethod === 'upi' ? (
          <View style={styles.summaryRow}>
            <IconButton icon="qrcode" size={24} />
            <View>
              <Text style={styles.summaryLabel}>UPI Payment</Text>
              <Text style={styles.summaryValue}>{paymentDetails.upiId}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <IconButton icon="bank" size={24} />
            <View>
              <Text style={styles.summaryLabel}>Bank Account</Text>
              <Text style={styles.summaryValue}>{paymentDetails.bankDetails.bankName}</Text>
              <Text style={styles.summaryValue}>{paymentDetails.bankDetails.accountNumber}</Text>
              <Text style={styles.summaryValue}>{paymentDetails.bankDetails.ifscCode}</Text>
            </View>
          </View>
        )}

        <View style={styles.chargeInfo}>
          <Text style={styles.chargeNote}>
            GST (18%) will be {paymentDetails.includeGST ? 'included in' : 'charged on top of'} room cost
          </Text>
          <Text style={styles.chargeNote}>
            Service charge (5%) will be {paymentDetails.includeServiceCharge ? 'included in' : 'charged on top of'} room cost
          </Text>
        </View>
      </Surface>

      <View style={styles.termsContainer}>
        <Checkbox.Item
          label="I confirm all the details are correct"
          status={termsAccepted ? 'checked' : 'unchecked'}
          onPress={() => setTermsAccepted(!termsAccepted)}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!termsAccepted || isLoading}
        style={styles.submitButton}
      >
        Complete Registration
      </Button>
    </View>
  );

  return (
    <>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        {renderStepIndicator()}
        {currentStep === 0 && renderPersonalDetails()}
        {currentStep === 1 && renderPGDetails()}
        {currentStep === 2 && renderPaymentSetup()}
        {currentStep === 3 && renderSummary()}
        
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <Button 
              mode="outlined"
              onPress={() => setCurrentStep(prev => prev - 1)}
              style={styles.button}
            >
              Back
            </Button>
          )}
          <Button 
            mode="contained"
            onPress={handleNext}
            style={[styles.button, styles.nextButton]}
          >
            {currentStep === STEPS.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </View>

        <PaymentInfoModal 
          visible={showInfoModal}
          onDismiss={() => setShowInfoModal(false)}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Creating your account...</Text>
          </View>
        )}

        <ValidationModal
          visible={showValidationModal}
          onDismiss={() => setShowValidationModal(false)}
          errors={validationErrors}
          title="Registration Failed"
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    position: 'relative',
    paddingBottom: 20,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  progress: {
    height: 4,
    borderRadius: 2,
  },
  formContainer: {
    gap: 16,
  },
  imageUpload: {
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    marginTop: 8,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  button: {
    minWidth: 100,
  },
  nextButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  amenityLabel: {
    marginLeft: 8,
  },
  roomTypeAccordion: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  roomTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  roomTypeDetails: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  termsContainer: {
    marginTop: 16,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  extraCharges: {
    gap: 8,
    marginBottom: 16,
  },
  roomDetailsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 8,
  },
  paymentMethodCard: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
    marginTop: 16,
  },
  chargesCard: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chargeInfo: {
    flex: 1,
    marginRight: 16,
  },
  chargeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chargeDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Removed duplicate roomDetailsCard style
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  exampleCard: {
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exampleSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: '#666',
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  profileSection: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
  },
  infoSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    margin: 0,
    padding: 0,
  },
  otpContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  otpText: {
    fontSize: 14,
    marginBottom: 12,
  },
  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: 45,
    height: 45,
    textAlign: 'center',
  },
  verifyButton: {
    marginTop: 8,
  },
  summarySection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#666',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chargeNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
 
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoButton: {
    margin: 0,
    padding: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 4,
  },
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorList: {
    width: '100%',
    marginBottom: 24,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 16,
  },
  modalButton: {
    width: '100%',
    marginTop: 8,
  },
  validationModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  validationErrorText: {
    flex: 1,
    fontSize: 16,
  },
});