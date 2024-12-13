import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Surface, 
  Text, 
  TextInput, 
  Button, 
  Card, 
  IconButton, 
  Chip,
  SegmentedButtons,
  ProgressBar
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

interface ServiceRating {
  id: string;
  name: string;
  rating: number;
  icon: string;
}

interface Suggestion {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'under_review' | 'implemented' | 'declined';
  timestamp: string;
  upvotes: number;
  yourVote?: boolean;
}

// Dummy data
const services: ServiceRating[] = [
  { id: 'food', name: 'Food Quality', rating: 0, icon: 'food' },
  { id: 'cleanliness', name: 'Cleanliness', rating: 0, icon: 'broom' },
  { id: 'maintenance', name: 'Maintenance', rating: 0, icon: 'tools' },
  { id: 'security', name: 'Security', rating: 0, icon: 'shield-check' },
  { id: 'internet', name: 'Internet', rating: 0, icon: 'wifi' },
];

const suggestions: Suggestion[] = [
  {
    id: 1,
    title: 'Weekend Movie Nights',
    description: 'Organize weekly movie screenings in the common area',
    category: 'Entertainment',
    status: 'under_review',
    timestamp: '2024-03-15',
    upvotes: 12,
    yourVote: true,
  },
  {
    id: 2,
    title: 'Gym Equipment',
    description: 'Add more weights to the gym',
    category: 'Facilities',
    status: 'pending',
    timestamp: '2024-03-14',
    upvotes: 8,
  },
];

export default function SuggestionsScreen() {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'rate' | 'suggest'>('rate');
  const [serviceRatings, setServiceRatings] = useState<ServiceRating[]>(services);
  const [newSuggestion, setNewSuggestion] = useState({
    title: '',
    description: '',
    category: '',
  });

  const getStatusColor = (status: Suggestion['status']) => {
    switch (status) {
      case 'implemented':
        return theme.colors.success;
      case 'under_review':
        return theme.colors.primary;
      case 'declined':
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };

  const handleRating = (serviceId: string, rating: number) => {
    setServiceRatings(prev => 
      prev.map(service => 
        service.id === serviceId ? { ...service, rating } : service
      )
    );
  };

  const RatingStars = ({ serviceId, currentRating }: { serviceId: string; currentRating: number }) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <IconButton
          key={star}
          icon={star <= currentRating ? 'star' : 'star-outline'}
          size={24}
          iconColor={star <= currentRating ? theme.colors.primary : theme.colors.secondary}
          onPress={() => handleRating(serviceId, star)}
        />
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SegmentedButtons
        value={selectedTab}
        onValueChange={value => setSelectedTab(value as typeof selectedTab)}
        buttons={[
          { value: 'rate', label: 'Rate Services' },
          { value: 'suggest', label: 'Suggestions' },
        ]}
        style={styles.tabButtons}
      />

      {selectedTab === 'rate' ? (
        // Services Rating Section
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Rate Our Services
          </Text>
          {serviceRatings.map(service => (
            <Card key={service.id} style={styles.ratingCard}>
              <Card.Content>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <IconButton icon={service.icon} size={24} iconColor={theme.colors.primary} />
                    <Text style={{ color: theme.colors.text }}>{service.name}</Text>
                  </View>
                  <RatingStars serviceId={service.id} currentRating={service.rating} />
                </View>
                {service.rating > 0 && (
                  <ProgressBar
                    progress={service.rating / 5}
                    color={theme.colors.primary}
                    style={styles.ratingProgress}
                  />
                )}
              </Card.Content>
            </Card>
          ))}
          <Button 
            mode="contained" 
            style={styles.submitButton}
            onPress={() => {/* Handle ratings submission */}}
          >
            Submit Ratings
          </Button>
        </Surface>
      ) : (
        // Suggestions Section
        <View>
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              New Suggestion
            </Text>
            <TextInput
              mode="outlined"
              label="Title"
              value={newSuggestion.title}
              onChangeText={title => setNewSuggestion({ ...newSuggestion, title })}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Description"
              value={newSuggestion.description}
              onChangeText={description => setNewSuggestion({ ...newSuggestion, description })}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Category"
              value={newSuggestion.category}
              onChangeText={category => setNewSuggestion({ ...newSuggestion, category })}
              style={styles.input}
            />
            <Button 
              mode="contained" 
              style={styles.submitButton}
              onPress={() => {/* Handle suggestion submission */}}
            >
              Submit Suggestion
            </Button>
          </Surface>

          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Recent Suggestions
            </Text>
            {suggestions.map(suggestion => (
              <Card key={suggestion.id} style={styles.suggestionCard}>
                <Card.Content>
                  <View style={styles.suggestionHeader}>
                    <Text style={[styles.suggestionTitle, { color: theme.colors.text }]}>
                      {suggestion.title}
                    </Text>
                    <Chip
                      mode="flat"
                      textStyle={{ color: theme.colors.surface }}
                      style={{ backgroundColor: getStatusColor(suggestion.status) }}
                    >
                      {suggestion.status.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </View>
                  <Text style={{ color: theme.colors.secondary }}>
                    {suggestion.category} • {suggestion.timestamp}
                  </Text>
                  <Text style={[styles.suggestionDescription, { color: theme.colors.text }]}>
                    {suggestion.description}
                  </Text>
                  <View style={styles.suggestionFooter}>
                    <Button
                      icon={suggestion.yourVote ? 'thumb-up' : 'thumb-up-outline'}
                      mode="outlined"
                      onPress={() => {/* Handle vote */}}
                    >
                      {suggestion.upvotes} Upvotes
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </Surface>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabButtons: {
    margin: 16,
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
  ratingCard: {
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  suggestionCard: {
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionDescription: {
    marginVertical: 8,
    lineHeight: 20,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
}); 