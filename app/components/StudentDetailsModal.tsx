import React, { useState } from 'react';
import { View, StyleSheet, Animated, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, Avatar, IconButton } from 'react-native-paper';
import { Student } from '@/app/services/student.service';
import { useTheme } from '@/app/context/ThemeContext';
import { MotiView } from 'moti';
import { getStatusColor } from '@/app/utils/theme';

interface StudentDetailsModalProps {
  visible: boolean;
  onDismiss: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  visible,
  onDismiss,
  student,
  onEdit,
  onDelete
}) => {
  const { theme } = useTheme();

  if (!student) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.content}
        >
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            style={styles.closeButton}
          />
          
          <View style={styles.header}>
            <Avatar.Text
              size={80}
              label={student.FullName.substring(0, 2).toUpperCase()}
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            />
            <Text style={[styles.name, { color: theme.colors.onSurface }]}>
              {student.FullName}
            </Text>
            <View style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(student.Status, theme) }
            ]}>
              <Text style={styles.statusText}>{student.Status}</Text>
            </View>
          </View>

          <ScrollView style={styles.detailsScroll}>
            <View style={styles.detailsContainer}>
              <DetailItem 
                label="Phone"
                value={student.Phone}
                icon="phone"
                theme={theme}
              />
              <DetailItem 
                label="Email"
                value={student.Email}
                icon="email"
                theme={theme}
              />
              <DetailItem 
                label="Room Number"
                value={student.Room_No}
                icon="door"
                theme={theme}
              />
              <DetailItem 
                label="Monthly Rent"
                value={`₹${student.Monthly_Rent}`}
                icon="currency-inr"
                theme={theme}
              />
              <DetailItem 
                label="Guardian Name"
                value={student.GuardianName}
                icon="account-child"
                theme={theme}
              />
              <DetailItem 
                label="Guardian Phone"
                value={student.GuardianNumber}
                icon="phone-classic"
                theme={theme}
              />
              <DetailItem 
                label="Join Date"
                value={new Date(student.MoveInDate).toLocaleDateString()}
                icon="calendar"
                theme={theme}
              />
            </View>
          </ScrollView>

          <View style={[
            styles.actionButtons,
            { borderTopColor: theme.colors.surfaceVariant }
          ]}>
            <Button 
              mode="contained-tonal"
              icon="pencil"
              onPress={() => onEdit(student)}
              style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]}
            >
              Edit
            </Button>
            <Button 
              mode="contained-tonal"
              icon="delete"
              onPress={() => onDelete(student)}
              style={[styles.actionButton, { backgroundColor: theme.colors.errorContainer }]}
              textColor={theme.colors.error}
            >
              Delete
            </Button>
          </View>
        </MotiView>
      </Modal>
    </Portal>
  );
};

const DetailItem = ({ label, value, icon, theme, isPassword = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.detailItem}>
      <Avatar.Icon 
        size={40} 
        icon={icon}
        style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}
      />
      <View style={styles.detailText}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {isPassword ? (showPassword ? value || '' : '••••••') : (value || '-')}
          </Text>
          {isPassword && (
            <IconButton
              icon={showPassword ? "eye-off" : "eye"}
              size={20}
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              iconColor={theme.colors.primary}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 0,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  content: {
    height: '100%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContainer: {
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginRight: 15,
  },
  detailText: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  eyeIcon: {
    margin: 0,
    padding: 0,
    width: 32,
    height: 32,
  }
}); 