import React, { useState, useEffect, useRef } from 'react';
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
import { registerManager } from '../services/manager.service';
import { uploadImage } from '../services/upload.service';
import { showMessage } from 'react-native-flash-message';
import { router } from 'expo-router';
import { getAmenities, Amenity } from '../services/amenity.service';
import ValidationModal from '../components/ValidationModal';
import { studentRegistrationService } from '@/app/services/student.registration.service';

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
const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);

// Add validation types
interface ValidationError {
  field: string;
  message: string;
}

// Add these validation functions at the top of the file, before the component
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Add password validation function
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumbers) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  return { isValid: true, message: '' };
};

// Add this component for modern field validation
const ValidationInput = ({ 
  label, 
  value, 
  onChangeText, 
  error, 
  icon,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  style = {},
  right,
}: { 
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
  right?: React.ReactNode;
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Map common icons to Material Community Icons
  const getIconName = (iconName: string): string => {
    const iconMap: { [key: string]: string } = {
      'account': 'account',
      'email': 'email',
      'phone': 'phone',
      'lock': 'lock',
      'home': 'home',
      'map-marker': 'map-marker',
      'city': 'city',
      'state': 'map',
      'postal-code': 'pound',
      'currency': 'currency-inr',
      'description': 'text',
      'bank': 'bank',
      'at': 'at',
    };
    return iconMap[iconName] || iconName;
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        error={!!error}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input, 
          style,
          error && styles.inputError
        ]}
        left={icon ? <TextInput.Icon icon={getIconName(icon)} /> : undefined}
        right={right}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        outlineStyle={{
          borderColor: error 
            ? theme.colors.error 
            : isFocused 
              ? theme.colors.primary 
              : theme.colors.outline,
        }}
      />
      {error && (
        <View style={styles.fieldErrorContainer}>
          <IconButton
            icon="alert-circle"
            size={16}
            iconColor={theme.colors.error}
          />
          <Text style={[styles.fieldErrorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

// Add this component near other component definitions
const SuccessModal = ({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) => {
  const { theme, isDarkMode } = useTheme();
  
  if (!visible) return null;

  return (
    <View style={styles.successModalContainer}>
      <Surface 
        style={[
          styles.successModalContent,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            borderColor: theme.colors.primary,
            borderWidth: 1,
          }
        ]}
      >
        <View style={[styles.successModalIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
          <IconButton
            icon="check-circle"
            size={32}
            iconColor={theme.colors.primary}
          />
        </View>
        <Text style={[styles.successModalTitle, { color: theme.colors.primary }]}>
          Registration Successful!
        </Text>
        <Text style={[styles.successModalMessage, { color: theme.colors.text }]}>
          Your PG manager account has been created. Please login to continue.
        </Text>
        <Button 
          mode="contained" 
          onPress={onDismiss}
          style={styles.successModalButton}
          buttonColor={theme.colors.primary}
        >
          Login as Manager
        </Button>
      </Surface>
    </View>
  );
};

// Add this modal component
const DuplicateManagerModal = ({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) => {
  const { theme, isDarkMode } = useTheme();
  
  if (!visible) return null;

  return (
    <View style={styles.duplicateModalContainer}>
      <Surface 
        style={[
          styles.duplicateModalContent,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            borderColor: theme.colors.error,
          }
        ]}
      >
        <View style={styles.duplicateModalIcon}>
          <IconButton
            icon="account-alert"
            size={32}
            iconColor={theme.colors.error}
          />
        </View>
        <Text style={[styles.duplicateModalTitle, { color: theme.colors.error }]}>
          Account Already Exists
        </Text>
        <Text style={[styles.duplicateModalMessage, { color: theme.colors.text }]}>
          An account with this email or phone number is already registered.
        </Text>
        <Button 
          mode="contained" 
          onPress={onDismiss}
          style={styles.duplicateModalButton}
          buttonColor={theme.colors.error}
        >
          OK
        </Button>
      </Surface>
    </View>
  );
};

// Add this component before the main ManagerRegistration component
const PasswordRequirements = () => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.passwordRequirements}>
      <Text style={[styles.requirementTitle, { color: theme.colors.text }]}>
        Password must contain:
      </Text>
      <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
        • At least 8 characters
      </Text>
      <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
        • At least one uppercase letter
      </Text>
      <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
        • At least one lowercase letter
      </Text>
      <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
        • At least one number
      </Text>
      <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
        • At least one special character
      </Text>
    </View>
  );
};

// First, add this new component at the top level of the file, after the imports
const ValidationPopup = ({ 
  errors,
  onDismiss
}: { 
  errors: ValidationError[];
  onDismiss: () => void;
}) => {
  const { theme } = useTheme();

  if (errors.length === 0) return null;

  return (
    <View style={styles.errorContainer}>
      <Surface style={[
        styles.errorContent,
        {
          backgroundColor: theme.colors.errorContainer,
          borderLeftColor: theme.colors.error,
        }
      ]}>
        <IconButton
          icon="alert-circle"
          iconColor={theme.colors.error}
          size={24}
        />
        <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
          {errors[0].message}
        </Text>
        <IconButton
          icon="close"
          iconColor={theme.colors.error}
          size={20}
          onPress={onDismiss}
        />
      </Surface>
    </View>
  );
};

// Add this helper function at the top level
const validateNumberInput = (value: string): string => {
  // Remove any non-digit characters and leading zeros
  return value.replace(/[^0-9]/g, '').replace(/^0+/, '') || '';
};

export default function ManagerRegistration() {
  const { theme, isDarkMode } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const otpInputRefs = useRef<Array<TextInput | null>>(new Array(6).fill(null));
  
  const [currentStep, setCurrentStep] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  const [showDuplicateManagerModal, setShowDuplicateManagerModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [amenitiesError, setAmenitiesError] = useState<string | null>(null);

  const [managerDetails, setManagerDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    alternatePhone: '',
  });

  const handleSendOTP = async () => {
    if (!validatePhone(managerDetails.phone)) {
      setValidationErrors(prev => [
        ...prev.filter(e => e.field !== 'phone'),
        { field: 'phone', message: 'Please enter a valid 10-digit number before sending OTP' }
      ]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await studentRegistrationService.sendOTP(managerDetails.phone);
      if (response.success) {
        setShowOTP(true);
        setOtpValues(['', '', '', '', '', '']);
        setOtpError('');
        showMessage({
          message: 'OTP Sent',
          description: 'Please check your phone for the OTP',
          type: 'success',
          duration: 3000,
          floating: true,
        });
      }
    } catch (error: any) {
      showMessage({
        message: 'Failed to send OTP',
        description: error.message || 'Please try again',
        type: 'danger',
        duration: 3000,
        floating: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otpValues.join('');
    if (otpString.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      setOtpError('');
      
      const response = await studentRegistrationService.verifyOTP(managerDetails.phone, otpString);
      
      if (response.success) {
        setOtpVerified(true);
        setShowOTP(false);
        setOtpValues(['', '', '', '', '', '']);
        showMessage({
          message: 'Success',
          description: 'Phone number verified successfully',
          type: 'success',
          duration: 3000,
          floating: true,
        });
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setOtpError(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Move validateField and handleFieldChange back inside the component
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        return !value.trim() ? 'Full name is required' : '';
      case 'email':
        return !value.trim() 
          ? 'Email is required' 
          : !validateEmail(value) 
            ? 'Please enter a valid email' 
            : '';
      case 'phone':
        return !value.trim() 
          ? 'Phone number is required' 
          : !validatePhone(value) 
            ? 'Please enter a valid 10-digit number' 
            : '';
      case 'password':
        const passwordValidation = validatePassword(value);
        return !passwordValidation.isValid ? passwordValidation.message : '';
      case 'confirmPassword':
        return value !== managerDetails.password 
          ? 'Passwords do not match' 
          : '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    const error = validateField(field, value);
    
    setManagerDetails(prev => ({
      ...prev,
      [field]: value
    }));

    setValidationErrors(prev => {
      const filtered = prev.filter(e => e.field !== field);
      if (error) {
        filtered.push({ field, message: error });
      }
      return filtered;
    });
  };

  // Add handleNext function
  const handleNext = () => {
    let isValid = false;
    switch (currentStep) {
      case 0:
        isValid = validatePersonalDetails();
        break;
      case 1:
        isValid = validatePGDetails();
        break;
      case 2:
        isValid = validatePaymentDetails();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        // Reset scroll position when moving to next step
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
        return nextStep;
      });
    } else {
      // Show error message
      showMessage({
        message: 'Validation Error',
        description: 'Please fill in all required fields correctly',
        type: 'danger',
        duration: 3000,
        floating: true,
      });
    }
  };

  // Add validation helper functions
  const validatePersonalDetails = (): boolean => {
    const errors: ValidationError[] = [];
    
    // Check required fields
    if (!managerDetails.fullName) {
      errors.push({ field: 'fullName', message: 'Full name is required' });
    }
    
    if (!managerDetails.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!validateEmail(managerDetails.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email' });
    }
    
    if (!managerDetails.phone) {
      errors.push({ field: 'phone', message: 'Phone number is required' });
    } else if (!validatePhone(managerDetails.phone)) {
      errors.push({ field: 'phone', message: 'Please enter a valid 10-digit number' });
    }

    // Check OTP verification
    if (!otpVerified) {
      errors.push({ field: 'phone', message: 'Please verify your phone number with OTP before proceeding' });
      showMessage({
        message: 'Phone Verification Required',
        description: 'Please verify your phone number with OTP before proceeding',
        type: 'warning',
        duration: 3000,
        floating: true,
      });
    }
    
    if (!managerDetails.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else {
      const passwordValidation = validatePassword(managerDetails.password);
      if (!passwordValidation.isValid) {
        errors.push({ field: 'password', message: passwordValidation.message });
      }
    }
    
    if (!managerDetails.confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
    } else if (managerDetails.password !== managerDetails.confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validatePGDetails = () => {
    const errors: Array<{ field: string; message: string }> = [];

    if (!pgDetails.name.trim()) {
      errors.push({ field: 'pgName', message: 'PG name is required' });
    }

    if (!pgDetails.address.trim()) {
      errors.push({ field: 'pgAddress', message: 'PG address is required' });
    } else if (pgDetails.address.length > 250) {
      errors.push({ field: 'pgAddress', message: 'Address cannot exceed 250 characters' });
    }

    if (!pgDetails.city.trim()) {
      errors.push({ field: 'city', message: 'City is required' });
    }

    if (!pgDetails.state.trim()) {
      errors.push({ field: 'state', message: 'State is required' });
    }

    if (!pgDetails.pincode.trim()) {
      errors.push({ field: 'pincode', message: 'Pincode is required' });
    } else if (!/^\d{6}$/.test(pgDetails.pincode)) {
      errors.push({ field: 'pincode', message: 'Please enter a valid 6-digit pincode' });
    }

    if (!pgDetails.description.trim()) {
      errors.push({ field: 'description', message: 'Description is required' });
    } else if (pgDetails.description.length > 250) {
      errors.push({ field: 'description', message: 'Description cannot exceed 250 characters' });
    }

    if (!pgDetails.totalRooms) {
      errors.push({ field: 'totalRooms', message: 'Total rooms is required' });
    } else if (!/^\d+$/.test(pgDetails.totalRooms)) {
      errors.push({ field: 'totalRooms', message: 'Total rooms must be a number' });
    } else if (parseInt(pgDetails.totalRooms) < 1) {
      errors.push({ field: 'totalRooms', message: 'Total rooms must be at least 1' });
    }

    if (!pgDetails.totalTenants) {
      errors.push({ field: 'totalTenants', message: 'Total tenants is required' });
    } else if (!/^\d+$/.test(pgDetails.totalTenants)) {
      errors.push({ field: 'totalTenants', message: 'Total tenants must be a number' });
    } else if (parseInt(pgDetails.totalTenants) < 1) {
      errors.push({ field: 'totalTenants', message: 'Total tenants must be at least 1' });
    }

    if (!pgDetails.costPerBed) {
      errors.push({ field: 'costPerBed', message: 'Cost per bed is required' });
    } else if (!/^\d+$/.test(pgDetails.costPerBed)) {
      errors.push({ field: 'costPerBed', message: 'Cost per bed must be a number' });
    } else if (parseInt(pgDetails.costPerBed) < 1) {
      errors.push({ field: 'costPerBed', message: 'Cost per bed must be at least 1' });
    }

    if (!pgDetails.contactNumber.trim()) {
      errors.push({ field: 'pgContactNumber', message: 'Contact number is required' });
    } else if (!/^\d{10}$/.test(pgDetails.contactNumber)) {
      errors.push({ field: 'pgContactNumber', message: 'Please enter a valid 10-digit number' });
    }

    if (pgDetails.otherAmenities && pgDetails.otherAmenities.length > 250) {
      errors.push({ field: 'otherAmenities', message: 'Other amenities cannot exceed 250 characters' });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validatePaymentDetails = () => {
    const errors: Array<{ field: string; message: string }> = [];

    if (paymentDetails.paymentMethod === 'upi') {
      if (!paymentDetails.upiId.trim()) {
        errors.push({ field: 'upiId', message: 'UPI ID is required' });
      } else if (!/^[\w.-]+@[\w.-]+$/.test(paymentDetails.upiId)) {
        errors.push({ field: 'upiId', message: 'Please enter a valid UPI ID' });
      }
    } else {
      if (!paymentDetails.bankDetails.bankName.trim()) {
        errors.push({ field: 'bankName', message: 'Bank name is required' });
      }
      if (!paymentDetails.bankDetails.accountNumber.trim()) {
        errors.push({ field: 'accountNumber', message: 'Account number is required' });
      }
      if (!paymentDetails.bankDetails.ifscCode.trim()) {
        errors.push({ field: 'ifscCode', message: 'IFSC code is required' });
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(paymentDetails.bankDetails.ifscCode)) {
        errors.push({ field: 'ifscCode', message: 'Please enter a valid IFSC code' });
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Form states for Step 1
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
    }
  });

  // Add useEffect to fetch amenities
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        setAmenitiesError(null);
        const amenitiesList = await getAmenities();
        setAvailableAmenities(amenitiesList);
      } catch (error) {
        console.error('Error fetching amenities:', error);
        setAmenitiesError('Unable to load amenities. Please try again later.');
        showMessage({
          message: 'Error loading amenities',
          type: 'danger',
        });
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
      <ValidationInput
        label="Full Name"
        value={managerDetails.fullName}
        onChangeText={(text) => handleFieldChange('fullName', text)}
        error={validationErrors.find(error => error.field === 'fullName')?.message}
        icon="account"
        style={styles.input}
      />
        </View>

        <View style={styles.inputRow}>
      <ValidationInput
        label="Email"
        value={managerDetails.email}
        onChangeText={text => handleFieldChange('email', text)}
        error={validationErrors.find(error => error.field === 'email')?.message}
        icon="email"
        keyboardType="email-address"
            style={[styles.input, { flex: 1 }]}
      />
        </View>

        <View style={styles.inputRow}>
          <ValidationInput
            label="Phone Number"
            value={managerDetails.phone}
            onChangeText={text => {
              // Only allow numbers and limit to 10 digits
              const numericValue = text.replace(/[^0-9]/g, '').slice(0, 10);
              handleFieldChange('phone', numericValue);
            }}
            error={validationErrors.find(error => error.field === 'phone')?.message}
            icon="phone"
            keyboardType="phone-pad"
            style={[styles.input, { flex: 1 }]}
            right={
              <TextInput.Icon 
                icon={otpVerified ? "check-circle" : "send"}
                color={otpVerified ? theme.colors.primary : undefined}
                onPress={() => {
                  if (!otpVerified && !isLoading) {
                    handleSendOTP();
                  }
                }}
                disabled={!managerDetails.phone || managerDetails.phone.length !== 10 || isLoading || otpVerified}
              />
            }
          />
        </View>

        {showOTP && (
          <Surface style={[styles.otpContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.otpText, { color: theme.colors.text }]}>
              Enter OTP sent to your phone
            </Text>
            <View style={styles.otpInputRow}>
              {otpValues.map((value, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    if (ref) {
                      otpInputRefs.current[index] = ref;
                    }
                  }}
                  style={[styles.otpInput, { backgroundColor: theme.colors.background }]}
                  maxLength={1}
                  keyboardType="numeric"
                  mode="outlined"
                  value={value}
                  onChangeText={(text) => {
                    if (/^\d*$/.test(text)) {
                      const newOtpValues = [...otpValues];
                      newOtpValues[index] = text;
                      setOtpValues(newOtpValues);
                      
                      // Auto-focus next input
                      if (text && index < 5) {
                        otpInputRefs.current[index + 1]?.focus();
                      }
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      const newOtpValues = [...otpValues];
                      newOtpValues[index] = '';
                      setOtpValues(newOtpValues);
                      
                      // Focus previous input
                      if (index > 0) {
                        otpInputRefs.current[index - 1]?.focus();
                      }
                    }
                  }}
                />
              ))}
            </View>
            {otpError && (
              <HelperText type="error" visible={true}>
                {otpError}
              </HelperText>
            )}
            <Button 
              mode="contained" 
              onPress={handleVerifyOTP}
              loading={isLoading}
              disabled={otpValues.join('').length !== 6 || isLoading}
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
      <ValidationInput
        label="Password *"
        value={managerDetails.password}
        onChangeText={(text) => handleFieldChange('password', text)}
        error={validationErrors.find(error => error.field === 'password')?.message}
        icon="eye"
        secureTextEntry
        multiline
        numberOfLines={1}
        style={styles.input}
      />
      <PasswordRequirements />

      <ValidationInput
        label="Confirm Password *"
        value={managerDetails.confirmPassword}
        onChangeText={(text) => handleFieldChange('confirmPassword', text)}
        error={validationErrors.find(error => error.field === 'confirmPassword')?.message}
        icon="eye"
        secureTextEntry
        multiline
        numberOfLines={1}
        style={styles.input}
      />
        </View>
      </Surface>

      {/* Address Section */}
      <Surface style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Address</Text>

      <ValidationInput
          label="Current Address"
        value={managerDetails.address}
        onChangeText={text => handleFieldChange('address', text)}
        error={validationErrors.find(error => error.field === 'address')?.message}
        icon="map-marker"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      </Surface>
    </View>
  );

  const renderPGDetails = () => (
    <View style={styles.formContainer}>
      <ValidationInput
        label="PG Name"
        value={pgDetails.name}
        onChangeText={text => setPgDetails(prev => ({ ...prev, name: text }))}
        error={validationErrors.find(error => error.field === 'pgName')?.message}
        icon="home"
        style={styles.input}
      />

      <ValidationInput
        label="PG Address"
        value={pgDetails.address}
        onChangeText={text => {
          if (text.length <= 250) {
            setPgDetails(prev => ({ ...prev, address: text }))
          }
        }}
        error={validationErrors.find(error => error.field === 'pgAddress')?.message}
        icon="map-marker"
        multiline
        numberOfLines={3}
        style={styles.input}
        helperText={`${pgDetails.address.length}/250 characters`}
      />

      <ValidationInput
        label="Contact Number"
        value={pgDetails.contactNumber}
        onChangeText={text => setPgDetails(prev => ({ ...prev, contactNumber: text }))}
        error={validationErrors.find(error => error.field === 'pgContactNumber')?.message}
        icon="phone"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <View style={styles.inputRow}>
        <ValidationInput
          label="City"
          value={pgDetails.city}
          onChangeText={text => setPgDetails(prev => ({ ...prev, city: text }))}
          error={validationErrors.find(error => error.field === 'city')?.message}
          icon="city"
          style={[styles.input, { flex: 1 }]}
        />
        <ValidationInput
          label="State"
          value={pgDetails.state}
          onChangeText={text => setPgDetails(prev => ({ ...prev, state: text }))}
          error={validationErrors.find(error => error.field === 'state')?.message}
          icon="state"
          style={[styles.input, { flex: 1 }]}
        />
      </View>

      <ValidationInput
        label="Pincode"
        value={pgDetails.pincode}
        onChangeText={text => setPgDetails(prev => ({ ...prev, pincode: text }))}
        error={validationErrors.find(error => error.field === 'pincode')?.message}
        icon="postal-code"
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

      <ValidationInput
        label="Other Amenities"
        value={pgDetails.otherAmenities}
        onChangeText={text => {
          if (text.length <= 250) {
            setPgDetails(prev => ({ ...prev, otherAmenities: text }))
          }
        }}
        error={validationErrors.find(error => error.field === 'otherAmenities')?.message}
        icon="plus-circle"
        style={styles.input}
        helperText={`${pgDetails.otherAmenities.length}/250 characters`}
      />

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Room Details</Text>
      <Surface style={styles.detailsCard}>
        <View style={styles.inputGroup}>
          <ValidationInput
            label="Total Number of Rooms"
            value={pgDetails.totalRooms}
            onChangeText={text => {
              const numericValue = validateNumberInput(text);
              setPgDetails(prev => ({ ...prev, totalRooms: numericValue }));
            }}
            error={validationErrors.find(error => error.field === 'totalRooms')?.message}
            icon="door"
            keyboardType="numeric"
            style={styles.input}
          />
          <ValidationInput
            label="Number of Tenants per Room"
            value={pgDetails.totalTenants}
            onChangeText={text => {
              const numericValue = validateNumberInput(text);
              setPgDetails(prev => ({ ...prev, totalTenants: numericValue }));
            }}
            error={validationErrors.find(error => error.field === 'totalTenants')?.message}
            icon="account-group"
            keyboardType="numeric"
            style={styles.input}
          />
          <ValidationInput
            label="Cost per Bed"
            value={pgDetails.costPerBed}
            onChangeText={text => {
              const numericValue = validateNumberInput(text);
              setPgDetails(prev => ({ ...prev, costPerBed: numericValue }));
            }}
            error={validationErrors.find(error => error.field === 'costPerBed')?.message}
            icon="currency-inr"
            keyboardType="numeric"
            style={styles.input}
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

      <ValidationInput
        label="Description"
        value={pgDetails.description}
        onChangeText={text => {
          if (text.length <= 250) {
            setPgDetails(prev => ({ ...prev, description: text }))
          }
        }}
        error={validationErrors.find(error => error.field === 'description')?.message}
        icon="text"
        multiline
        numberOfLines={4}
        style={styles.input}
        helperText={`${pgDetails.description.length}/250 characters`}
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
          <ValidationInput
            label="UPI ID"
            value={paymentDetails.upiId}
            onChangeText={text => setPaymentDetails(prev => ({ ...prev, upiId: text }))}
            error={validationErrors.find(error => error.field === 'upiId')?.message}
            icon="at"
            style={styles.input}
          />
        </Surface>
      ) : (
        <Surface style={styles.paymentMethodCard}>
          <ValidationInput
            label="Bank Name"
            value={paymentDetails.bankDetails.bankName}
            onChangeText={text => setPaymentDetails(prev => ({
              ...prev,
              bankDetails: { ...prev.bankDetails, bankName: text }
            }))}
            error={validationErrors.find(error => error.field === 'bankName')?.message}
            icon="bank"
            style={styles.input}
          />
          <ValidationInput
            label="Account Number"
            value={paymentDetails.bankDetails.accountNumber}
            onChangeText={text => setPaymentDetails(prev => ({
              ...prev,
              bankDetails: { ...prev.bankDetails, accountNumber: text }
            }))}
            error={validationErrors.find(error => error.field === 'accountNumber')?.message}
            icon="numeric"
            style={styles.input}
          />
          <ValidationInput
            label="IFSC Code"
            value={paymentDetails.bankDetails.ifscCode}
            onChangeText={text => setPaymentDetails(prev => ({
              ...prev,
              bankDetails: { ...prev.bankDetails, ifscCode: text }
            }))}
            error={validationErrors.find(error => error.field === 'ifscCode')?.message}
            icon="code-brackets"
            style={styles.input}
          />
        </Surface>
      )}
    </View>
  );

  const handleSubmit = async () => {
    try {
      // Validate current step before submission
      if (currentStep === 1 && !validatePGDetails()) {
        return;
      }

      setIsLoading(true);

      try {
        // Upload profile image first if exists
        let profileImageUrl = null;
        if (profileImage) {
          profileImageUrl = await uploadImage(profileImage);
        }

        // Upload PG images if any
        let pgImageUrls = [];
        if (pgDetails.images.length > 0) {
          pgImageUrls = await Promise.all(pgDetails.images.map(image => uploadImage(image)));
        }

        // Create the form data object with correct field mappings
        const formData = {
          // Personal Details
          fullName: managerDetails.fullName,
          email: managerDetails.email,
          phone: managerDetails.phone,
          password: managerDetails.password,
          profileImage: profileImageUrl,
          address: managerDetails.address,
          alternatePhone: managerDetails.alternatePhone || null,

          // PG Details
          pgName: pgDetails.name,
          pgAddress: pgDetails.address,
          city: pgDetails.city,
          state: pgDetails.state,
          pincode: pgDetails.pincode,
          pgType: pgDetails.type,
          pgContactNumber: pgDetails.contactNumber,
          totalRooms: parseInt(pgDetails.totalRooms) || 0,
          costPerBed: parseInt(pgDetails.costPerBed) || 0,
          totalTenants: parseInt(pgDetails.totalTenants) || 0,
          amenities: pgDetails.amenities.map(id => id.toString()),
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
          }
        };

        const response = await registerManager(formData);

        if (response.success) {
          setIsLoading(false);
          setShowSuccessModal(true);
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        showMessage({
          message: 'Image Upload Failed',
          description: 'Failed to upload one or more images. Please try again.',
          type: 'danger',
          duration: 4000,
          floating: true,
        });
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setIsLoading(false);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = error.response.data.errors;
        setValidationErrors(backendErrors);
        
        // Navigate to the appropriate step based on the error
        if (backendErrors.some(e => e.field === 'description' || e.field === 'pgName')) {
          setCurrentStep(1); // Go to PG Details step
        }
      } else if (error.error === "Manager with this email or phone already exists" || 
          error.response?.data?.error === "Manager with this email or phone already exists") {
        setShowDuplicateManagerModal(true);
      } else {
        showMessage({
          message: 'Registration Failed',
          description: error.response?.data?.error || 'Registration failed',
          type: 'danger',
          duration: 4000,
          floating: true,
        });
      }
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
    <View style={styles.rootContainer}>
      <View style={styles.stickyHeader}>
        <ValidationPopup 
          errors={validationErrors} 
          onDismiss={() => setValidationErrors([])} 
        />
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.stepIndicatorContainer, { backgroundColor: theme.colors.background }]}>
          {renderStepIndicator()}
        </View>

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
          {currentStep < STEPS.length - 1 && (
            <Button 
              mode="contained"
              onPress={handleNext}
              style={[styles.button, styles.nextButton]}
            >
              Next
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Keep all modals outside ScrollView */}
      <PaymentInfoModal 
        visible={showInfoModal}
        onDismiss={() => setShowInfoModal(false)}
      />

      <SuccessModal 
        visible={showSuccessModal} 
        onDismiss={() => {
          setShowSuccessModal(false);
          router.replace('/screens/LoginScreen');
        }} 
      />

      <DuplicateManagerModal 
        visible={showDuplicateManagerModal}
        onDismiss={() => setShowDuplicateManagerModal(false)}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Creating your account...</Text>
        </View>
      )}

      {/* Add error message for amenities in PG Details section */}
      {currentStep === 1 && amenitiesError && (
        <HelperText type="error" visible={true}>
          {amenitiesError}
        </HelperText>
      )}
    </View>
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
    padding: 16,
    gap: 16,
    width: '100%',
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
    marginBottom: 4,
    minWidth: 150,
    flex: 1,
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
    width: '100%',
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    width: '100%',
    flexWrap: 'wrap',
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
    fontSize: 12,
    color: 'red',
  },
  validationErrorText: {
    fontSize: 14,
    color: 'red',
    marginLeft: 8,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalActions: {
    width: '100%',
  },
  modalButton: {
    borderRadius: 8,
  },
  modalButtonContent: {
    paddingVertical: 8,
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  errorMessage: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
  },
  errorIcon: {
    margin: 0,
    padding: 0,
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
    flexWrap: 'wrap',
  },
  inputError: {
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 8,
    padding: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    flex: 1,
    marginLeft: 4,
  },
  validationErrorText: {
    fontSize: 14,
    color: 'red',
    marginLeft: 8,
  },
  duplicateModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 1000,
  },
  duplicateModalContent: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  duplicateModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  duplicateModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  duplicateModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  duplicateModalButton: {
    minWidth: 120,
  },
  successModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  successModalContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  successModalButton: {
    minWidth: 200,
    borderRadius: 8,
  },
  rootContainer: {
    flex: 1,
    position: 'relative',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  stepIndicatorContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  errorContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  errorMessage: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    lineHeight: 20,
  },
});