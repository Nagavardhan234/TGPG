import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  TextInput, 
  Button, 
  IconButton, 
  SegmentedButtons,
  Switch,
  Chip,
  Portal,
  Modal,
  List,
  Divider
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

type EventType = 'festival' | 'birthday' | 'inspection' | 'maintenance';

interface EventForm {
  title: string;
  description: string;
  date: Date;
  time: Date;
  type: EventType;
  location?: string;
  imageUrl?: string;
  isPublic: boolean;
}

export default function CreateEventScreen() {
  const { theme } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const [formData, setFormData] = useState<EventForm>({
    title: '',
    description: '',
    date: new Date(),
    time: new Date(),
    type: 'festival',
    isPublic: true,
  });

  const eventTypes: { type: EventType; label: string; icon: string }[] = [
    { type: 'festival', label: 'Festival/Celebration', icon: 'party-popper' },
    { type: 'birthday', label: 'Birthday', icon: 'cake-variant' },
    { type: 'inspection', label: 'Inspection', icon: 'clipboard-check' },
    { type: 'maintenance', label: 'Maintenance', icon: 'tools' },
  ];

  const handleSubmit = () => {
    // Handle event creation
    router.back();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
    }
  };

  return (
    <DashboardLayout
      title="Create Event"
      subtitle="Add a new PG event"
    >
      <ScrollView style={styles.container}>
        <Surface style={[styles.section, { backgroundColor: theme?.colors?.surface }]}>
          {/* Event Type Selector */}
          <View style={styles.typeSelector}>
            <Text style={[styles.label, { color: theme?.colors?.primary }]}>Event Type</Text>
            <Button 
              mode="outlined"
              icon={eventTypes.find(t => t.type === formData.type)?.icon}
              onPress={() => setShowTypeModal(true)}
              style={styles.typeButton}
            >
              {eventTypes.find(t => t.type === formData.type)?.label}
            </Button>
          </View>

          {/* Basic Details */}
          <TextInput
            label="Event Title"
            value={formData.title}
            onChangeText={(title) => setFormData({ ...formData, title })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Description"
            value={formData.description}
            onChangeText={(description) => setFormData({ ...formData, description })}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          {/* Date & Time */}
          <View style={styles.dateTimeContainer}>
            <Button 
              mode="outlined"
              icon="calendar"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateTimeButton}
            >
              {formData.date.toLocaleDateString()}
            </Button>
            <Button 
              mode="outlined"
              icon="clock"
              onPress={() => setShowTimePicker(true)}
              style={styles.dateTimeButton}
            >
              {formData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Button>
          </View>

          {/* Location */}
          <TextInput
            label="Location (optional)"
            value={formData.location}
            onChangeText={(location) => setFormData({ ...formData, location })}
            mode="outlined"
            style={styles.input}
            right={<TextInput.Icon icon="map-marker" />}
          />

          {/* Image Upload */}
          <Button 
            mode="outlined"
            icon="image"
            onPress={pickImage}
            style={styles.imageButton}
          >
            {formData.imageUrl ? 'Change Event Image' : 'Add Event Image'}
          </Button>

          {/* Visibility Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={{ color: theme?.colors?.onSurface }}>Make Event Public</Text>
            <Switch
              value={formData.isPublic}
              onValueChange={(isPublic) => setFormData({ ...formData, isPublic })}
            />
          </View>

          {/* Submit Button */}
          <Button 
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Create Event
          </Button>
        </Surface>
      </ScrollView>

      {/* Type Selection Modal */}
      <Portal>
        <Modal
          visible={showTypeModal}
          onDismiss={() => setShowTypeModal(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme?.colors?.surface }
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme?.colors?.primary }]}>
            Select Event Type
          </Text>
          <List.Section>
            {eventTypes.map((type, index) => (
              <React.Fragment key={type.type}>
                <List.Item
                  title={type.label}
                  left={() => <List.Icon icon={type.icon} />}
                  onPress={() => {
                    setFormData({ ...formData, type: type.type });
                    setShowTypeModal(false);
                  }}
                />
                {index < eventTypes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List.Section>
        </Modal>
      </Portal>

      {/* Date & Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            date && setFormData({ ...formData, date });
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={formData.time}
          mode="time"
          onChange={(event, time) => {
            setShowTimePicker(false);
            time && setFormData({ ...formData, time });
          }}
        />
      )}
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeButton: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeButton: {
    flex: 1,
  },
  imageButton: {
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 