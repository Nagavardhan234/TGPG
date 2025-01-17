import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  Button, 
  TextInput, 
  Card, 
  IconButton, 
  Divider,
  Portal,
  Dialog,
  HelperText
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { studentProfileService, StudentProfile } from '@/app/services/student.profile.service';
import { router } from 'expo-router';

interface ProfileStats {
  daysStayed: number;
  paymentsCompleted: number;
  eventsParticipated: number;
  complaintsResolved: number;
}

interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

// Dummy data
const profileStats: ProfileStats = {
  daysStayed: 120,
  paymentsCompleted: 4,
  eventsParticipated: 8,
  complaintsResolved: 3,
};

const emergencyContact: EmergencyContact = {
  name: "John Smith",
  relation: "Parent",
  phone: "+91 9876543210",
};

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { student, logout } = useStudentAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileData, setProfileData] = useState<StudentProfile>({
    fullName: '',
    email: '',
    phone: '',
    roomNumber: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await studentProfileService.getProfile();
      if (response.success) {
        setProfileData({
          fullName: response.data.FullName,
          email: response.data.Email,
          phone: response.data.Phone,
          roomNumber: response.data.Room_No,
          emergencyContact: {
            name: response.data.EmergencyContactName,
            phone: response.data.EmergencyContactPhone,
            relation: response.data.EmergencyContactRelation
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleEdit = () => {
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await studentProfileService.verifyPassword(password);
      if (response.success) {
        setShowPasswordDialog(false);
        setIsEditing(true);
        setPassword('');
        setPasswordError('');
      }
    } catch (error) {
      setPasswordError('Invalid password');
    }
  };

  const handleSave = async () => {
    try {
      const response = await studentProfileService.updateProfile(profileData);
      if (response.success) {
        setIsEditing(false);
        loadProfile(); // Reload profile data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await studentProfileService.deleteAccount();
      if (response.success) {
        setShowDeleteDialog(false);
        logout();
        router.replace('/screens/student/login' as const);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const StatCard = ({ title, value, icon }: { title: string; value: number | string; icon: string }) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <IconButton icon={icon} size={24} iconColor={theme.colors.primary} />
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={{ color: theme.colors.secondary }}>{title}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Profile Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={80} 
            label={profileData.fullName?.substring(0, 2).toUpperCase() || 'ST'}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {profileData.fullName}
            </Text>
            <Text style={{ color: theme.colors.secondary }}>
              Room {profileData.roomNumber}
            </Text>
          </View>
          <Button 
            mode="contained" 
            onPress={isEditing ? handleSave : handleEdit}
            style={styles.editButton}
          >
            {isEditing ? 'Save' : 'Edit Profile'}
          </Button>
        </View>

        <Divider style={styles.divider} />

        {/* Contact Information */}
        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <IconButton icon="phone" size={20} />
            <TextInput
              value={profileData.phone}
              onChangeText={value => setProfileData({ ...profileData, phone: value })}
              disabled={!isEditing}
              style={{ flex: 1 }}
            />
          </View>
          <View style={styles.contactRow}>
            <IconButton icon="email" size={20} />
            <TextInput
              value={profileData.email}
              onChangeText={value => setProfileData({ ...profileData, email: value })}
              disabled={!isEditing}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Surface>

      {/* PG Journey Stats */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Your PG Journey</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Days Stayed" value={profileStats.daysStayed} icon="calendar" />
          <StatCard title="Payments" value={profileStats.paymentsCompleted} icon="credit-card" />
          <StatCard title="Events" value={profileStats.eventsParticipated} icon="star" />
          <StatCard title="Resolved" value={profileStats.complaintsResolved} icon="check-circle" />
        </View>
      </Surface>

      {/* Emergency Contact */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Emergency Contact</Text>
        <Card>
          <Card.Content>
            <View style={styles.emergencyContact}>
              <View>
                <Text style={[styles.contactLabel, { color: theme.colors.secondary }]}>Name</Text>
                <TextInput
                  value={profileData.emergencyContact.name}
                  onChangeText={value => setProfileData({
                    ...profileData,
                    emergencyContact: { ...profileData.emergencyContact, name: value }
                  })}
                  disabled={!isEditing}
                />
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: theme.colors.secondary }]}>Relation</Text>
                <TextInput
                  value={profileData.emergencyContact.relation}
                  onChangeText={value => setProfileData({
                    ...profileData,
                    emergencyContact: { ...profileData.emergencyContact, relation: value }
                  })}
                  disabled={!isEditing}
                />
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: theme.colors.secondary }]}>Phone</Text>
                <TextInput
                  value={profileData.emergencyContact.phone}
                  onChangeText={value => setProfileData({
                    ...profileData,
                    emergencyContact: { ...profileData.emergencyContact, phone: value }
                  })}
                  disabled={!isEditing}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      </Surface>

      {/* Delete Account Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Delete Account</Text>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
          Warning: This action cannot be undone. All your data will be permanently deleted.
        </Text>
        <Button 
          mode="contained"
          onPress={() => setShowDeleteDialog(true)}
          buttonColor={theme.colors.error}
        >
          Delete Account
        </Button>
      </Surface>

      {/* Password Dialog */}
      <Portal>
        <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)}>
          <Dialog.Title>Enter Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={!!passwordError}
            />
            <HelperText type="error" visible={!!passwordError}>
              {passwordError}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onPress={handlePasswordSubmit}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Logout Button */}
      <Button 
        mode="outlined" 
        onPress={logout}
        style={styles.logoutButton}
        textColor={theme.colors.error}
      >
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    borderRadius: 20,
  },
  divider: {
    marginVertical: 16,
  },
  contactInfo: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statContent: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emergencyContact: {
    gap: 12,
  },
  contactLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  feedbackInput: {
    marginBottom: 16,
  },
  submitButton: {
    marginBottom: 8,
  },
  logoutButton: {
    margin: 16,
    borderColor: 'red',
  },
}); 