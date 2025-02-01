import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Platform } from 'react-native';
import { Text, Card, Button, TextInput, Avatar, IconButton, HelperText, useTheme, Portal, Dialog } from 'react-native-paper';
import { studentProfileService, StudentProfile } from '@/app/services/student.profile.service';

export default function ProfileScreen() {
  const theme = useTheme();
  const [profile, setProfile] = useState<StudentProfile>({
    StudentID: 0,
    FullName: '',
    Email: '',
    Phone: '',
    Room_No: 0,
    MoveInDate: '',
    MoveOutDate: null,
    PGID: 0,
    Status: '',
    Monthly_Rent: '',
    GuardianName: '',
    GuardianNumber: '',
    CreatedAt: '',
    UpdatedAt: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedGuardianName, setEditedGuardianName] = useState('');
  const [editedGuardianNumber, setEditedGuardianNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProfile().finally(() => setRefreshing(false));
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await studentProfileService.getProfile();
      if (response.success) {
        setProfile(response.data);
        setEditedName(response.data.FullName);
        setEditedGuardianName(response.data.GuardianName || '');
        setEditedGuardianNumber(response.data.GuardianNumber || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await studentProfileService.updateProfile({
        fullName: editedName,
        guardianName: editedGuardianName,
        guardianNumber: editedGuardianNumber
      });
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          FullName: editedName,
          GuardianName: editedGuardianName,
          GuardianNumber: editedGuardianNumber
        }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Text 
              size={80} 
              label={profile.FullName?.substring(0, 2).toUpperCase() || 'ST'}
              style={styles.avatar}
            />
            <View style={styles.headerInfo}>
              {isEditing ? (
                <TextInput
                  mode="outlined"
                  label="Full Name"
                  value={editedName}
                  onChangeText={setEditedName}
                  style={styles.input}
                />
              ) : (
                <Text variant="headlineSmall">{profile.FullName}</Text>
              )}
              <Text variant="bodyMedium" style={styles.statusText}>{profile.Status || 'Active'}</Text>
            </View>
            {!isEditing && (
              <IconButton
                icon="pencil"
                onPress={() => setIsEditing(true)}
              />
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Basic Information */}
      <Card style={styles.card}>
        <Card.Title title="Basic Information" />
        <Card.Content>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text variant="bodySmall">Room No</Text>
              <Text variant="bodyLarge">{profile.Room_No}</Text>
              <HelperText type="info">Contact manager to change</HelperText>
            </View>
            <View style={styles.infoItem}>
              <Text variant="bodySmall">Monthly Rent</Text>
              <Text variant="bodyLarge">₹{profile.Monthly_Rent}</Text>
              <HelperText type="info">Set by manager</HelperText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text variant="bodySmall">Phone</Text>
              <Text variant="bodyLarge">{profile.Phone}</Text>
              <HelperText type="info">Contact manager to update</HelperText>
            </View>
            <View style={styles.infoItem}>
              <Text variant="bodySmall">Email</Text>
              <Text variant="bodyLarge">{profile.Email || 'Not set'}</Text>
              <HelperText type="info">Contact manager to update</HelperText>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Guardian Information */}
      <Card style={styles.card}>
        <Card.Title 
          title="Guardian Information"
          right={(props) => !isEditing && (
            <IconButton 
              {...props} 
              icon="pencil" 
              onPress={() => setIsEditing(true)}
            />
          )}
        />
        <Card.Content>
          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                mode="outlined"
                label="Guardian Name"
                value={editedGuardianName}
                onChangeText={setEditedGuardianName}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Guardian Phone"
                value={editedGuardianNumber}
                onChangeText={setEditedGuardianNumber}
                keyboardType="phone-pad"
                style={styles.input}
              />
              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={loading}
                  style={styles.button}
                >
                  Save Changes
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsEditing(false);
                    setEditedName(profile.FullName);
                    setEditedGuardianName(profile.GuardianName || '');
                    setEditedGuardianNumber(profile.GuardianNumber || '');
                  }}
                  style={styles.button}
                >
                  Cancel
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text variant="bodySmall">Guardian Name</Text>
                <Text variant="bodyLarge">{profile.GuardianName || 'Not provided'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="bodySmall">Guardian Phone</Text>
                <Text variant="bodyLarge">{profile.GuardianNumber || 'Not provided'}</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={() => setShowPasswordDialog(true)}
            style={styles.button}
          >
            Change Password
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowDeleteDialog(true)}
            style={[styles.button, styles.deleteButton]}
            textColor={theme.colors.error}
          >
            Delete Account
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.select({
      ios: 16,
      android: 16,
      default: 24
    })
  },
  card: {
    borderRadius: 12,
    padding: Platform.select({
      ios: 16,
      android: 16,
      default: 20
    }),
    marginBottom: 16,
    width: '100%',
    maxWidth: Platform.select({
      ios: '100%',
      android: '100%',
      default: 600
    }),
    alignSelf: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
    fontSize: Platform.select({
      ios: 16,
      android: 16,
      default: 14
    })
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    marginRight: 8,
  },
  editForm: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    marginTop: 8,
  },
  deleteButton: {
    borderColor: 'red',
  },
  statusText: {
    marginTop: 4,
    opacity: 0.7,
  },
});