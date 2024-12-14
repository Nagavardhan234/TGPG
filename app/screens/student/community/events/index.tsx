import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  Card, 
  Button, 
  IconButton, 
  Chip,
  Avatar,
  FAB,
  SegmentedButtons
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'festival' | 'birthday' | 'inspection' | 'maintenance';
  location?: string;
  organizer: string;
  attendees: number;
  isAttending?: boolean;
}

// Dummy data
const events: Event[] = [
  {
    id: 1,
    title: "PG Diwali Celebration",
    description: "Join us for an evening of festivities, food, and fun!",
    date: "2024-03-20",
    time: "6:00 PM",
    type: "festival",
    location: "PG Common Area",
    organizer: "PG Management",
    attendees: 25,
    isAttending: true
  },
  {
    id: 2,
    title: "Monthly Room Inspection",
    description: "Regular maintenance and cleanliness check",
    date: "2024-03-25",
    time: "10:00 AM",
    type: "inspection",
    organizer: "Manager",
    attendees: 15
  }
];

export default function EventsScreen() {
  const { theme } = useTheme();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState('');

  // Create marked dates for calendar
  const markedDates = events.reduce((acc, event) => ({
    ...acc,
    [event.date]: {
      marked: true,
      dotColor: event.type === 'festival' ? theme?.colors?.primary :
                event.type === 'birthday' ? theme?.colors?.secondary :
                event.type === 'inspection' ? theme?.colors?.error :
                theme?.colors?.tertiary
    }
  }), {});

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'festival': return 'party-popper';
      case 'birthday': return 'cake-variant';
      case 'inspection': return 'clipboard-check';
      case 'maintenance': return 'tools';
    }
  };

  const renderEventCard = (event: Event) => (
    <Card 
      key={event.id}
      style={[styles.eventCard, { backgroundColor: theme?.colors?.surface }]}
      mode="elevated"
    >
      <Card.Content>
        <View style={styles.eventHeader}>
          <View style={styles.eventHeaderLeft}>
            <IconButton
              icon={getEventIcon(event.type)}
              size={24}
              iconColor={theme?.colors?.primary}
            />
            <View>
              <Text style={[styles.eventTitle, { color: theme?.colors?.onSurface }]}>
                {event.title}
              </Text>
              <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
                {event.date} at {event.time}
              </Text>
            </View>
          </View>
          <Chip 
            icon="account-group"
            style={{ backgroundColor: theme?.colors?.primaryContainer }}
          >
            {event.attendees}
          </Chip>
        </View>

        <Text style={[styles.eventDescription, { color: theme?.colors?.onSurfaceVariant }]}>
          {event.description}
        </Text>

        {event.location && (
          <View style={styles.locationContainer}>
            <IconButton icon="map-marker" size={20} />
            <Text style={{ color: theme?.colors?.onSurface }}>
              {event.location}
            </Text>
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.organizerInfo}>
            <Avatar.Text 
              size={24} 
              label={event.organizer.substring(0, 2)}
              style={{ backgroundColor: theme?.colors?.primary + '20' }}
            />
            <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
              {event.organizer}
            </Text>
          </View>
          <Button 
            mode={event.isAttending ? "contained" : "outlined"}
            onPress={() => {}}
          >
            {event.isAttending ? "Going" : "Attend"}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <DashboardLayout
      title="PG Events"
      subtitle="Stay updated with upcoming events"
    >
      <View style={styles.container}>
        <Surface style={[styles.header, { backgroundColor: theme?.colors?.surface }]}>
          <SegmentedButtons
            value={view}
            onValueChange={value => setView(value as 'calendar' | 'list')}
            buttons={[
              { value: 'calendar', label: 'Calendar', icon: 'calendar' },
              { value: 'list', label: 'List', icon: 'format-list-bulleted' }
            ]}
          />
        </Surface>

        <ScrollView>
          {view === 'calendar' ? (
            <Surface style={[styles.calendarContainer, { backgroundColor: theme?.colors?.surface }]}>
              <Calendar
                markedDates={markedDates}
                onDayPress={day => setSelectedDate(day.dateString)}
                theme={{
                  backgroundColor: theme?.colors?.surface,
                  calendarBackground: theme?.colors?.surface,
                  textSectionTitleColor: theme?.colors?.primary,
                  selectedDayBackgroundColor: theme?.colors?.primary,
                  selectedDayTextColor: theme?.colors?.onPrimary,
                  todayTextColor: theme?.colors?.primary,
                  dayTextColor: theme?.colors?.onSurface,
                  textDisabledColor: theme?.colors?.outline,
                }}
              />
            </Surface>
          ) : null}

          <View style={styles.eventsList}>
            {events.map(renderEventCard)}
          </View>
        </ScrollView>

        <FAB
          icon="plus"
          label="New Event"
          style={[styles.fab, { backgroundColor: theme?.colors?.primary }]}
          onPress={() => router.push('/screens/student/community/events/create')}
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 4,
  },
  calendarContainer: {
    margin: 16,
    borderRadius: 20,
    elevation: 4,
    padding: 16,
  },
  eventsList: {
    padding: 16,
    gap: 16,
  },
  eventCard: {
    borderRadius: 20,
    elevation: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
}); 