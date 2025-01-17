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
  useTheme as usePaperTheme,
  FAB
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
        guardianName: profileData.GuardianName,
        guardianNumber: profileData.GuardianNumber
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
    <View style={styles.container}>
      <ScrollView 
        style={{ backgroundColor: theme.colors.background }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header Card */}
        <Surface style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={profileData.FullName?.substring(0, 2).toUpperCase() || 'ST'}
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            />
            <View style={styles.nameSection}>
              {isEditing ? (
                <TextInput
                  mode="outlined"
                  label="Full Name"
                  value={profileData.FullName}
                  onChangeText={value => setProfileData({ ...profileData, FullName: value })}
                  style={styles.nameInput}
                />
              ) : (
                <Text style={styles.nameText}>{profileData.FullName}</Text>
              )}
              <Text style={styles.statusText}>{profileData.Status || 'Active'}</Text>
            </View>
          </View>
        </Surface>

        {/* Basic Info Card */}
        <Card style={styles.card}>
          <Card.Title title="Basic Information" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Room No</Text>
                <Text style={styles.infoValue}>{profileData.Room_No}</Text>
                <HelperText type="info">Contact manager to change</HelperText>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Monthly Rent</Text>
                <Text style={styles.infoValue}>₹{profileData.Monthly_Rent}</Text>
                <HelperText type="info">Set by manager</HelperText>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profileData.Phone}</Text>
                <HelperText type="info">Contact manager to update</HelperText>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profileData.Email}</Text>
                <HelperText type="info">Contact manager to update</HelperText>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Guardian Info Card */}
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
          <Card.Content style={styles.cardContent}>
            <View style={styles.guardianSection}>
              <View style={styles.guardianField}>
                <Text style={styles.fieldLabel}>Guardian Name</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={profileData.GuardianName}
                    onChangeText={value => setProfileData({ ...profileData, GuardianName: value })}
                    style={styles.input}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profileData.GuardianName || 'Not set'}</Text>
                )}
              </View>
              <View style={styles.guardianField}>
                <Text style={styles.fieldLabel}>Guardian Phone</Text>
                {isEditing ? (
                  <TextInput
                    mode="outlined"
                    value={profileData.GuardianNumber}
                    onChangeText={value => setProfileData({ ...profileData, GuardianNumber: value })}
                    style={styles.input}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profileData.GuardianNumber || 'Not set'}</Text>
                )}
              </View>
            </View>
            {isEditing && (
              <View style={styles.editActions}>
                <Button 
                  mode="contained" 
                  onPress={handleSave}
                  style={styles.saveButton}
                >
                  Save Changes
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Account Actions Card */}
        <Card style={styles.card}>
          <Card.Title title="Account Settings" />
          <Card.Content style={styles.cardContent}>
            <Button
              mode="outlined"
              icon="key"
              onPress={() => setShowPasswordChangeDialog(true)}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              Change Password
            </Button>
            <Button 
              mode="outlined"
              icon="logout"
              onPress={logout}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              Logout
            </Button>
            <Button 
              mode="outlined"
              icon="delete"
              onPress={() => setShowDeleteDialog(true)}
              textColor={theme.colors.error}
              style={[styles.actionButton, styles.deleteButton]}
              contentStyle={styles.actionButtonContent}
            >
              Delete Account
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Dialogs */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
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
              mode="outlined"
              label="Current Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              style={styles.dialogInput}
            />
            <TextInput
              mode="outlined"
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.dialogInput}
            />
            <TextInput
              mode="outlined"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden'
  },
  profileHeader: {
    padding: 24,
    alignItems: 'center'
  },
  avatar: {
    marginBottom: 16
  },
  nameSection: {
    alignItems: 'center'
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  nameInput: {
    width: '100%',
    marginBottom: 4
  },
  statusText: {
    fontSize: 16,
    opacity: 0.7
  },
  card: {
    margin: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 2
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  infoItem: {
    flex: 1,
    marginHorizontal: 8
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500'
  },
  guardianSection: {
    gap: 16
  },
  guardianField: {
    marginBottom: 8
  },
  fieldLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8
  },
  fieldValue: {
    fontSize: 16
  },
  input: {
    backgroundColor: 'transparent'
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16
  },
  saveButton: {
    minWidth: 120
  },
  actionButton: {
    marginBottom: 12
  },
  actionButtonContent: {
    justifyContent: 'flex-start',
    height: 48
  },
  deleteButton: {
    borderColor: 'rgba(255, 0, 0, 0.2)'
  },
  dialogInput: {
    marginBottom: 12
  },
  dialogText: {
    lineHeight: 20
  },
  bottomPadding: {
    height: 24
  }
});