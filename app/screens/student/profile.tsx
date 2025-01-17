import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
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
  HelperText,
  useTheme as usePaperTheme
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { studentProfileService, StudentProfile, UpdateProfileRequest } from '@/app/services/student.profile.service';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { student, logout } = useStudentAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<StudentProfile>({
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProfile().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await studentProfileService.getProfile();
      console.log('Profile response:', response); // Debug log
      if (response.success) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      const updateRequest: UpdateProfileRequest = {
        fullName: profileData.FullName,
        roomNumber: profileData.Room_No
      };
      const response = await studentProfileService.updateProfile(updateRequest);
      if (response.success) {
        setIsEditing(false);
        loadProfile();
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
        router.replace('/auth/student/login' as any);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await studentProfileService.changePassword(oldPassword, newPassword);
      if (response.success) {
        setShowPasswordChangeDialog(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordChangeError('');
      }
    } catch (error) {
      setPasswordChangeError('Failed to change password');
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar.Text 
              size={80} 
              label={profileData.FullName?.substring(0, 2).toUpperCase() || 'ST'}
              style={{ backgroundColor: theme.colors.primary }}
            />
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.headerRow}>
              <Text style={styles.label}>Full Name:</Text>
              {isEditing ? (
                <TextInput
                  mode="outlined"
                  value={profileData.FullName}
                  onChangeText={value => setProfileData({ ...profileData, FullName: value })}
                  style={styles.input}
                />
              ) : (
                <Text style={styles.value}>{profileData.FullName}</Text>
              )}
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.label}>Room Number:</Text>
              {isEditing ? (
                <TextInput
                  mode="outlined"
                  value={profileData.Room_No.toString()}
                  onChangeText={value => setProfileData({ ...profileData, Room_No: parseInt(value) || 0 })}
                  style={styles.input}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.value}>{profileData.Room_No}</Text>
              )}
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{profileData.Email}</Text>
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{profileData.Phone}</Text>
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.label}>Monthly Rent:</Text>
              <Text style={styles.value}>{profileData.Monthly_Rent}</Text>
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{profileData.Status}</Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Guardian Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Guardian Information</Text>
          <View style={styles.guardianInfo}>
            <View style={styles.contactRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{profileData.GuardianName}</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{profileData.GuardianNumber}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <>
              <Button 
                mode="contained" 
                onPress={handleSave}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              >
                Save Changes
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => setIsEditing(false)}
                style={styles.actionButton}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              mode="contained" 
              onPress={() => setIsEditing(true)}
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            >
              Edit Profile
            </Button>
          )}
        </View>
      </Surface>

      {/* Account Actions */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Account Actions</Text>
        <View style={styles.accountActions}>
          <Button
            mode="contained-tonal"
            icon="key"
            onPress={() => setShowPasswordChangeDialog(true)}
            style={styles.accountButton}
          >
            Change Password
          </Button>
          <Button 
            mode="contained-tonal"
            icon="logout"
            onPress={logout}
            style={styles.accountButton}
          >
            Logout
          </Button>
          <Button 
            mode="contained"
            icon="delete"
            onPress={() => setShowDeleteDialog(true)}
            buttonColor={theme.colors.error}
            style={styles.accountButton}
          >
            Delete Account
          </Button>
        </View>
      </Surface>

      {/* Dialogs */}
      <Portal>
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

        <Dialog visible={showPasswordChangeDialog} onDismiss={() => setShowPasswordChangeDialog(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              style={styles.dialogInput}
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.dialogInput}
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.dialogInput}
            />
            {passwordChangeError ? (
              <HelperText type="error">{passwordChangeError}</HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordChangeDialog(false)}>Cancel</Button>
            <Button onPress={handleChangePassword}>Change Password</Button>
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
  header: {
    padding: 20,
    elevation: 2,
    margin: 16,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  headerInfo: {
    width: '100%',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 100,
  },
  value: {
    fontSize: 16,
    flex: 1,
  },
  divider: {
    marginVertical: 16,
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
  guardianInfo: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  accountActions: {
    gap: 12,
  },
  accountButton: {
    width: '100%',
  },
  dialogInput: {
    marginBottom: 12,
  },
});