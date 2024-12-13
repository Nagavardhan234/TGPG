import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Avatar, Button, TextInput, Card, IconButton, Divider } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';

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
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

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
            label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {student?.FullName}
            </Text>
            <Text style={{ color: theme.colors.secondary }}>
              Room {student?.Room_No}
            </Text>
          </View>
          <Button 
            mode="contained" 
            onPress={() => setIsEditing(!isEditing)}
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
            <Text style={{ color: theme.colors.text }}>{student?.Phone}</Text>
          </View>
          <View style={styles.contactRow}>
            <IconButton icon="email" size={20} />
            <Text style={{ color: theme.colors.text }}>{student?.Email}</Text>
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
                <Text style={{ color: theme.colors.text }}>{emergencyContact.name}</Text>
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: theme.colors.secondary }]}>Relation</Text>
                <Text style={{ color: theme.colors.text }}>{emergencyContact.relation}</Text>
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: theme.colors.secondary }]}>Phone</Text>
                <Text style={{ color: theme.colors.text }}>{emergencyContact.phone}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Surface>

      {/* Feedback Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>PG Feedback</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <IconButton
              key={star}
              icon={star <= rating ? 'star' : 'star-outline'}
              size={32}
              iconColor={star <= rating ? theme.colors.primary : theme.colors.secondary}
              onPress={() => setRating(star)}
            />
          ))}
        </View>
        <TextInput
          mode="outlined"
          label="Your Feedback"
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={4}
          style={styles.feedbackInput}
        />
        <Button mode="contained" style={styles.submitButton}>
          Submit Feedback
        </Button>
      </Surface>

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